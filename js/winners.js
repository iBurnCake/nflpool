// js/winners.js
import {
  db, ref, get, update, onValue, off, auth
} from './firebaseConfig.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';   // your admin UID
const ENTRY_FEE = 5;                                  // dollars per pool member

/* ----------------- small utils ----------------- */
const toNum = (x) => (typeof x === 'number' ? x : Number(x) || 0);
const norm  = (s) => String(s ?? '').trim().toLowerCase();

function winnerString(v) {
  // Support "Ravens" or { winner: "Ravens" } or { team/name: "Ravens" }
  return (typeof v === 'string')
    ? v
    : (v && (v.winner || v.team || v.name));
}

/**
 * Determine which game indices we expect winners for:
 * 1) Prefer winners/<weekKey>/gameCount (keys 0..count-1)
 * 2) Else infer from scoreboards/<weekKey> (union of picked indices)
 * 3) Else fallback to whatever exists under winners/<weekKey>/games now
 */
async function getExpectedGameKeys(weekKey, winnersByGame) {
  // 1) explicit gameCount
  const cntSnap = await get(ref(db, `winners/${weekKey}/gameCount`));
  if (cntSnap.exists()) {
    const count = Number(cntSnap.val()) || 0;
    if (count > 0) {
      return new Set(Array.from({ length: count }, (_, i) => String(i)));
    }
  }

  // 2) infer from scoreboard picks
  const sbSnap = await get(ref(db, `scoreboards/${weekKey}`));
  if (sbSnap.exists()) {
    const keys = new Set();
    const board = sbSnap.val() || {};
    for (const picks of Object.values(board)) {
      if (!picks || typeof picks !== 'object') continue;
      for (const k of Object.keys(picks)) keys.add(String(k));
    }
    if (keys.size > 0) return keys;
  }

  // 3) fallback: whatever is present in winnersByGame
  return new Set(Object.keys(winnersByGame || {}));
}

function winnersComplete(winnersByGame, expectedKeys) {
  if (!expectedKeys || expectedKeys.size === 0) return false;
  for (const k of expectedKeys) {
    const w = winnerString(winnersByGame[k]);
    if (!w || String(w).trim() === '') return false;
  }
  return true;
}

/* ------------ score one user's picks ------------ */
function scoreUser(picksObj, winnersByGame) {
  if (!picksObj || !winnersByGame) return 0;
  let total = 0;

  for (const [gameKey, winObj] of Object.entries(winnersByGame)) {
    const wTeam = winnerString(winObj);
    if (!wTeam) continue;

    const p = picksObj[gameKey];
    if (!p) continue;

    const userPick = p.pick ?? p.selected ?? p.team ?? p.choice ?? p.selectedTeam;
    const pts      = toNum(p.confidence ?? p.points ?? p.confidencePoints ?? 0);

    if (userPick && norm(userPick) === norm(wTeam)) total += pts;
  }
  return total;
}

/* ------------- build leaderboards -------------- */
async function buildLeaderboards(weekKey, winnersByGame) {
  // everyone who made picks this week
  const sbSnap = await get(ref(db, `scoreboards/${weekKey}`));
  const scoreboards = sbSnap.exists() ? (sbSnap.val() || {}) : {};

  // money-pool members for the week
  const poolSnap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const poolMembers = poolSnap.exists() ? (poolSnap.val() || {}) : {};

  const houseScores = {};
  const poolScores  = {};

  for (const [uid, picksObj] of Object.entries(scoreboards)) {
    const s = scoreUser(picksObj, winnersByGame);
    houseScores[uid] = s;
    if (poolMembers[uid]) poolScores[uid] = s;
  }

  const houseWinners = maxKeys(houseScores);
  const poolWinners  = maxKeys(poolScores);

  return { houseScores, poolScores, houseWinners, poolWinners };
}

function maxKeys(map) {
  let max = -Infinity;
  const winners = [];
  for (const [k, v] of Object.entries(map)) {
    const n = toNum(v);
    if (n > max) { max = n; winners.length = 0; winners.push(k); }
    else if (n === max) { winners.push(k); }
  }
  return winners;
}

/* ------------- finalize + persist --------------- */
async function computeAndSaveWinners(weekKey) {
  const winSnap = await get(ref(db, `winners/${weekKey}/games`));
  if (!winSnap.exists()) return { ran:false, reason:'no winners yet' };

  const winnersByGame = winSnap.val() || {};
  if (!Object.keys(winnersByGame).length) return { ran:false, reason:'empty winners node' };

  const { houseScores, poolScores, houseWinners, poolWinners } =
    await buildLeaderboards(weekKey, winnersByGame);

  // Always persist the current leaderboards/winners (helps UI live-update)
  const patch = {
    [`winners/${weekKey}/houseLeaderboard`]: houseScores,
    [`winners/${weekKey}/moneyPoolLeaderboard`]: poolScores,
    [`winners/${weekKey}/houseWinners`]: houseWinners,
    [`winners/${weekKey}/moneyPoolWinners`]: poolWinners,
    [`winners/${weekKey}/lastComputedAt`]: Date.now(),
  };
  await update(ref(db), patch);

  // Flexible completion check (supports <16 games)
  const expectedKeys = await getExpectedGameKeys(weekKey, winnersByGame);
  const complete = winnersComplete(winnersByGame, expectedKeys);

  // Only award when all expected winners are set — no early payouts
  if (complete) {
    await awardWeekPayoutsAndWins(weekKey, houseWinners, poolWinners);
  }

  return { ran:true };
}

// --- backfill-aware awarder: grants missing awards even if awardedStats=true ---
async function awardWeekPayoutsAndWins(weekKey, houseWinners = [], poolWinners = []) {
  // Admin gate
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) return;

  // Compute the pot and per-winner payout (split on ties in the pool)
  const membersSnap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const members = membersSnap.exists() ? (membersSnap.val() || {}) : {};
  const memberCount = Object.values(members).filter(Boolean).length;
  const pot = ENTRY_FEE * memberCount;

  const mpCount = poolWinners.length;
  const payoutPerWinner = mpCount > 0 ? Math.floor(pot / mpCount) : 0;

  // We’ll award both house and pool winners a +1 weeksWon (union),
  // and only pool winners receive the payout to totalWon.
  const allWinners = [...new Set([...houseWinners, ...poolWinners])];

  // Build updates ONLY for winners who are missing the award for this week
  const updates = {};
  let didAnyUpdate = false;

  for (const uid of allWinners) {
    // Per-user idempotency: skip if user already has this week's award flag.
    const hasAwardSnap = await get(ref(db, `users/${uid}/awards/${weekKey}`));
    if (hasAwardSnap.exists()) continue;

    // weeksWon +1
    const weeksSnap = await get(ref(db, `users/${uid}/stats/weeksWon`));
    const curWeeks = weeksSnap.exists() ? (Number(weeksSnap.val()) || 0) : 0;
    updates[`users/${uid}/stats/weeksWon`] = curWeeks + 1;

    // money pool payout only if they’re in the pool winners list
    if (poolWinners.includes(uid)) {
      const wonSnap = await get(ref(db, `users/${uid}/stats/totalWon`));
      const curWon = wonSnap.exists() ? (Number(wonSnap.val()) || 0) : 0;
      updates[`users/${uid}/stats/totalWon`] = curWon + payoutPerWinner;
    }

    // mark the per-user award flag
    updates[`users/${uid}/awards/${weekKey}`] = true;

    didAnyUpdate = true;
  }

  // Always write bookkeeping values; harmless to overwrite
  updates[`winners/${weekKey}/pot`] = pot;
  updates[`winners/${weekKey}/payoutPerWinner`] = payoutPerWinner;

  // Keep the coarse flag true to signal “we’ve processed this week”,
  // but thanks to the per-user check above, re-running is safe.
  updates[`winners/${weekKey}/awardedStats`] = true;

  if (didAnyUpdate) {
    await update(ref(db), updates);
  } else {
    // Still persist pot/payout even if no one needed updates
    await update(ref(db), {
      [`winners/${weekKey}/pot`]: pot,
      [`winners/${weekKey}/payoutPerWinner`]: payoutPerWinner,
      [`winners/${weekKey}/awardedStats`]: true,
    });
  }
}

/* ------- legacy helper (kept for compat) -------- */
async function awardWeekWinsOnce() {
  // No-op now; handled in awardWeekPayoutsAndWins
  return;
}

/* -------- live watch / manual finalize ----------- */
let _unsubscribe;
export function watchAndFinalizeWeek(weekKey) {
  if (_unsubscribe) off(ref(db, `winners/${weekKey}/games`), _unsubscribe);
  const cb = async () => {
    try { await computeAndSaveWinners(weekKey); }
    catch (e) { console.warn('computeAndSaveWinners error:', e); }
  };
  _unsubscribe = onValue(ref(db, `winners/${weekKey}/games`), cb);
}

export async function finalizeWeekOnce(weekKey) {
  try { return await computeAndSaveWinners(weekKey); }
  catch (e) { console.warn('finalizeWeekOnce error:', e); return { ran:false, reason:String(e) }; }
}

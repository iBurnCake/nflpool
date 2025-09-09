// js/winners.js
import { db, ref, get, update, auth } from './firebaseConfig.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';   // your admin UID
const ENTRY_FEE = 5;                                  // dollars per pool member

/* ----------------- small utils ----------------- */
const toNum = (x) => (typeof x === 'number' ? x : Number(x) || 0);
const norm  = (s) => String(s ?? '').trim().toLowerCase();

function winnerString(v) {
  // supports "Ravens" or { winner: "Ravens" } or { team/name: "Ravens" }
  return (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name));
}

/**
 * Determine expected game keys for a week:
 * 1) winners/<week>/gameCount -> 0..count-1
 * 2) else infer from scoreboards/<week> (union of picked indices)
 * 3) else fallback to whatever exists under winners/<week>/games
 */
async function getExpectedGameKeys(weekKey, winnersByGame) {
  const cntSnap = await get(ref(db, `winners/${weekKey}/gameCount`));
  if (cntSnap.exists()) {
    const count = Number(cntSnap.val()) || 0;
    if (count > 0) return new Set(Array.from({ length: count }, (_, i) => String(i)));
  }

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
  const sbSnap = await get(ref(db, `scoreboards/${weekKey}`));
  const scoreboards = sbSnap.exists() ? (sbSnap.val() || {}) : {};

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
/**
 * This is only called by the Admin Console "Finalize" button.
 * - Writes leaderboards under /winners/<weekKey>
 * - If ALL expected games have winners, awards weeksWon + money payouts
 */
async function computeAndSaveWinners(weekKey) {
  const winSnap = await get(ref(db, `winners/${weekKey}/games`));
  if (!winSnap.exists()) return { ran:false, reason:'no winners yet' };

  const winnersByGame = winSnap.val() || {};
  if (!Object.keys(winnersByGame).length) return { ran:false, reason:'empty winners node' };

  const { houseScores, poolScores, houseWinners, poolWinners } =
    await buildLeaderboards(weekKey, winnersByGame);

  // Persist current leaderboards/winners (so UI can read them)
  const patch = {
    [`winners/${weekKey}/houseLeaderboard`]: houseScores,
    [`winners/${weekKey}/moneyPoolLeaderboard`]: poolScores,
    [`winners/${weekKey}/houseWinners`]: houseWinners,
    [`winners/${weekKey}/moneyPoolWinners`]: poolWinners,
    [`winners/${weekKey}/lastComputedAt`]: Date.now(),
  };
  await update(ref(db), patch);

  // Only award when all expected winners are set (supports <16 games)
  const expectedKeys = await getExpectedGameKeys(weekKey, winnersByGame);
  const complete = winnersComplete(winnersByGame, expectedKeys);

  if (!complete) {
    return { ran:true, awarded:false, reason:'winners incomplete' };
  }

  const { pot, payoutPerWinner, updatedUsers } =
    await awardWeekPayoutsAndWins(weekKey, houseWinners, poolWinners);

  return { ran:true, awarded:true, pot, payoutPerWinner, updatedUsers };
}

/* -------- award weeksWon + money-pool payout ----- */
/* Idempotent: per-user award flag prevents double credit. */
async function awardWeekPayoutsAndWins(weekKey, houseWinners = [], poolWinners = []) {
  // Admin gate (must be signed in as admin to award)
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
    return { pot:0, payoutPerWinner:0, updatedUsers:[] };
  }

  // Pot from subscriberPools
  const membersSnap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const members = membersSnap.exists() ? (membersSnap.val() || {}) : {};
  const memberCount = Object.values(members).filter(Boolean).length;
  const pot = ENTRY_FEE * memberCount;

  const mpCount = poolWinners.length;
  const payoutPerWinner = mpCount > 0 ? Math.floor(pot / mpCount) : 0;

  const allWinners = [...new Set([...houseWinners, ...poolWinners])];

  const updates = {};
  const updatedUsers = [];

  for (const uid of allWinners) {
    // skip if this user already got this week's award
    const hasAwardSnap = await get(ref(db, `users/${uid}/awards/${weekKey}`));
    if (hasAwardSnap.exists()) continue;

    // weeksWon +1
    const wSnap = await get(ref(db, `users/${uid}/stats/weeksWon`));
    const curW = wSnap.exists() ? toNum(wSnap.val()) : 0;
    updates[`users/${uid}/stats/weeksWon`] = curW + 1;

    // money pool payout only for pool winners
    if (poolWinners.includes(uid)) {
      const tSnap = await get(ref(db, `users/${uid}/stats/totalWon`));
      const curT = tSnap.exists() ? toNum(tSnap.val()) : 0;
      updates[`users/${uid}/stats/totalWon`] = curT + payoutPerWinner;
    }

    // per-user award flag
    updates[`users/${uid}/awards/${weekKey}`] = true;
    updatedUsers.push(uid);
  }

  // bookkeeping
  updates[`winners/${weekKey}/pot`] = pot;
  updates[`winners/${weekKey}/payoutPerWinner`] = payoutPerWinner;
  updates[`winners/${weekKey}/awardedStats`] = true; // coarse flag; safe to keep true

  if (updatedUsers.length > 0) {
    await update(ref(db), updates);
  } else {
    // still record pot/payout even if no one needed updates
    await update(ref(db), {
      [`winners/${weekKey}/pot`]: pot,
      [`winners/${weekKey}/payoutPerWinner`]: payoutPerWinner,
      [`winners/${weekKey}/awardedStats`]: true
    });
  }

  return { pot, payoutPerWinner, updatedUsers };
}

/* -------- manual-only finalize (admin console) --- */
export async function finalizeWeekOnce(weekKey) {
  try { return await computeAndSaveWinners(weekKey); }
  catch (e) { console.warn('finalizeWeekOnce error:', e); return { ran:false, reason:String(e) }; }
}

/* -------- disabled live watcher (no-op) ---------- */
/* Keep export for compatibility; does nothing. */
export function watchAndFinalizeWeek() {
  // intentionally no-op: finalize is manual via admin console
}

// js/winners.js
import {
  db, ref, get, update, onValue, off, auth
} from './firebaseConfig.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2'; // your admin UID

/** Derive a user's weekly score from scoreboards + winners map */
function scoreUser(picksObj, winnersByGame) {
  if (!picksObj || !winnersByGame) return 0;
  let total = 0;

  for (const [gameKey, winObj] of Object.entries(winnersByGame)) {
    const wTeam = (typeof winObj === 'string')
      ? winObj
      : (winObj && (winObj.winner || winObj.team || winObj.name));

    const p = picksObj[gameKey];
    if (!p || !wTeam) continue;

    const userPick =
      p.pick ?? p.selected ?? p.team ?? p.choice ?? p.selectedTeam;
    const pts =
      Number(p.confidence ?? p.points ?? p.confidencePoints ?? 0);

    if (userPick && wTeam && String(userPick).toLowerCase() === String(wTeam).toLowerCase()) {
      total += pts;
    }
  }
  return total;
}

/** Build leaderboards (house + pool subset) */
async function buildLeaderboards(weekKey, winnersByGame) {
  // Everyone who made picks this week
  const sbSnap = await get(ref(db, `scoreboards/${weekKey}`));
  const scoreboards = sbSnap.exists() ? (sbSnap.val() || {}) : {};

  // Members of the money pool for that week
  const poolSnap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const poolMembers = poolSnap.exists() ? (poolSnap.val() || {}) : {};

  const houseScores = {};      // { uid: number }
  const poolScores  = {};      // { uid: number }

  for (const [uid, picksObj] of Object.entries(scoreboards)) {
    const s = scoreUser(picksObj, winnersByGame);
    houseScores[uid] = s;
    if (poolMembers[uid]) poolScores[uid] = s;
  }

  // winners (handle ties)
  const topHouse = maxKeys(houseScores);
  const topPool  = maxKeys(poolScores);

  return {
    houseScores,
    poolScores,
    houseWinners: topHouse,
    poolWinners: topPool
  };
}

function maxKeys(map) {
  let max = -Infinity;
  const winners = [];
  for (const [k, v] of Object.entries(map)) {
    const n = Number(v) || 0;
    if (n > max) { max = n; winners.length = 0; winners.push(k); }
    else if (n === max) { winners.push(k); }
  }
  return winners;
}

/** Idempotent “finalize” write; stores leaderboards + winners */
async function computeAndSaveWinners(weekKey) {
  const winSnap = await get(ref(db, `winners/${weekKey}/games`));
  if (!winSnap.exists()) return { ran:false, reason:'no winners yet' };

  const winnersByGame = winSnap.val() || {};
  // Nothing to do if not a single result set
  if (!Object.keys(winnersByGame).length) return { ran:false, reason:'empty winners node' };

  const {
    houseScores, poolScores, houseWinners, poolWinners
  } = await buildLeaderboards(weekKey, winnersByGame);

  // Write leaderboards + winners (admin-only path)
  const patch = {
    [`winners/${weekKey}/houseLeaderboard`]: houseScores,
    [`winners/${weekKey}/moneyPoolLeaderboard`]: poolScores,
    [`winners/${weekKey}/houseWinners`]: houseWinners,
    [`winners/${weekKey}/moneyPoolWinners`]: poolWinners,
    [`winners/${weekKey}/lastComputedAt`]: Date.now(),
  };
  await update(ref(db), patch);

  // Optionally bump weeksWon exactly once per person across both
  await awardWeekWinsOnce(weekKey, new Set([...houseWinners, ...poolWinners]));

  return { ran:true };
}

async function awardWeekWinsOnce(weekKey, winnerSet) {
  // Gate by admin + idempotency flag to avoid double-awards
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) return;
  const awardedFlagRef = ref(db, `winners/${weekKey}/awardedStats`);
  const flagSnap = await get(awardedFlagRef);
  if (flagSnap.exists()) return; // already awarded

  const updates = {};
  for (const uid of winnerSet) {
    // Mark per-user award to be safe if you ever want to re-run per user
    updates[`users/${uid}/awards/${weekKey}`] = true;

    // read-modify-write weeksWon safely
    // (small race risk if you have multiple admins, but fine for single admin)
    const wSnap = await get(ref(db, `users/${uid}/stats/weeksWon`));
    const cur = wSnap.exists() ? Number(wSnap.val()) || 0 : 0;
    updates[`users/${uid}/stats/weeksWon`] = cur + 1;
  }
  updates[`winners/${weekKey}/awardedStats`] = true;
  await update(ref(db), updates);
}

/** Start a listener that recomputes whenever winners change. */
let _unsubscribe;
export function watchAndFinalizeWeek(weekKey) {
  if (_unsubscribe) off(ref(db, `winners/${weekKey}/games`), _unsubscribe);
  const cb = async () => {
    try { await computeAndSaveWinners(weekKey); } catch (e) {
      console.warn('computeAndSaveWinners error:', e);
    }
  };
  _unsubscribe = onValue(ref(db, `winners/${weekKey}/games`), cb);
}

/** One-off manual run (useful if you don’t want a live listener) */
export async function finalizeWeekOnce(weekKey) {
  try { return await computeAndSaveWinners(weekKey); }
  catch (e) { console.warn('finalizeWeekOnce error:', e); return { ran:false, reason:String(e) }; }
}

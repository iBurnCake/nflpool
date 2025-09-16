import { db, ref, get, update, auth } from './firebaseConfig.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';
const ENTRY_FEE = 5;

const toNum = (x) => (typeof x === 'number' ? x : Number(x) || 0);
const norm  = (s) => String(s ?? '').trim().toLowerCase();

export async function finalizeWeekOnce(weekKey) {
  try {
    const result = await computeAndSaveWinners(weekKey);
    return {
      ok: !!result.ran,
      ...result,
      summary:
        !result.ran ? (result.reason || 'not run') :
        result.awarded ? 'Leaderboards updated and awards recorded' :
        'Leaderboards updated (winners incomplete—no awards yet)'
    };
  } catch (e) {
    console.warn('finalizeWeekOnce error:', e);
    return { ok:false, ran:false, reason:String(e) };
  }
}

async function computeAndSaveWinners(weekKey) {
  const winSnap = await get(ref(db, `winners/${weekKey}/games`));
  if (!winSnap.exists()) return { ran:false, reason:`missing winners/${weekKey}/games` };

  const winnersByGame = winSnap.val() || {};
  if (!Object.keys(winnersByGame).length) return { ran:false, reason:`empty winners/${weekKey}/games` };

  const { houseScores, poolScores, houseWinners, poolWinners } =
    await buildLeaderboards(weekKey, winnersByGame);

  await update(ref(db), {
    [`winners/${weekKey}/houseLeaderboard`]: houseScores,
    [`winners/${weekKey}/moneyPoolLeaderboard`]: poolScores,
    [`winners/${weekKey}/houseWinners`]: houseWinners,
    [`winners/${weekKey}/moneyPoolWinners`]: poolWinners,
    [`winners/${weekKey}/lastComputedAt`]: Date.now(),
  });

  const expectedKeys = await getExpectedGameKeys(weekKey, winnersByGame);
  const complete = winnersComplete(winnersByGame, expectedKeys);
  if (!complete) {
    return { ran:true, awarded:false, reason:`winners incomplete (${expectedKeys.size} expected)` };
  }

  const { pot, payoutPerWinner, updatedUsers, chargedLosers, losers } =
    await awardWeekPayoutsAndWins(weekKey, houseWinners, poolWinners);

  await update(ref(db), { [`winners/${weekKey}/losers`]: losers });

  return { ran:true, awarded:true, pot, payoutPerWinner, updatedUsers, chargedLosers, losers };
}

function winnerString(v) {
  return (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name));
}

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

async function awardWeekPayoutsAndWins(weekKey, houseWinners = [], poolWinners = []) {
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
    return { pot:0, payoutPerWinner:0, updatedUsers:[], chargedLosers:[], losers:[] };
  }

  const membersSnap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const membersMap  = membersSnap.exists() ? (membersSnap.val() || {}) : {};
  const poolMemberUIDs = Object.entries(membersMap)
    .filter(([,v]) => !!v)
    .map(([uid]) => uid);

  const memberCount = poolMemberUIDs.length;
  const pot = ENTRY_FEE * memberCount;

  const mpCount = poolWinners.length || 0;
  const payoutPerWinner = mpCount > 0 ? (pot / mpCount) : 0;

  const poolWinnerSet = new Set(poolWinners);
  const losers = poolMemberUIDs.filter(uid => !poolWinnerSet.has(uid));
  const loserSet = new Set(losers);

  const anyWinnersSet = new Set([...houseWinners, ...poolWinners]);

  const everyoneToProcess = new Set([...loserSet, ...anyWinnersSet]);

  const updates = {};
  const updatedUsers = [];
  const chargedLosers = [];

  for (const uid of everyoneToProcess) {
    const already = await get(ref(db, `users/${uid}/awards/${weekKey}`));
    if (already.exists()) continue;

    const totalWonSnap = await get(ref(db, `users/${uid}/stats/totalWon`));
    let totalWon = toNum(totalWonSnap.exists() ? totalWonSnap.val() : 0);

    if (loserSet.has(uid)) {
      const totalStakedSnap = await get(ref(db, `users/${uid}/stats/totalStaked`));
      const curStaked = toNum(totalStakedSnap.exists() ? totalStakedSnap.val() : 0);

      updates[`users/${uid}/stats/totalStaked`] = curStaked + ENTRY_FEE;
      totalWon -= ENTRY_FEE;
      chargedLosers.push(uid);
    }

    if (poolWinnerSet.has(uid) && payoutPerWinner > 0) {
      totalWon += payoutPerWinner;
    }

    updates[`users/${uid}/stats/totalWon`] = totalWon;

    if (anyWinnersSet.has(uid)) {
      const wSnap = await get(ref(db, `users/${uid}/stats/weeksWon`));
      const curW = toNum(wSnap.exists() ? wSnap.val() : 0);
      updates[`users/${uid}/stats/weeksWon`] = curW + 1;
    }

    updates[`users/${uid}/awards/${weekKey}`] = true;
    updatedUsers.push(uid);
  }

  updates[`winners/${weekKey}/pot`] = pot;
  updates[`winners/${weekKey}/payoutPerWinner`] = payoutPerWinner;
  updates[`winners/${weekKey}/awardedStats`] = true;

  await update(ref(db), updates);

  return { pot, payoutPerWinner, updatedUsers, chargedLosers, losers };
}

export function watchAndFinalizeWeek() {}

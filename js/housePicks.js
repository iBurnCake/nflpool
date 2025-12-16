import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';
import { preloadUserMeta, metaFor, nameFor } from './names.js'; 

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';

document.addEventListener('DOMContentLoaded', () => {
  setBootMessage('Loading House Picks…');
  showLoader('Loading House Picks…');

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      await loadHousePicks(user);
    } catch (err) {
      console.error('loadHousePicks error:', err);
      const c = document.getElementById('housePicksContainer');
      if (c) c.innerHTML = '<p>Error loading picks. Please try again later.</p>';
    } finally {
      hideLoader();
      clearBootLoader();
    }
  });
});

const games = [
// Thu
  { homeTeam: 'Seahawks',    awayTeam: 'Rams',        homeRecord: '11-3',  awayRecord: '11-3' },

  // Sat
  { homeTeam: 'Commanders',  awayTeam: 'Eagles',      homeRecord: '4-10',  awayRecord: '9-5' },
  { homeTeam: 'Bears',       awayTeam: 'Packers',     homeRecord: '10-4',  awayRecord: '9-4-1' },

  // Sun early (1:00 ET)
  { homeTeam: 'Browns',      awayTeam: 'Bills',       homeRecord: '3-11',  awayRecord: '10-4' },
  { homeTeam: 'Cowboys',     awayTeam: 'Chargers',    homeRecord: '6-7-1', awayRecord: '10-4' },
  { homeTeam: 'Titans',      awayTeam: 'Chiefs',      homeRecord: '2-12',  awayRecord: '6-8' },
  { homeTeam: 'Dolphins',    awayTeam: 'Bengals',     homeRecord: '6-8',   awayRecord: '4-10' },
  { homeTeam: 'Saints',      awayTeam: 'Jets',        homeRecord: '4-10',  awayRecord: '3-11' },
  { homeTeam: 'Giants',      awayTeam: 'Vikings',     homeRecord: '2-12',  awayRecord: '6-8' },
  { homeTeam: 'Panthers',    awayTeam: 'Buccaneers',  homeRecord: '7-7',   awayRecord: '7-7' },

  // Sun late
  { homeTeam: 'Broncos',     awayTeam: 'Jaguars',     homeRecord: '12-2',  awayRecord: '10-4' }, // 4:05 ET
  { homeTeam: 'Cardinals',   awayTeam: 'Falcons',     homeRecord: '3-11',  awayRecord: '5-9' },  // 4:05 ET
  { homeTeam: 'Lions',       awayTeam: 'Steelers',    homeRecord: '8-6',   awayRecord: '8-6' },  // 4:25 ET
  { homeTeam: 'Texans',      awayTeam: 'Raiders',     homeRecord: '9-5',   awayRecord: '2-12' }, // 4:25 ET

  // Sun night
  { homeTeam: 'Ravens',      awayTeam: 'Patriots',    homeRecord: '7-7',   awayRecord: '11-3' },

  // Mon night
  { homeTeam: 'Colts',       awayTeam: '49ers',       homeRecord: '8-6',   awayRecord: '10-4' },
];
const norm = s => String(s ?? '').trim().toLowerCase();
const winnerString = (v) =>
  (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name)) || '';

async function canShowHousePicks(user) {
  if (user?.uid === ADMIN_UID) return true;
  try {
    const vis = await get(ref(db, 'settings/showHousePicks'));
    return vis.exists() && vis.val() === true;
  } catch {
    return false;
  }
}

async function getCurrentWeekKey() {
  try {
    const snap = await get(ref(db, 'settings/currentWeek'));
    if (snap.exists()) return snap.val();
  } catch {}
  return '';
}

async function loadWinnersForWeek(weekKey) {
  const snap = await get(ref(db, `winners/${weekKey}/games`));
  let raw = {};
  if (snap.exists()) raw = snap.val() || {};
  else {
    const all = await get(ref(db, `winners/${weekKey}`));
    raw = all.exists() ? (all.val().games ?? {}) : {};
  }
  const cleaned = {};
  for (const [k, v] of Object.entries(raw)) cleaned[k] = winnerString(v);
  return cleaned;
}

function calculateTotalScore(userPicks, winnersByIdx) {
  if (!userPicks) return 0;
  let total = 0;
  for (const idx of Object.keys(userPicks)) {
    const pick = userPicks[idx];
    if (!pick) continue;
    const chosen = norm(pick.team);
    const pts = Number.parseInt(pick.points ?? 0, 10) || 0;
    const win = norm(winnersByIdx[idx]);
    if (win && chosen === win) total += pts;
  }
  return total;
}

async function loadHousePicks(user) {
  const container = document.getElementById('housePicksContainer');
  if (!container) return;
  container.innerHTML = 'Loading…';

  const visible = await canShowHousePicks(user);
  if (!visible) {
    container.innerHTML = `
      <div class="pill" style="border:1px solid #666;color:#bbb;display:inline-block;padding:8px 12px;border-radius:20px;">
        Hidden until admin enables House Picks
      </div>`;
    return;
  }

  await preloadUserMeta();

  const weekKey = await getCurrentWeekKey();
  const winnersByIdx = await loadWinnersForWeek(weekKey);

  const picksSnap = await get(ref(db, `scoreboards/${weekKey}`));
  if (!picksSnap.exists()) {
    container.innerHTML = `<p>No picks submitted for ${weekKey}.</p>`;
    return;
  }

  const picksData = picksSnap.val();
  container.innerHTML = '';

  const userScores = [];
  for (const userId in picksData) {
    const totalScore = calculateTotalScore(picksData[userId], winnersByIdx);
    const meta = metaFor(userId) || {};
    userScores.push({
      userId,
      userName: meta.displayName || nameFor(userId),                
      totalScore,
      profilePic: meta.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
      usernameColor: meta.usernameColor || '#FFD700',
    });
  }

  userScores.sort((a, b) => b.totalScore - a.totalScore);

  createLeaderboardTable(userScores, container);

  userScores.forEach(u => {
    createUserPicksTable(
      u.userName,
      picksData[u.userId],
      u.totalScore,
      u.usernameColor,
      u.profilePic,
      winnersByIdx
    );
  });
}

function createLeaderboardTable(userScores, container) {
  const box = document.createElement('div');
  box.classList.add('user-picks-container');

  const header = document.createElement('h3');
  header.classList.add('user-header');
  header.textContent = 'Leaderboard';
  box.appendChild(header);

  const table = document.createElement('table');
  table.classList.add('user-picks-table');
  table.innerHTML = `
    <thead>
      <tr><th>Rank</th><th>User</th><th>Total Score</th></tr>
    </thead>
    <tbody>
      ${userScores.map((u, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="color:${u.usernameColor};">
            <div class="leaderboard-user">
              <img src="${u.profilePic}" alt="${u.userName}">
              <span class="leaderboard-username">${u.userName}</span>
            </div>
          </td>
          <td>${u.totalScore}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  box.appendChild(table);
  container.appendChild(box);
}

function createUserPicksTable(userName, userPicks, totalScore, userColor, profilePic, winnersByIdx) {
  const housePicksContainer = document.getElementById('housePicksContainer');
  const userContainer = document.createElement('div');
  userContainer.classList.add('user-picks-container');

  const userHeader = document.createElement('h3');
  userHeader.classList.add('user-header');
  userHeader.innerHTML = `
    <img src="${profilePic}" alt="${userName}" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;">
    <span style="color:${userColor};">${userName}</span> - Total Score: ${totalScore}
  `;
  userContainer.appendChild(userHeader);

  const table = document.createElement('table');
  table.classList.add('user-picks-table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Matchup</th>
        <th>Pick</th>
        <th>Confidence Points</th>
        <th>Result</th>
        <th>Points Earned</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');

  for (const gameIndex in userPicks) {
    const pickData = userPicks[gameIndex];
    const game = games[gameIndex];
    if (!game) continue;

    const matchup = `${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})`;
    const chosenTeam = pickData.team || 'N/A';
    const confidencePoints = pickData.points || 0;

    const gameWinner = winnerString(winnersByIdx[gameIndex]) || '';
    const isCorrectPick = gameWinner && norm(chosenTeam) === norm(gameWinner);
    const pointsEarned = isCorrectPick ? confidencePoints : 0;

    const resultText = gameWinner ? (isCorrectPick ? 'Win' : 'Loss') : '—';
    const resultClass = gameWinner ? (isCorrectPick ? 'correct' : 'incorrect') : 'neutral';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${matchup}</td>
      <td>${chosenTeam}</td>
      <td>${confidencePoints}</td>
      <td class="${resultClass}">${resultText}</td>
      <td>${pointsEarned}</td>
    `;
    tbody.appendChild(row);
  }

  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `
    <td colspan="3" style="font-weight:700;text-align:right;">Total Score:</td>
    <td colspan="2">${totalScore}</td>
  `;
  tbody.appendChild(totalRow);

  userContainer.appendChild(table);
  housePicksContainer.appendChild(userContainer);
}

clearBootLoader();

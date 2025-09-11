import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';

document.addEventListener('DOMContentLoaded', () => {
  showLoader('Loading House Picks…');
  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      await loadHousePicks();
    } catch (err) {
      console.error('loadHousePicks error:', err);
      const c = document.getElementById('housePicksContainer');
      if (c) c.innerHTML = '<p>Error loading picks. Please try again later.</p>';
    } finally {
      hideLoader();
    }
  });
});

const games = [
  { homeTeam: 'Packers',   awayTeam: 'Commanders', homeRecord: '1-0', awayRecord: '1-0' },
  { homeTeam: 'Bengals',   awayTeam: 'Jaguars',    homeRecord: '1-0', awayRecord: '1-0' },
  { homeTeam: 'Cowboys',   awayTeam: 'Giants',     homeRecord: '0-1', awayRecord: '0-1' },
  { homeTeam: 'Lions',     awayTeam: 'Bears',      homeRecord: '0-1', awayRecord: '0-1' },
  { homeTeam: 'Titans',    awayTeam: 'Rams',       homeRecord: '0-1', awayRecord: '1-0' },
  { homeTeam: 'Dolphins',  awayTeam: 'Patriots',   homeRecord: '0-1', awayRecord: '0-1' },
  { homeTeam: 'Saints',    awayTeam: '49ers',      homeRecord: '0-1', awayRecord: '1-0' },
  { homeTeam: 'Jets',      awayTeam: 'Bills',      homeRecord: '0-1', awayRecord: '1-0' },
  { homeTeam: 'Steelers',  awayTeam: 'Seahawks',   homeRecord: '1-0', awayRecord: '0-1' },
  { homeTeam: 'Ravens',    awayTeam: 'Browns',     homeRecord: '0-1', awayRecord: '0-1' },
  { homeTeam: 'Colts',     awayTeam: 'Broncos',    homeRecord: '1-0', awayRecord: '1-0' }, 
  { homeTeam: 'Cardinals', awayTeam: 'Panthers',   homeRecord: '1-0', awayRecord: '0-1' }, 
  { homeTeam: 'Chiefs',    awayTeam: 'Eagles',     homeRecord: '0-1', awayRecord: '1-0' }, 
  { homeTeam: 'Vikings',   awayTeam: 'Falcons',    homeRecord: '1-0', awayRecord: '0-1' }, 
  { homeTeam: 'Texans',    awayTeam: 'Buccaneers', homeRecord: '0-1', awayRecord: '1-0' }, 
  { homeTeam: 'Chargers',  awayTeam: 'Raiders',    homeRecord: '1-0', awayRecord: '1-0' }, 
];

const norm = s => String(s ?? '').trim().toLowerCase();
const winnerString = (v) =>
  (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name)) || '';

async function getCurrentWeekKey() {
  try {
    const snap = await get(ref(db, 'settings/currentWeek'));
    if (snap.exists()) return snap.val();
  } catch {}
  return 'week1';
}

async function fetchUserData() {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  if (!snapshot.exists()) return {};
  const users = snapshot.val();
  const map = {};
  for (const uid in users) {
    map[uid] = {
      usernameColor: users[uid].usernameColor || '#FFD700',
      profilePic: users[uid].profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
    };
  }
  return map;
}

async function loadWinnersForWeek(weekKey) {
  const snap = await get(ref(db, `winners/${weekKey}/games`));
  let raw = {};
  if (snap.exists()) {
    raw = snap.val() || {};
  } else {
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


async function loadHousePicks() {
  const container = document.getElementById('housePicksContainer');
  if (!container) return;
  container.innerHTML = 'Loading…';

  const [weekKey, userDataMap] = await Promise.all([
    getCurrentWeekKey(),
    fetchUserData(),
  ]);

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
    userScores.push({
      userId,
      userName: getUserName(userId),
      totalScore,
      profilePic: userDataMap[userId]?.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
      usernameColor: userDataMap[userId]?.usernameColor || '#FFD700',
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

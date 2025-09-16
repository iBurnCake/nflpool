// housePicks.js
import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';

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
  { homeTeam: 'Bills',      awayTeam: 'Dolphins',   homeRecord: '2-0', awayRecord: '0-2' },

  // Sun 1:00 ET
  { homeTeam: 'Vikings',    awayTeam: 'Bengals',    homeRecord: '1-1', awayRecord: '2-0' },
  { homeTeam: 'Jaguars',    awayTeam: 'Texans',     homeRecord: '1-1', awayRecord: '0-2' },
  { homeTeam: 'Titans',     awayTeam: 'Colts',      homeRecord: '0-2', awayRecord: '2-0' },
  { homeTeam: 'Commanders', awayTeam: 'Raiders',    homeRecord: '1-1', awayRecord: '1-1' },
  { homeTeam: 'Eagles',     awayTeam: 'Rams',       homeRecord: '2-0', awayRecord: '2-0' },
  { homeTeam: 'Panthers',   awayTeam: 'Falcons',    homeRecord: '0-2', awayRecord: '1-1' },
  { homeTeam: 'Patriots',   awayTeam: 'Steelers',   homeRecord: '1-1', awayRecord: '1-1' },
  { homeTeam: 'Browns',     awayTeam: 'Packers',    homeRecord: '0-2', awayRecord: '2-0' },
  { homeTeam: 'Buccaneers', awayTeam: 'Jets',       homeRecord: '2-0', awayRecord: '0-2' },

  // Sun late
  { homeTeam: 'Chargers',   awayTeam: 'Broncos',    homeRecord: '2-0', awayRecord: '1-1' }, // 4:05
  { homeTeam: 'Seahawks',   awayTeam: 'Saints',     homeRecord: '1-1', awayRecord: '0-2' }, // 4:05
  { homeTeam: 'Bears',      awayTeam: 'Cowboys',    homeRecord: '0-2', awayRecord: '1-1' }, // 4:25
  { homeTeam: '49ers',      awayTeam: 'Cardinals',  homeRecord: '2-0', awayRecord: '2-0' }, // 4:25

  // SNF
  { homeTeam: 'Giants',     awayTeam: 'Chiefs',     homeRecord: '0-2', awayRecord: '0-2' },

  // MNF
  { homeTeam: 'Ravens',     awayTeam: 'Lions',      homeRecord: '1-1', awayRecord: '1-1' },
];

const norm = s => String(s ?? '').trim().toLowerCase();
const winnerString = (v) =>
  (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name)) || '';

async function canShowHousePicks(user) {
  // Admin can always view
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

function getUserName(userId) {
  const userMap = {
    'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano',
    '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
    'zZ8DblY3KQgPP9bthG87l7DNAux2': 'Ryan Sanders',
    'ukGs73HIg6aECkgShM71C8fTcwo1': 'William Mathis',
    '67khUuKYmhXxRumUjMpyoDbnq0s2': 'Thomas Romano',
    'JIdq2bYVCZgdAeC0y6P69puNQz43': 'Tony Romano',
    '9PyTK0SHv7YKv7AYw5OV29dwH5q2': 'Emily Rossini',
    'ORxFtuY13VfaUqc2ckcfw084Lxq1': 'Aunt Vicki',
    'FIKVjOy8P7UTUGqq2WvjkARZPIE2': 'Tommy Kant',
    'FFIWPuZYzYRI2ibmVbVHDIq1mjj2': 'De Von ',
    'i6s97ZqeN1YCM39Sjqh65VablvA3': 'Kyra Kafel ',
    '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant',
    'gsQAQttBoEOSu4v1qVVqmHxAqsO2': 'Nick Kier',
    'VnBOWzUZh7UAon6NJ6ICX1kVlEE2': 'Connor Moore',
    'pJxZh3lsp9a0MpKVPSHvyIfNTwW2': 'Mel',
    'PaHlsxdFFMRRbd4YurMdAsfaFhe2': 'Gavin Munoz',
    'F70T1damAEe1oq53RGYo7QKkaPA2': 'Brayden Trunnell',
  };
  return userMap[userId] || `User ${userId}`;
}

async function loadHousePicks(user) {
  const container = document.getElementById('housePicksContainer');
  if (!container) return;
  container.innerHTML = 'Loading…';

  // Visibility gate (bypass for admin)
  const visible = await canShowHousePicks(user);
  if (!visible) {
    container.innerHTML = `
      <div class="pill" style="border:1px solid #666;color:#bbb;display:inline-block;padding:8px 12px;border-radius:20px;">
        Hidden until admin enables House Picks
      </div>`;
    return;
  }

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

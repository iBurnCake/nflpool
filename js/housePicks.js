import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  loadHousePicks().catch(err => console.error('loadHousePicks error:', err));
});

const games = [
  { homeTeam: 'Cowboys',   awayTeam: 'Eagles',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Chiefs',    awayTeam: 'Chargers',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Dolphins',  awayTeam: 'Colts',      homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Steelers',  awayTeam: 'Jets',       homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Panthers',  awayTeam: 'Jaguars',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Cardinals', awayTeam: 'Saints',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Giants',    awayTeam: 'Commanders', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Buccaneers',awayTeam: 'Falcons',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Bengals',   awayTeam: 'Browns',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Raiders',   awayTeam: 'Patriots',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: '49ers',     awayTeam: 'Seahawks',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Titans',    awayTeam: 'Broncos',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Lions',     awayTeam: 'Packers',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Texans',    awayTeam: 'Rams',       homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Ravens',    awayTeam: 'Bills',      homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Vikings',   awayTeam: 'Bears',      homeRecord: '0-0', awayRecord: '0-0' },
];

const norm = s => String(s ?? '').trim().toLowerCase();

async function getCurrentWeekKey() {
  try {
    const snap = await get(ref(db, 'settings/currentWeek'));
    if (snap.exists()) return snap.val();
  } catch (_) {}
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
  if (snap.exists()) return snap.val();

  const all = await get(ref(db, `winners/${weekKey}`));
  return all.exists() ? (all.val().games ?? {}) : {};
}

function calculateTotalScore(userPicks, winners) {
  if (!userPicks) return 0;
  const gamesWinners = winners?.games ?? winners ?? {};
  let total = 0;

  for (const idx of Object.keys(userPicks)) {
    const pick = userPicks[idx];
    if (!pick) continue;
    const chosen = norm(pick.team);
    const pts = Number.parseInt(pick.points ?? 0, 10) || 0;
    const win = norm(gamesWinners[idx]);
    if (win && chosen === win) total += pts;
  }
  return total;
}

function getUserName(userId) {
  const userMap = {
    'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano',
    '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
    'zZ8DblY3KQgPP9bthG87l7DNAux2': 'Ryan Sanders',
    'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
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
  };
  return userMap[userId] || `User ${userId}`;
}

async function loadHousePicks() {
  const container = document.getElementById('housePicksContainer');
  container.innerHTML = 'Loading…';

  const [weekKey, userDataMap] = await Promise.all([
    getCurrentWeekKey(),
    fetchUserData(),
  ]);

  const winners = await loadWinnersForWeek(weekKey);

  const picksSnap = await get(ref(db, `scoreboards/${weekKey}`));
  if (!picksSnap.exists()) {
    container.innerHTML = `<p>No picks submitted for ${weekKey}.</p>`;
    return;
  }

  const picksData = picksSnap.val();
  container.innerHTML = '';

  const userScores = [];
  for (const userId in picksData) {
    const totalScore = calculateTotalScore(picksData[userId], winners);
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
      winners
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

function createUserPicksTable(userName, userPicks, totalScore, userColor, profilePic, winners) {
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

  const winnersMap = winners?.games ?? winners ?? {};

  for (const gameIndex in userPicks) {
    const pickData = userPicks[gameIndex];
    const game = games[gameIndex];
    if (!game) continue;

    const matchup = `${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})`;
    const chosenTeam = pickData.team || 'N/A';
    const confidencePoints = pickData.points || 0;

    const gameWinner = winnersMap[gameIndex] || '';
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

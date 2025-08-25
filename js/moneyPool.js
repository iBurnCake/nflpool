import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js'; 

const WEEK_KEY = 'week1'; 
function containerEl() {
  return document.getElementById('housePicksContainer') || document.getElementById('mp-container');
}
function setWeekLabel() {
  const el = document.getElementById('mp-week');
  if (el) el.textContent = `— ${WEEK_KEY}`;
}
function setStatus(text) {
  const s = document.getElementById('mp-status');
  if (s) s.textContent = text || '';
}
function clearContainer() {
  const c = containerEl();
  if (c) c.innerHTML = '';
}

async function loadAllowlist(weekKey) {
  const snap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  if (!snap.exists()) return new Set();
  return new Set(Object.keys(snap.val()));
}

async function fetchUserDataMap() {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  const map = {};
  if (snapshot.exists()) {
    const usersData = snapshot.val();
    for (const uid in usersData) {
      map[uid] = {
        usernameColor: usersData[uid].usernameColor || '#FFD700',
        profilePic: usersData[uid].profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
      };
    }
  }
  return map;
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
  };
  return userMap[userId] || `User ${userId}`;
}

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
const gameWinners = {
    0: '', // Cowboys - Eagles
    1: '', // Chiefs - Chargers
    2: '', // Dolphins - Colts
    3: '', // Steelers - Jets
    4: '', // Panthers - Jaguars
    5: '', // Cardinals - Saints
    6: '', // Giants - Commanders
    7: '', // Buccaneers - Falcons
    8: '', // Bengals - Browns
    9: '', // Raiders - Patriots
    10: '', // 49ers - Seahawks
    11: '', // Titans - Broncos
    12: '', // Lions - Packers
    13: '', // Texans - Rams
    14: '', // Ravens - Bills
    15: ''  // Vikings - Bears
};

function calculateTotalScore(userPicks) {
  let total = 0;
  for (const gameIndex in userPicks) {
    const pick = userPicks[gameIndex];
    if (!pick) continue;
    const chosen = pick.team;
    const pts = pick.points || 0;
    const winner = gameWinners[gameIndex];
    if (chosen === winner) total += pts;
  }
  return total;
}

function createLeaderboardTable(userScores, container) {
  const leaderboardContainer = document.createElement('div');
  leaderboardContainer.classList.add('user-picks-container');

  const header = document.createElement('h3');
  header.classList.add('user-header');
  header.textContent = 'Leaderboard';
  leaderboardContainer.appendChild(header);

  const table = document.createElement('table');
  table.classList.add('user-picks-table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Rank</th>
        <th>User</th>
        <th>Total Score</th>
      </tr>
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
  leaderboardContainer.appendChild(table);
  container.appendChild(leaderboardContainer);
}

function createUserPicksTable(userName, userPicks, totalScore, userColor, profilePic) {
  const c = containerEl();
  const userContainer = document.createElement('div');
  userContainer.classList.add('user-picks-container');

  const userHeader = document.createElement('h3');
  userHeader.classList.add('user-header');
  userHeader.innerHTML = `
    <img src="${profilePic}" alt="${userName}" style="width:32px; height:32px; border-radius:50%; vertical-align:middle; margin-right:8px;">
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

    const winner = gameWinners[gameIndex];
    const isCorrect = winner && chosenTeam === winner;
    const pointsEarned = isCorrect ? confidencePoints : 0;

    const resultText = winner ? (isCorrect ? 'Win' : 'Loss') : 'N/A';
    const resultClass = winner ? (isCorrect ? 'correct' : 'incorrect') : 'neutral';

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
    <td colspan="3" style="font-weight:bold; text-align:right;">Total Score:</td>
    <td colspan="2">${totalScore}</td>
  `;
  tbody.appendChild(totalRow);

  userContainer.appendChild(table);
  c.appendChild(userContainer);
}

async function renderMoneyPool() {
  setStatus('Loading…');
  clearContainer();

  const allowUids = await loadAllowlist(WEEK_KEY);
  if (!allowUids || allowUids.size === 0) {
    setStatus('No subscribers yet for this week.');
    return;
  }

  const weekRef = ref(db, `scoreboards/${WEEK_KEY}`); 
  const snap = await get(weekRef);

  const c = containerEl();
  if (!snap.exists()) {
    setStatus('No picks submitted for this week.');
    return;
  }

  const picksData = snap.val();
  const userDataMap = await fetchUserDataMap();

  const userScores = [];
  const filteredUserIds = Object.keys(picksData).filter(uid => allowUids.has(uid));

  filteredUserIds.forEach(uid => {
    const userPicks = picksData[uid];
    const userName = getUserName(uid);
    const totalScore = calculateTotalScore(userPicks);

    userScores.push({
      userId: uid,
      userName,
      totalScore,
      profilePic: userDataMap[uid]?.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
      usernameColor: userDataMap[uid]?.usernameColor || '#FFD700'
    });
  });

  if (userScores.length === 0) {
    setStatus('No subscribers have submitted picks yet.');
    return;
  }

  userScores.sort((a, b) => b.totalScore - a.totalScore);

  c.innerHTML = ''; 
  createLeaderboardTable(userScores, c);
  userScores.forEach(user => {
    const userPicks = picksData[user.userId];
    createUserPicksTable(user.userName, userPicks, user.totalScore, user.usernameColor, user.profilePic);
  });

  setStatus('');
}

document.addEventListener('DOMContentLoaded', () => {
  setWeekLabel();
  setStatus('Loading…');

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    renderMoneyPool().catch(err => {
      console.error('Money Pool render error:', err);
      setStatus('Something went wrong loading the Money Pool.');
    });
  });
});

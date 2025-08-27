import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();

function containerEl() {
  return document.getElementById('housePicksContainer') || document.getElementById('mp-container');
}
function setWeekLabel(weekKey) {
  const el = document.getElementById('mp-week');
  if (el && weekKey) el.textContent = `— ${weekKey}`;
}
function setStatus(text) {
  const s = document.getElementById('mp-status');
  if (s) s.textContent = text || '';
}
function clearContainer() {
  const c = containerEl();
  if (c) c.innerHTML = '';
}

async function getCurrentWeekKey() {
  try {
    const snap = await get(ref(db, 'settings/currentWeek'));
    if (snap.exists()) return snap.val();
  } catch (_) {}
  return 'week1';
}

async function loadAllowlist(weekKey) {
  const snap = await get(ref(db, `subscriberPools/${weekKey}/members`));
  if (!snap.exists()) return new Set();
  return new Set(Object.keys(snap.val()));
}

async function fetchUserDataMap() {
  const snapshot = await get(ref(db, 'users'));
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

async function loadWinnersForWeek(weekKey) {
  const snap = await get(ref(db, `winners/${weekKey}/games`));
  if (snap.exists()) return snap.val();

  const all = await get(ref(db, `winners/${weekKey}`));
  return all.exists() ? (all.val().games ?? {}) : {};
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

function calculateTotalScore(userPicks, winners) {
  if (!userPicks) return 0;
  const winnersMap = winners?.games ?? winners ?? {};
  let total = 0;

  for (const idx of Object.keys(userPicks)) {
    const p = userPicks[idx];
    if (!p) continue;
    const chosen = norm(p.team);
    const pts = Number.parseInt(p.points ?? 0, 10) || 0;
    const win = norm(winnersMap[idx]);
    if (win && chosen === win) total += pts;
  }
  return total;
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
  const c = containerEl();
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

    const w = winnersMap[gameIndex] || '';
    const isCorrect = w && norm(chosenTeam) === norm(w);
    const pointsEarned = isCorrect ? confidencePoints : 0;

    const resultText = w ? (isCorrect ? 'Win' : 'Loss') : '—';
    const resultClass = w ? (isCorrect ? 'correct' : 'incorrect') : 'neutral';

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
    <td colspan="3" style="font-weight:bold;text-align:right;">Total Score:</td>
    <td colspan="2">${totalScore}</td>
  `;
  tbody.appendChild(totalRow);

  userContainer.appendChild(table);
  c.appendChild(userContainer);
}

async function renderMoneyPool() {
  try {
    setStatus('Loading…');
    clearContainer();

    const weekKey = await getCurrentWeekKey();
    setWeekLabel(weekKey);

    const [allowUids, winners, picksSnap, userDataMap] = await Promise.all([
      loadAllowlist(weekKey),
      loadWinnersForWeek(weekKey),
      get(ref(db, `scoreboards/${weekKey}`)),
      fetchUserDataMap(),
    ]);

    if (!allowUids || allowUids.size === 0) {
      setStatus('No subscribers yet for this week.');
      return;
    }

    if (!picksSnap.exists()) {
      setStatus('No picks submitted for this week.');
      return;
    }

    const c = containerEl();
    const picksData = picksSnap.val();

    const userScores = [];
    const filteredUserIds = Object.keys(picksData).filter(uid => allowUids.has(uid));

    filteredUserIds.forEach(uid => {
      const userPicks = picksData[uid];
      const totalScore = calculateTotalScore(userPicks, winners);
      userScores.push({
        userId: uid,
        userName: getUserName(uid),
        totalScore,
        profilePic: userDataMap[uid]?.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
        usernameColor: userDataMap[uid]?.usernameColor || '#FFD700',
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
      createUserPicksTable(user.userName, userPicks, user.totalScore, user.usernameColor, user.profilePic, winners);
    });

    setStatus('');
  } catch (err) {
    console.error('Money Pool render error:', err);
    setStatus('Something went wrong loading the Money Pool.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setStatus('Loading…');
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }
    renderMoneyPool();
  });
});

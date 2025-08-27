// js/moneyPool.js
import { auth, onAuthStateChanged, db, ref, get, update } from './firebaseConfig.js';

/* ===== Admin ===== */
const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';

/* ===== Small helpers ===== */
const norm = (s) => String(s ?? '').trim().toLowerCase();
function containerEl() {
  return document.getElementById('housePicksContainer') || document.getElementById('mp-container');
}
function setStatus(text) {
  const s = document.getElementById('mp-status');
  if (s) s.textContent = text || '';
}
function setWeekLabel(weekKey, weekLabel) {
  const el = document.getElementById('mp-week');
  if (el) el.textContent = `— ${weekLabel || weekKey}`;
}

/* ===== Games list (for display only) — Week 1 ===== */
const games = [
  { homeTeam: 'Cowboys',    awayTeam: 'Eagles',     homeRecord: '0-0', awayRecord: '0-0' }, // Thu
  { homeTeam: 'Chiefs',     awayTeam: 'Chargers',   homeRecord: '0-0', awayRecord: '0-0' }, // Fri
  { homeTeam: 'Dolphins',   awayTeam: 'Colts',      homeRecord: '0-0', awayRecord: '0-0' }, // Sun 1:00
  { homeTeam: 'Steelers',   awayTeam: 'Jets',       homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Panthers',   awayTeam: 'Jaguars',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Cardinals',  awayTeam: 'Saints',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Giants',     awayTeam: 'Commanders', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Buccaneers', awayTeam: 'Falcons',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Bengals',    awayTeam: 'Browns',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Raiders',    awayTeam: 'Patriots',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: '49ers',      awayTeam: 'Seahawks',   homeRecord: '0-0', awayRecord: '0-0' }, // 4:05
  { homeTeam: 'Titans',     awayTeam: 'Broncos',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Lions',      awayTeam: 'Packers',    homeRecord: '0-0', awayRecord: '0-0' }, // 4:25
  { homeTeam: 'Texans',     awayTeam: 'Rams',       homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Ravens',     awayTeam: 'Bills',      homeRecord: '0-0', awayRecord: '0-0' }, // SNF
  { homeTeam: 'Vikings',    awayTeam: 'Bears',      homeRecord: '0-0', awayRecord: '0-0' }  // MNF
];

/* ===== Settings / data fetch ===== */
async function getSettings() {
  let weekKey = 'week1';
  let weekLabel = '';
  try {
    const w = await get(ref(db, 'settings/currentWeek'));
    if (w.exists()) weekKey = w.val();
    const l = await get(ref(db, 'settings/currentWeekLabel'));
    if (l.exists()) weekLabel = l.val();
  } catch (_) {}
  return { weekKey, weekLabel };
}

async function loadWinnersForWeek(weekKey) {
  // Prefer winners/<weekKey>/games
  const s = await get(ref(db, `winners/${weekKey}/games`));
  if (s.exists()) return s.val();

  // Fallback if only winners/<weekKey> exists (with "games" inside)
  const t = await get(ref(db, `winners/${weekKey}`));
  return t.exists() ? (t.val().games ?? {}) : {};
}

async function loadAllowlist(weekKey) {
  const s = await get(ref(db, `subscriberPools/${weekKey}/members`));
  if (!s.exists()) return new Set();
  return new Set(Object.keys(s.val()));
}

async function fetchUserDataMap() {
  const usersRef = ref(db, 'users');
  const snapshot = await get(usersRef);
  const map = {};
  if (snapshot.exists()) {
    const users = snapshot.val();
    for (const uid in users) {
      map[uid] = {
        usernameColor: users[uid].usernameColor || '#FFD700',
        profilePic: users[uid].profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
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

/* ===== Scoring ===== */
function calculateTotalScore(userPicks, winnersMap) {
  if (!userPicks) return 0;
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

/* ===== Rendering ===== */
function createLeaderboardTable(userScores, container) {
  const wrap = document.createElement('div');
  wrap.className = 'user-picks-container';

  const h = document.createElement('h3');
  h.className = 'user-header';
  h.textContent = 'Leaderboard';
  wrap.appendChild(h);

  const table = document.createElement('table');
  table.className = 'user-picks-table';
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
    </tbody>`;
  wrap.appendChild(table);
  container.appendChild(wrap);
}

function createUserPicksTable(userName, userPicks, totalScore, userColor, profilePic, winnersMap) {
  const c = containerEl();
  const card = document.createElement('div');
  card.className = 'user-picks-container';

  const header = document.createElement('h3');
  header.className = 'user-header';
  header.innerHTML = `
    <img src="${profilePic}" alt="${userName}" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:8px;">
    <span style="color:${userColor};">${userName}</span> - Total Score: ${totalScore}
  `;
  card.appendChild(header);

  const table = document.createElement('table');
  table.className = 'user-picks-table';
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
    <tbody></tbody>`;
  const tbody = table.querySelector('tbody');

  for (const gameIndex in userPicks) {
    const pickData = userPicks[gameIndex];
    const game = games[gameIndex];
    if (!game) continue;

    const matchup = `${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})`;
    const chosenTeam = pickData.team || 'N/A';
    const confidencePoints = pickData.points || 0;

    const gameWinner = winnersMap[gameIndex] || '';
    const isCorrect = gameWinner && norm(chosenTeam) === norm(gameWinner);
    const pointsEarned = isCorrect ? confidencePoints : 0;

    const resultText = gameWinner ? (isCorrect ? 'Win' : 'Loss') : '—';
    const resultClass = gameWinner ? (isCorrect ? 'correct' : 'incorrect') : 'neutral';

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

  card.appendChild(table);
  c.appendChild(card);
}

/* ===== Admin helpers ===== */
function parseUids(text) {
  return (text || '')
    .split(/[\s,;]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

async function addMembersToWeek(weekKey, uidList) {
  if (!uidList.length) return;
  const updates = {};
  uidList.forEach(uid => {
    updates[`subscriberPools/${weekKey}/members/${uid}`] = true;
  });
  await update(ref(db), updates);
}

async function loadCurrentMembers(weekKey) {
  const s = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const out = [];
  if (s.exists()) {
    const obj = s.val();
    for (const uid of Object.keys(obj)) {
      out.push(uid);
    }
  }
  return out.sort();
}

/* ===== Main render ===== */
async function renderMoneyPool() {
  setStatus('Loading…');
  const container = containerEl();
  if (container) container.innerHTML = '';

  const { weekKey, weekLabel } = await getSettings();
  setWeekLabel(weekKey, weekLabel);

  // 1) winners & allowlist
  const [winnersMap, allowSet] = await Promise.all([
    loadWinnersForWeek(weekKey),
    loadAllowlist(weekKey),
  ]);

  if (!allowSet || allowSet.size === 0) {
    setStatus('No subscribers yet for this week.');
    return;
  }

  // 2) get picks and users data
  const picksSnap = await get(ref(db, `scoreboards/${weekKey}`));
  if (!picksSnap.exists()) {
    setStatus('No picks submitted for this week.');
    return;
  }
  const picksByUser = picksSnap.val();
  const userDataMap = await fetchUserDataMap();

  // 3) filter users to allowlist + score
  const userScores = [];
  const filteredIds = Object.keys(picksByUser).filter(uid => allowSet.has(uid));

  filteredIds.forEach(uid => {
    const userPicks = picksByUser[uid];
    const totalScore = calculateTotalScore(userPicks, winnersMap);
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

  // 4) sort + render
  userScores.sort((a, b) => b.totalScore - a.totalScore);
  container.innerHTML = '';
  createLeaderboardTable(userScores, container);

  userScores.forEach(u => {
    const userPicks = picksByUser[u.userId];
    createUserPicksTable(u.userName, userPicks, u.totalScore, u.usernameColor, u.profilePic, winnersMap);
  });

  setStatus('');
}

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', () => {
  setStatus('Loading…');

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // viewers must be logged in to view Money Pool
      window.location.href = 'index.html';
      return;
    }

    // Render page content
    renderMoneyPool().catch(err => {
      console.error('Money Pool render error:', err);
      setStatus('Something went wrong loading the Money Pool.');
    });

    // Admin-only panel wiring
    const panel = document.getElementById('mp-admin');
    if (user.uid === ADMIN_UID && panel) {
      panel.style.display = ''; // unhide if you had it hidden by default in CSS

      const textarea = document.getElementById('mp-uid-input');
      const addBtn = document.getElementById('mp-add-btn');
      const refreshBtn = document.getElementById('mp-refresh-members');
      const membersList = document.getElementById('mp-members-list');

      async function refreshMembersUI() {
        const { weekKey } = await getSettings();
        const list = await loadCurrentMembers(weekKey);
        if (membersList) {
          membersList.innerHTML = list.length
            ? list.map(uid => `<li><code>${uid}</code></li>`).join('')
            : '<li><em>No members yet</em></li>';
        }
      }

      addBtn?.addEventListener('click', async () => {
        const { weekKey } = await getSettings();
        const uids = parseUids(textarea?.value || '');
        if (!uids.length) {
          alert('Paste one or more UIDs, separated by commas/space/lines.');
          return;
        }
        try {
          await addMembersToWeek(weekKey, uids);
          textarea.value = '';
          await refreshMembersUI();
          await renderMoneyPool(); // re-render with new members
          alert('Members added.');
        } catch (e) {
          console.error('Add members error:', e);
          alert('Error adding members. Check console.');
        }
      });

      refreshBtn?.addEventListener('click', refreshMembersUI);

      // initial load of members list
      refreshMembersUI().catch(console.error);
    }
  });
});

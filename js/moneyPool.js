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
  const s = await get(ref(db, `winners/${weekKey}/games`));
  if (s.exists()) return s.val();
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
        displayName: users[uid].displayName || users[uid].name || users[uid].username || null,
        email: users[uid].email || null,
      };
    }
  }
  return map;
}

function fallbackName(uid) {
  // Your manual nice-name overrides:
  const map = {
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
  return map[uid] || `User ${uid.slice(0, 6)}…`;
}
function prettyName(uid, userDataMap) {
  const meta = userDataMap[uid] || {};
  return meta.displayName || fallbackName(uid);
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

/* ===== Admin add/remove helpers ===== */
async function addMembersToWeek(weekKey, uidList) {
  if (!uidList.length) return;
  const updates = {};
  uidList.forEach(uid => {
    updates[`subscriberPools/${weekKey}/members/${uid}`] = true;
  });
  await update(ref(db), updates);
}
async function addOneMember(weekKey, uid) {
  return update(ref(db), { [`subscriberPools/${weekKey}/members/${uid}`]: true });
}
async function removeOneMember(weekKey, uid) {
  return update(ref(db), { [`subscriberPools/${weekKey}/members/${uid}`]: null });
}
async function loadCurrentMembers(weekKey) {
  const s = await get(ref(db, `subscriberPools/${weekKey}/members`));
  const out = [];
  if (s.exists()) {
    const obj = s.val();
    for (const uid of Object.keys(obj)) out.push(uid);
  }
  return out.sort();
}

/* ===== Admin panel rendering ===== */
function renderUserList(listEl, items, { actionLabel, actionClass, actionDataAttr }) {
  listEl.innerHTML = items.map(u => `
    <li>
      <strong>${u.name}</strong>
      <small style="opacity:.8;">&nbsp;— ${u.uid}</small>
      <button class="btn ${actionClass}" data-${actionDataAttr}="${u.uid}" style="margin-left:8px;">${actionLabel}</button>
    </li>
  `).join('');
}

async function renderAdminPanel() {
  const panel = document.getElementById('mp-admin');
  if (!panel) return;

  const { weekKey } = await getSettings();

  // data
  const [userDataMap, memberUids] = await Promise.all([
    fetchUserDataMap(),
    loadCurrentMembers(weekKey),
  ]);
  const memberSet = new Set(memberUids);

  // split all users into "members" and "available"
  const allUsers = Object.keys(userDataMap).map(uid => ({
    uid,
    name: prettyName(uid, userDataMap)
  })).sort((a, b) => a.name.localeCompare(b.name));

  const currentMembers = allUsers.filter(u => memberSet.has(u.uid));
  const availableUsers = allUsers.filter(u => !memberSet.has(u.uid));

  // populate lists
  const membersList = document.getElementById('mp-members-list');
  const allUsersList = document.getElementById('mp-all-users-list');
  const filterInput = document.getElementById('mp-user-filter');

  renderUserList(membersList, currentMembers, {
    actionLabel: 'Remove',
    actionClass: 'mp-remove',
    actionDataAttr: 'uid'
  });
  renderUserList(allUsersList, availableUsers, {
    actionLabel: 'Add',
    actionClass: 'mp-add',
    actionDataAttr: 'uid'
  });

  // wire buttons: remove / add
  membersList.onclick = async (e) => {
    const btn = e.target.closest('.mp-remove');
    if (!btn) return;
    const uid = btn.dataset.uid;
    try {
      await removeOneMember(weekKey, uid);
      await renderAdminPanel();      // refresh lists
      await renderMoneyPool();       // refresh board
    } catch (err) {
      console.error('remove member error:', err);
      alert('Could not remove member.');
    }
  };

  allUsersList.onclick = async (e) => {
    const btn = e.target.closest('.mp-add');
    if (!btn) return;
    const uid = btn.dataset.uid;
    try {
      await addOneMember(weekKey, uid);
      await renderAdminPanel();      // refresh lists
      await renderMoneyPool();       // refresh board
    } catch (err) {
      console.error('add member error:', err);
      alert('Could not add member.');
    }
  };

  // simple filter for All Users
  if (filterInput) {
    filterInput.oninput = () => {
      const q = norm(filterInput.value);
      const filtered = availableUsers.filter(u =>
        norm(u.name).includes(q) || norm(u.uid).includes(q)
      );
      renderUserList(allUsersList, filtered, {
        actionLabel: 'Add',
        actionClass: 'mp-add',
        actionDataAttr: 'uid'
      });
    };
  }
}

/* ===== Main Money Pool render ===== */
async function renderMoneyPool() {
  setStatus('Loading…');
  const container = containerEl();
  if (container) container.innerHTML = '';

  const { weekKey, weekLabel } = await getSettings();
  setWeekLabel(weekKey, weekLabel);

  const [winnersMap, allowSet] = await Promise.all([
    loadWinnersForWeek(weekKey),
    loadAllowlist(weekKey),
  ]);

  if (!allowSet || allowSet.size === 0) {
    setStatus('No subscribers yet for this week.');
    return;
  }

  const picksSnap = await get(ref(db, `scoreboards/${weekKey}`));
  if (!picksSnap.exists()) {
    setStatus('No picks submitted for this week.');
    return;
  }
  const picksByUser = picksSnap.val();

  const userDataMap = await fetchUserDataMap();
  const userScores = [];
  const filteredIds = Object.keys(picksByUser).filter(uid => allowSet.has(uid));

  filteredIds.forEach(uid => {
    const userPicks = picksByUser[uid];
    const totalScore = calculateTotalScore(userPicks, winnersMap);
    userScores.push({
      userId: uid,
      userName: prettyName(uid, userDataMap),
      totalScore,
      profilePic: (userDataMap[uid]?.profilePic) || 'images/NFL LOGOS/nfl-logo.jpg',
      usernameColor: (userDataMap[uid]?.usernameColor) || '#FFD700',
    });
  });

  if (userScores.length === 0) {
    setStatus('No subscribers have submitted picks yet.');
    return;
  }

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
      window.location.href = 'index.html';
      return;
    }

    // Render Money Pool
    renderMoneyPool().catch(err => {
      console.error('Money Pool render error:', err);
      setStatus('Something went wrong loading the Money Pool.');
    });

    // Admin-only panel
    const panel = document.getElementById('mp-admin');
    if (panel) panel.style.display = (user.uid === ADMIN_UID) ? 'block' : 'none';
    if (user.uid === ADMIN_UID) {
      // Render admin lists
      renderAdminPanel().catch(console.error);

      // Optional: Keep your existing “Refresh Members” button if you kept it in HTML
      const refreshBtn = document.getElementById('mp-refresh-members');
      if (refreshBtn) {
        refreshBtn.onclick = () => renderAdminPanel();
      }
    }
  });
});

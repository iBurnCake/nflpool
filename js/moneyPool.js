// moneyPool.js
import { auth, onAuthStateChanged, db, ref, get, update } from './firebaseConfig.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';

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

const winnerString = (v) =>
  (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name)) || '';

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

/* ---- Visibility gate (same switch as House Picks, with optional dedicated flag) ---- */
async function canShowMoneyPoolPicks(user) {
  if (user?.uid === ADMIN_UID) return true;

  // If you add a dedicated flag, this respects it first:
  try {
    const mp = await get(ref(db, 'settings/showMoneyPoolPicks'));
    if (mp.exists() && mp.val() === true) return true;
  } catch {}

  // Fallback to the same switch House Picks uses
  try {
    const hp = await get(ref(db, 'settings/showHousePicks'));
    return hp.exists() && hp.val() === true;
  } catch {
    return false;
  }
}

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
  let raw = {};
  if (s.exists()) raw = s.val() || {};
  else {
    const t = await get(ref(db, `winners/${weekKey}`));
    raw = t.exists() ? (t.val().games ?? {}) : {};
  }
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[k] = winnerString(v);
  return out;
}

async function loadAllowlist(weekKey) {
  const s = await get(ref(db, `subscriberPools/${weekKey}/members`));
  if (!s.exists()) return new Set();
  const obj = s.val() || {};
  return new Set(Object.entries(obj).filter(([, v]) => !!v).map(([uid]) => uid));
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
  const map = {
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
    'F70T1damAEe1oq53RGYo7QKkaPA2': 'Brayden Trunnell',
    'PaHlsxdFFMRRbd4YurMdAsfaFhe2': 'Gavin Munoz',
  };
  return map[uid] || `User ${uid.slice(0, 6)}…`;
}
function prettyName(uid, userDataMap) {
  const meta = userDataMap[uid] || {};
  return meta.displayName || fallbackName(uid);
}

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

async function loadAllUsersMap() {
  const s = await get(ref(db, 'users'));
  const out = {};
  if (s.exists()) {
    const obj = s.val();
    for (const uid of Object.keys(obj)) {
      const u = obj[uid] || {};
      const name = u.displayName || u.name || u.username || fallbackName(uid);
      out[uid] = { name };
    }
  }
  return out;
}

async function addOneMember(weekKey, uid) {
  return update(ref(db), { [`subscriberPools/${weekKey}/members/${uid}`]: true });
}
async function removeOneMember(weekKey, uid) {
  return update(ref(db), { [`subscriberPools/${weekKey}/members/${uid}`]: null });
}
async function loadCurrentMembers(weekKey) {
  const s = await get(ref(db, `subscriberPools/${weekKey}/members`));
  if (!s.exists()) return [];
  return Object.entries(s.val() || {})
    .filter(([, v]) => !!v)
    .map(([uid]) => uid)
    .sort();
}

function renderMembersList(members, allUsers, onRemove) {
  const ul = document.getElementById('mp-members-list');
  if (!ul) return;
  if (!members.length) {
    ul.innerHTML = '<li><em>No members yet</em></li>';
    return;
  }
  ul.innerHTML = members
    .map(uid => {
      const display = allUsers?.[uid]?.name || fallbackName(uid);
      const safeUid = uid.replace(/"/g, '&quot;');
      return `
        <li style="display:flex;align-items:center;gap:10px;margin:6px 0;">
          <span>${display}</span>
          <button class="btn btn-danger" data-uid="${safeUid}">Remove</button>
        </li>`;
    })
    .join('');

  ul.querySelectorAll('button[data-uid]').forEach(btn => {
    btn.addEventListener('click', () => onRemove(btn.getAttribute('data-uid')));
  });
}

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

document.addEventListener('DOMContentLoaded', () => {
  setStatus('Loading…');

  onAuthStateChanged(auth, async (user) => {
    showLoader('Loading Money Pool…');
    try {
      if (!user) {
        hideLoader();
        window.location.href = 'index.html';
        return;
      }

      // ---- visibility check for non-admin ----
      const visible = await canShowMoneyPoolPicks(user);
      if (!visible) {
        setStatus('Hidden until admin enables picks visibility.');
        const c = containerEl();
        if (c) {
          c.innerHTML = `
            <div class="pill" style="border:1px solid #666;color:#bbb;display:inline-block;padding:8px 12px;border-radius:20px;">
              Hidden until admin enables Money Pool picks
            </div>`;
        }
        return;
      }

      await renderMoneyPool().catch(err => {
        console.error('Money Pool render error:', err);
        setStatus('Something went wrong loading the Money Pool.');
      });

      // ==== Admin membership panel wiring (if present) ====
      const panel = document.getElementById('mp-admin');
      if (panel) panel.style.display = (user.uid === ADMIN_UID) ? 'block' : 'none';
      if (user.uid !== ADMIN_UID) return;

      const input = document.getElementById('mp-user-filter');
      const addBtn = document.getElementById('mp-add-from-search');
      const refreshBtn = document.getElementById('mp-refresh-members');

      let allUsersMap = await loadAllUsersMap();

      async function refreshMembersUI() {
        const { weekKey } = await getSettings();
        const members = await loadCurrentMembers(weekKey);
        renderMembersList(members, allUsersMap, async (uid) => {
          try {
            await removeOneMember(weekKey, uid);
            await refreshMembersUI();
            await renderMoneyPool();
          } catch (e) {
            console.error('Remove member error:', e);
            alert('Error removing member. Check console.');
          }
        });
      }

      function findUidByQuery(q) {
        const query = String(q || '').trim().toLowerCase();
        if (!query) return null;

        if (allUsersMap[query]) return query;

        const matches = Object.entries(allUsersMap)
          .filter(([, v]) => String(v.name || '').toLowerCase().includes(query))
          .map(([uid]) => uid);

        if (matches.length === 1) return matches[0];
        if (matches.length === 0) return null;

        alert(
          `Multiple matches:\n\n${
            matches.map(uid => `${allUsersMap[uid].name} — ${uid}`).join('\n')
          }\n\nPlease refine your search.`
        );
        return null;
      }

      async function addFromSearch() {
        const { weekKey } = await getSettings();
        const q = input?.value || '';
        const uid = findUidByQuery(q);

        if (!uid) {
          alert('No exact UID or unique name match found.');
          return;
        }
        try {
          await addOneMember(weekKey, uid);
          input.value = '';
          await refreshMembersUI();
          await renderMoneyPool();
        } catch (e) {
          console.error('Add member error:', e);
          alert('Error adding member. Check console.');
        }
      }

      addBtn?.addEventListener('click', addFromSearch);
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addFromSearch();
      });
      refreshBtn?.addEventListener('click', async () => {
        allUsersMap = await loadAllUsersMap();
        await refreshMembersUI();
      });

      refreshMembersUI().catch(console.error);
    } finally {
      hideLoader();
    }
  });
});

clearBootLoader();

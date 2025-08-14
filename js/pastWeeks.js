// js/pastWeeks.js
import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';

/* Winners for completed games (add each new week when known) */
const winnersByWeek = {
  week9: {
    0: 'Ravens', 1: 'Eagles', 2: '', 3: 'Lions', 4: 'Browns', 5: 'Patriots',
    6: 'Giants', 7: 'Vikings', 8: 'Steelers', 9: 'Rams', 10: 'Buccaneers',
    11: 'Cardinals', 12: 'Jets', 13: 'Broncos', 14: '', 15: 'Chargers'
  }
};

/* Optional pretty names */
function fallbackName(uid) {
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

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setStatus('Loading…');
  const container = ensureContainer();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setStatus('');
      container.innerHTML = signInRequiredCard();
      return;
    }
    try {
      await loadCurrentLeaderboard();
      setStatus('');
    } catch (e) {
      console.error('PastWeeks error:', e?.code, e?.message, e);
      setStatus('There was an error. Check console for details.');
      container.innerHTML = errorCard('Error loading data.');
    }
  });
});

/* ---------- main ---------- */
async function loadCurrentLeaderboard() {
  const container = ensureContainer();

  const { weekKey, picksByUser } = await getLatestScoreboard();
  const weekLabel = document.getElementById('pw-week');
  if (weekLabel && weekKey) weekLabel.textContent = `— ${weekKey}`;

  if (!picksByUser) {
    container.innerHTML = cardHTML('Leaderboard', `
      <tbody><tr><td colspan="3" style="text-align:center;">No data yet</td></tr></tbody>
    `);
    return;
  }

  const usersMeta = await getUsersMeta();
  const winners = winnersByWeek[weekKey] || {};

  const rows = Object.entries(picksByUser).map(([uid, picks]) => {
    const total = computeTotal(picks, winners);
    const m = usersMeta[uid] || {};
    const name = m.displayName || m.name || m.username || fallbackName(uid);
    const color = m.usernameColor || '#FFD700';
    const profile = m.profilePic || 'images/NFL LOGOS/nfl-logo.jpg';
    return { uid, name, color, profile, total };
  }).sort((a, b) => b.total - a.total);

  const body = rows.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div class="leaderboard-user">
          <img src="${u.profile}" alt="${u.name}">
          <span style="color:${u.color};">${u.name}</span>
        </div>
      </td>
      <td>${u.total}</td>
    </tr>
  `).join('');

  container.innerHTML = cardHTML('Leaderboard', `
    <thead><tr><th>Rank</th><th>User</th><th>Total Score</th></tr></thead>
    <tbody>${body}</tbody>
  `);
}

/* ---------- data helpers ---------- */
async function getLatestScoreboard() {
  const root = await get(ref(db, 'scoreboards'));     // requires auth if your rules do
  if (!root.exists()) return { weekKey: null, picksByUser: null };

  const obj = root.val();
  let latestKey = null, latestNum = -1;
  for (const k of Object.keys(obj)) {
    const m = /^week(\d+)$/i.exec(k);
    const n = m ? parseInt(m[1], 10) : -1;
    if (n > latestNum) { latestNum = n; latestKey = k; }
  }
  if (!latestKey) latestKey = Object.keys(obj).sort().pop();

  const wk = await get(ref(db, `scoreboards/${latestKey}`));
  return { weekKey: latestKey, picksByUser: wk.exists() ? wk.val() : null };
}

async function getUsersMeta() {
  const s = await get(ref(db, 'users'));
  return s.exists() ? s.val() : {};
}

function computeTotal(userPicks, winners) {
  let total = 0;
  for (const idx in userPicks) {
    const p = userPicks[idx];
    const chosen = p?.team;
    const pts = p?.points || 0;
    const win = winners[idx];
    if (win && chosen === win) total += pts;
  }
  return total;
}

/* ---------- tiny UI helpers ---------- */
function ensureContainer() {
  let c = document.getElementById('pastWeeksContainer');
  if (!c) {
    c = document.createElement('div');
    c.id = 'pastWeeksContainer';
    document.body.appendChild(c);
  }
  return c;
}
function setStatus(msg) {
  let s = document.getElementById('pw-status');
  if (!s) {
    s = document.createElement('div');
    s.id = 'pw-status';
    s.style.cssText = 'margin:10px 0;font-weight:600;text-align:center;color:#FFD700;';
    const main = document.querySelector('.pw-main') || document.body;
    main.insertBefore(s, main.firstChild?.nextSibling || null);
  }
  s.textContent = msg || '';
}
function cardHTML(title, tableInner) {
  return `
    <div class="user-picks-container">
      <h3 class="user-header">${title}</h3>
      <table class="user-picks-table">${tableInner}</table>
    </div>`;
}
function errorCard(text) {
  return cardHTML('Leaderboard', `<tbody>
    <tr><td colspan="3" style="text-align:center;color:#FFD700;">${text}</td></tr>
  </tbody>`);
}
function signInRequiredCard() {
  return cardHTML('Leaderboard', `<tbody>
    <tr><td colspan="3" style="text-align:center;">
      Sign-in required. <a href="index.html" style="color:#3B7EED;font-weight:700;">Go to Login</a>
    </td></tr>
  </tbody>`);
}

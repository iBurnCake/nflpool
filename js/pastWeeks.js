import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();

function setStatus(text) {
  const s = document.getElementById('pw-status');
  if (!s) return;
  s.textContent = text || '';
}

function container() {
  return document.getElementById('pastWeeksContainer');
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
    '154NpbRIlUQyKwyDjsuW2k4J5Io2': 'Brayden Trunnell',
  };
  return map[uid] || `User ${uid.slice(0, 6)}…`;
}

async function getUsersMeta() {
  const snap = await get(ref(db, 'users'));
  if (!snap.exists()) return {};
  return snap.val();
}

function prettyWeek(key) {
  const m = /^week(\d+)$/i.exec(key);
  if (m) return `Week ${Number(m[1])}`;
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function getWinnersNode(weekKey) {
  // winners label + games
  const [gamesSnap, labelSnap, cdSnap] = await Promise.all([
    get(ref(db, `winners/${weekKey}/games`)),
    get(ref(db, `winners/${weekKey}/label`)),
    get(ref(db, 'settings/countdown'))  // { currentWeek, currentWeekLabel }
  ]);

  let games = gamesSnap.exists() ? (gamesSnap.val() || {}) : {};
  let label = labelSnap.exists() ? labelSnap.val() : null;

  // If the /games child doesn't exist, peek at the whole node
  if (!gamesSnap.exists()) {
    const whole = await get(ref(db, `winners/${weekKey}`));
    if (whole.exists()) {
      const v = whole.val() || {};
      games = v.games ?? games;
      label = v.label ?? label;
    }
  }

  // If no winners label, check settings/countdown for the current week's friendly label
  if (!label && cdSnap.exists()) {
    const cd = cdSnap.val() || {};
    if (String(cd.currentWeek) === String(weekKey) && cd.currentWeekLabel) {
      label = cd.currentWeekLabel;
    }
  }

  // Final fallback: pretty-print the key
  if (!label) label = prettyWeek(weekKey);

  return { games, label };
}

function computeTotal(picks, winnersGames) {
  if (!picks) return 0;
  let total = 0;
  for (const idx of Object.keys(picks)) {
    const p = picks[idx];
    const chosen = norm(p?.team);
    const pts = Number.parseInt(p?.points ?? 0, 10) || 0;
    const win = norm(winnersGames?.[idx]);
    if (win && chosen === win) total += pts;
  }
  return total;
}

async function listWeeks() {
  const root = await get(ref(db, 'scoreboards'));
  if (!root.exists()) return [];
  const keys = Object.keys(root.val());

  const withNums = keys.map(k => {
    const m = /^week(\d+)$/i.exec(k);
    return { key: k, n: m ? parseInt(m[1], 10) : -1 };
  });
  withNums.sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
  return withNums.map(x => x.key);
}

async function buildWeekLeaderboard(weekKey, usersMeta) {
  const [winnersNode, picksSnap] = await Promise.all([
    getWinnersNode(weekKey),
    get(ref(db, `scoreboards/${weekKey}`))
  ]);

  const winnersGames = winnersNode.games || {};
  const weekLabel = winnersNode.label || weekKey;

  if (!picksSnap.exists()) {
    return { weekKey, weekLabel, rows: [], hasWinners: Object.keys(winnersGames).length > 0 };
  }

  const picksByUser = picksSnap.val();
  const rows = Object.entries(picksByUser).map(([uid, picks]) => {
    const total = computeTotal(picks, winnersGames);
    const meta = usersMeta[uid] || {};
    return {
      uid,
      name: meta.displayName || meta.name || meta.username || fallbackName(uid),
      color: meta.usernameColor || '#FFD700',
      profile: meta.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
      total
    };
  }).sort((a, b) => b.total - a.total);

  return { weekKey, weekLabel, rows, hasWinners: Object.keys(winnersGames).length > 0 };
}

function renderWeekCard({ weekLabel, rows, hasWinners }) {
  const c = container();
  const card = document.createElement('div');
  card.className = 'user-picks-container';

  const h = document.createElement('h3');
  h.className = 'user-header';
  h.textContent = weekLabel;
  card.appendChild(h);

  const table = document.createElement('table');
  table.className = 'user-picks-table';

  if (!hasWinners) {
    table.innerHTML = `
      <thead><tr><th>Rank</th><th>User</th><th>Total Score</th></tr></thead>
      <tbody><tr><td colspan="3" style="text-align:center;">Winners not posted yet</td></tr></tbody>
    `;
  } else if (rows.length === 0) {
    table.innerHTML = `
      <thead><tr><th>Rank</th><th>User</th><th>Total Score</th></tr></thead>
      <tbody><tr><td colspan="3" style="text-align:center;">No picks saved</td></tr></tbody>
    `;
  } else {
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

    table.innerHTML = `
      <thead><tr><th>Rank</th><th>User</th><th>Total Score</th></tr></thead>
      <tbody>${body}</tbody>
    `;
  }

  card.appendChild(table);
  c.appendChild(card);
}

async function renderPastWeeks() {
  setStatus('Loading…');
  const c = container();
  c.innerHTML = '';

  const [weeks, usersMeta] = await Promise.all([listWeeks(), getUsersMeta()]);
  if (weeks.length === 0) {
    setStatus('');
    c.innerHTML = '<div class="user-picks-container"><h3 class="user-header">No weeks found</h3></div>';
    return;
  }

  for (const wk of weeks) {
    try {
      const data = await buildWeekLeaderboard(wk, usersMeta);
      renderWeekCard(data);
    } catch (e) {
      console.error('PastWeeks: failed for', wk, e);
      const errCard = document.createElement('div');
      errCard.className = 'user-picks-container';
      errCard.innerHTML = `
        <h3 class="user-header">${wk}</h3>
        <table class="user-picks-table">
          <tbody><tr><td colspan="3" style="text-align:center;">Error loading this week.</td></tr></tbody>
        </table>`;
      c.appendChild(errCard);
    }
  }

  setStatus('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('pw-status')) {
    const s = document.createElement('div');
    s.id = 'pw-status';
    s.style.cssText = 'margin:10px 0;font-weight:600;text-align:center;color:#FFD700;';
    (document.querySelector('.past-weeks-view') || document.body).insertAdjacentElement('afterbegin', s);
  }

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      setStatus('Sign in required.');
      return;
    }
    renderPastWeeks().catch(err => {
      console.error('renderPastWeeks error:', err);
      setStatus('There was an error loading past weeks.');
    });
  });
});

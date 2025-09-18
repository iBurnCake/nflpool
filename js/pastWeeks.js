import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';

setBootMessage('Loading past weeks…');

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';
const norm = (s) => String(s ?? '').trim().toLowerCase();
const winnerString = (v) =>
  (typeof v === 'string') ? v : (v && (v.winner || v.team || v.name)) || '';

function setStatus(text) {
  const s = document.getElementById('pw-status');
  if (s) s.textContent = text || '';
}
function container() { return document.getElementById('pastWeeksContainer'); }

async function safeGet(path) {
  try { return await get(ref(db, path)); }
  catch { return null; }
}
function prettyWeek(key) {
  const m = /^week(\d+)$/i.exec(key);
  return m ? `Week ${Number(m[1])}` : key;
}
async function getUsersMeta() {
  const snap = await safeGet('users');
  return snap && snap.exists() ? (snap.val() || {}) : {};
}

async function listWeeks() {
  const snap = await safeGet('winners');
  if (!snap || !snap.exists()) return [];

  const winnersRoot = snap.val() || {};
  const weeks = Object.entries(winnersRoot)
    .filter(([, v]) => v && v.games && Object.keys(v.games).length > 0)
    .map(([k]) => k);

  return weeks.sort((a, b) => {
    const na = parseInt((/^week(\d+)$/i.exec(a) || [0, 0])[1], 10);
    const nb = parseInt((/^week(\d+)$/i.exec(b) || [0, 0])[1], 10);
    return (nb - na) || a.localeCompare(b);
  });
}

async function getWinnersNode(weekKey) {
  const snap = await safeGet(`winners/${weekKey}`);
  const node = snap && snap.exists() ? (snap.val() || {}) : {};
  const games = {};
  for (const [k, v] of Object.entries(node.games || {})) {
    games[k] = winnerString(v);
  }
  return { games, label: node.label || prettyWeek(weekKey) };
}

function computeTotal(picks, winnersGames) {
  if (!picks) return 0;
  let total = 0;
  for (const [idx, p] of Object.entries(picks)) {
    const chosen = norm(p?.team);
    const pts = Number.parseInt(p?.points ?? 0, 10) || 0;
    const win = norm(winnersGames[idx]);
    if (win && chosen === win) total += pts;
  }
  return total;
}

async function buildWeekLeaderboard(weekKey, usersMeta) {
  const [winnersNode, picksSnap] = await Promise.all([
    getWinnersNode(weekKey),
    safeGet(`scoreboards/${weekKey}`)
  ]);

  if (!picksSnap || !picksSnap.exists()) return null; 

  const winnersGames = winnersNode.games || {};
  const weekLabel = winnersNode.label || weekKey;
  const picksByUser = picksSnap.val() || {};

  const anyPicks = Object.values(picksByUser).some(v => v && Object.keys(v).length);
  if (!anyPicks) return null;

  const rows = Object.entries(picksByUser).map(([uid, picks]) => {
    const meta = usersMeta[uid] || {};
    return {
      uid,
      name: meta.displayName || meta.name || meta.username || `User ${uid.slice(0,6)}…`,
      color: meta.usernameColor || '#FFD700',
      profile: meta.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
      total: computeTotal(picks, winnersGames)
    };
  }).sort((a, b) => b.total - a.total);

  return { weekKey, weekLabel, rows };
}

function renderWeekCard({ weekLabel, rows }) {
  const c = container();
  const card = document.createElement('div');
  card.className = 'user-picks-container';

  const h = document.createElement('h3');
  h.className = 'user-header';
  h.textContent = weekLabel;
  card.appendChild(h);

  const table = document.createElement('table');
  table.className = 'user-picks-table';

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
    c.innerHTML = `
      <div class="user-picks-container">
        <h3 class="user-header">No completed weeks yet</h3>
        <table class="user-picks-table">
          <tbody><tr><td style="text-align:center;">Check back after games finish.</td></tr></tbody>
        </table>
      </div>`;
    return;
  }

  let rendered = 0;
  for (const wk of weeks) {
    try {
      const lb = await buildWeekLeaderboard(wk, usersMeta);
      if (lb && lb.rows.length > 0) {
        renderWeekCard(lb);
        rendered++;
      }
    } catch (e) {
      console.warn('PastWeeks: failed for', wk, e);
    }
  }

  setStatus(rendered === 0 ? 'No past results to display yet.' : '');
}

document.getElementById('backToPicksBtn')
  ?.addEventListener('click', () => (window.location.href = 'index.html'));

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    showLoader('Loading past weeks…');
    try {
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      await renderPastWeeks();
    } catch (err) {
      console.error('renderPastWeeks error:', err);
      setStatus('There was an error loading past weeks.');
    } finally {
      hideLoader();
      clearBootLoader();
    }
  });
});

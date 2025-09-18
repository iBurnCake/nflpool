// js/adminWinnersFromHouse.js
import { auth, onAuthStateChanged, db, ref, get, set } from './firebaseConfig.js';
import { games, gameLabel, norm } from './weekGames.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';

const $ = (s) => document.querySelector(s);
const el = (id) => document.getElementById(id);

function setStatus(t) {
  const s = el('aw-status');
  if (s) s.textContent = t || '';
}
function setWeekLabel(text) {
  const span = el('aw-week-label');
  if (span) span.textContent = text ? `— ${text}` : '';
}

async function getCurrentWeek() {
  let weekKey = 'week1', weekLabel = '';
  try {
    const [w, l] = await Promise.all([
      get(ref(db, 'settings/currentWeek')),
      get(ref(db, 'settings/currentWeekLabel')),
    ]);
    if (w.exists()) weekKey = w.val();
    if (l.exists()) weekLabel = l.val();
  } catch {}
  return { weekKey, weekLabel };
}

async function loadWinners(weekKey) {
  const s1 = await get(ref(db, `winners/${weekKey}/games`));
  if (s1.exists()) return s1.val() || {};
  const s2 = await get(ref(db, `winners/${weekKey}`));
  if (s2.exists()) return (s2.val().games || {});
  return {};
}

async function saveWinner(weekKey, idx, winnerName) {
  await set(ref(db, `winners/${weekKey}/games/${idx}`), winnerName || null);
}

async function clearAllWinners(weekKey) {
  await set(ref(db, `winners/${weekKey}/games`), null);
}

function renderGames({ weekKey, weekLabel, winners }) {
  const wrap = el('aw-games-list');
  if (!wrap) return;

  setWeekLabel(weekLabel || weekKey);

  if (!Array.isArray(games) || games.length === 0) {
    wrap.innerHTML = `<div class="settings-container"><p>No games configured in weekGames.js.</p></div>`;
    return;
  }

  const rows = games.map((g, i) => {
    const winner = String(winners?.[i] || '');
    const isHome = norm(winner) === norm(g.homeTeam);
    const isAway = norm(winner) === norm(g.awayTeam);

    return `
      <tr data-index="${i}">
        <td style="text-align:left;">
          <div style="display:flex;flex-direction:column;gap:2px">
            <div><b>${g.awayTeam}</b> @ <b>${g.homeTeam}</b></div>
            <small style="opacity:.75">${g.awayRecord ?? ''} @ ${g.homeRecord ?? ''}</small>
          </div>
        </td>
        <td><button class="aw-btn-home ${isHome ? 'selected' : ''}" type="button">${g.homeTeam}</button></td>
        <td><button class="aw-btn-away ${isAway ? 'selected' : ''}" type="button">${g.awayTeam}</button></td>
        <td><button class="aw-btn-clear" type="button">Clear</button></td>
        <td><span class="aw-winner-pill" style="display:inline-block;padding:4px 8px;border:1px solid #666;border-radius:999px;background:#222;">
          ${winner || '—'}
        </span></td>
      </tr>
    `;
  }).join('');

  wrap.innerHTML = `
    <table class="user-picks-table">
      <thead>
        <tr>
          <th style="text-align:left;">Matchup</th>
          <th>Home Wins</th>
          <th>Away Wins</th>
          <th>Clear</th>
          <th>Current</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // wire events
  wrap.querySelectorAll('tr[data-index]').forEach((row) => {
    const idx = Number(row.getAttribute('data-index'));
    const g = games[idx];

    const btnHome = row.querySelector('.aw-btn-home');
    const btnAway = row.querySelector('.aw-btn-away');
    const btnClear = row.querySelector('.aw-btn-clear');
    const pill = row.querySelector('.aw-winner-pill');

    btnHome?.addEventListener('click', async () => {
      try {
        await saveWinner(weekKey, idx, g.homeTeam);
        btnHome.classList.add('selected');
        btnAway?.classList.remove('selected');
        pill.textContent = g.homeTeam;
      } catch (e) { console.error(e); setStatus('Error saving winner.'); }
    });

    btnAway?.addEventListener('click', async () => {
      try {
        await saveWinner(weekKey, idx, g.awayTeam);
        btnAway.classList.add('selected');
        btnHome?.classList.remove('selected');
        pill.textContent = g.awayTeam;
      } catch (e) { console.error(e); setStatus('Error saving winner.'); }
    });

    btnClear?.addEventListener('click', async () => {
      try {
        await saveWinner(weekKey, idx, null);
        btnAway?.classList.remove('selected');
        btnHome?.classList.remove('selected');
        pill.textContent = '—';
      } catch (e) { console.error(e); setStatus('Error clearing winner.'); }
    });
  });
}

async function refreshPanel() {
  setStatus('Loading…');
  try {
    const { weekKey, weekLabel } = await getCurrentWeek();
    const winners = await loadWinners(weekKey);
    renderGames({ weekKey, weekLabel, winners });
    setStatus('');
  } catch (e) {
    console.error('refreshPanel error', e);
    setStatus('Error loading panel.');
  }
}

function guardAdmin(user) {
  const panel = el('winnersPanel');
  if (!panel) return false;
  const isAdmin = !!user && user.uid === ADMIN_UID;
  panel.style.display = isAdmin ? 'block' : 'none';
  return isAdmin;
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!guardAdmin(user)) return;
    await refreshPanel();
    el('aw-refresh')?.addEventListener('click', refreshPanel);
    el('aw-clear-all')?.addEventListener('click', async () => {
      const { weekKey } = await getCurrentWeek();
      if (!confirm(`Clear all winners for ${weekKey}?`)) return;
      try { await clearAllWinners(weekKey); await refreshPanel(); }
      catch (e) { console.error(e); setStatus('Error clearing winners.'); }
    });
  });
});

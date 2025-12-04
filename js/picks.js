import { auth, db, ref, set, get, child } from './firebaseConfig.js';
import { CURRENT_WEEK, IS_LOCKED, refreshCurrentWeek } from './settings.js';
import { applyLockUI, setSaveStatus, showToast } from './ui.js';

const games = [
  // Thu
  { homeTeam: 'Lions',        awayTeam: 'Cowboys',      homeRecord: '7-5',   awayRecord: '6-5-1' },

  // Sun early
  { homeTeam: 'Falcons',      awayTeam: 'Seahawks',     homeRecord: '4-8',   awayRecord: '9-3' },
  { homeTeam: 'Bills',        awayTeam: 'Bengals',      homeRecord: '8-4',   awayRecord: '4-8' },
  { homeTeam: 'Browns',       awayTeam: 'Titans',       homeRecord: '3-9',   awayRecord: '1-11' },
  { homeTeam: 'Vikings',      awayTeam: 'Commanders',   homeRecord: '4-8',   awayRecord: '3-9' },
  { homeTeam: 'Jets',         awayTeam: 'Dolphins',     homeRecord: '3-9',   awayRecord: '5-7' },
  { homeTeam: 'Buccaneers',   awayTeam: 'Saints',       homeRecord: '7-5',   awayRecord: '2-10' },
  { homeTeam: 'Jaguars',      awayTeam: 'Colts',        homeRecord: '8-4',   awayRecord: '8-4' },
  { homeTeam: 'Ravens',       awayTeam: 'Steelers',     homeRecord: '6-6',   awayRecord: '6-6' },

  // Sun late
  { homeTeam: 'Raiders',      awayTeam: 'Broncos',      homeRecord: '2-10',  awayRecord: '10-2' }, // 4:05 ET
  { homeTeam: 'Packers',      awayTeam: 'Bears',        homeRecord: '8-3-1', awayRecord: '9-3' },  // 4:25 ET
  { homeTeam: 'Cardinals',    awayTeam: 'Rams',         homeRecord: '3-9',   awayRecord: '9-3' },  // 4:25 ET

  // Sun night
  { homeTeam: 'Chiefs',       awayTeam: 'Texans',       homeRecord: '6-6',   awayRecord: '7-5' },

  // Mon night
  { homeTeam: 'Chargers',     awayTeam: 'Eagles',       homeRecord: '8-4',   awayRecord: '8-4' },
];
let userPicks = {};
let usedPoints = new Set();

export function displayGames() {
  const tbody = document.getElementById('gamesTable')?.querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  games.forEach((game, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})</td>
      <td>
        <button id="home-${index}" onclick="selectPick(${index}, 'home')">${game.homeTeam}</button>
        <button id="away-${index}" onclick="selectPick(${index}, 'away')">${game.awayTeam}</button>
      </td>
      <td>
        <select id="confidence${index}" onchange="assignConfidence(${index})" required></select>
        <span id="confidenceDisplay${index}" class="confidence-display"></span>
      </td>
    `;
    updateConfidenceDropdown(index);

    if (IS_LOCKED) {
      document.getElementById(`home-${index}`)?.setAttribute('disabled', 'true');
      document.getElementById(`away-${index}`)?.setAttribute('disabled', 'true');
      document.getElementById(`confidence${index}`)?.setAttribute('disabled', 'true');
    }
  });
}

export function updateConfidenceDropdown(gameIndex) {
  const dropdown = document.getElementById(`confidence${gameIndex}`);
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">Select</option>';
  for (let i = 1; i <= 14; i++) {
    if (!usedPoints.has(i)) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      dropdown.appendChild(opt);
    }
  }
}

export function selectPick(gameIndex, team) {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }

  userPicks[gameIndex] = userPicks[gameIndex] || {};
  userPicks[gameIndex].team = (team === 'home') ? games[gameIndex].homeTeam : games[gameIndex].awayTeam;

  const homeButton = document.getElementById(`home-${gameIndex}`);
  const awayButton = document.getElementById(`away-${gameIndex}`);
  if (team === 'home') {
    homeButton?.classList.add('selected');
    awayButton?.classList.remove('selected');
  } else {
    awayButton?.classList.add('selected');
    homeButton?.classList.remove('selected');
  }

  if (auth.currentUser) saveUserPicks(auth.currentUser.uid);
}

export function assignConfidence(gameIndex) {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }

  const select = document.getElementById(`confidence${gameIndex}`);
  const display = document.getElementById(`confidenceDisplay${gameIndex}`);
  if (!select || !display) return;

  const points = parseInt(select.value);
  if (userPicks[gameIndex]?.points) usedPoints.delete(userPicks[gameIndex].points);

  if (points >= 1 && points <= 14 && !usedPoints.has(points)) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].points = points;
    usedPoints.add(points);
    display.textContent = String(points);

    if (auth.currentUser) saveUserPicks(auth.currentUser.uid);
    games.forEach((_, i) => updateConfidenceDropdown(i));
  } else {
    select.value = '';
    display.textContent = '';
  }
}

export function saveUserPicks(userId) {
  const path = `scoreboards/${CURRENT_WEEK}/${userId}`;
  setSaveStatus('saving');
  return set(ref(db, path), userPicks)
    .then(() => setSaveStatus('saved'))
    .catch((error) => {
      console.error('Error saving picks:', error);
      setSaveStatus('error');
      showToast('Save failed', { error: true });
    });
}

export function loadUserPicks(userId) {
  const path = `scoreboards/${CURRENT_WEEK}/${userId}`;
  return get(child(ref(db), path))
    .then((snap) => {
      if (snap.exists()) {
        userPicks = snap.val() || {};
        displayUserPicks(userPicks);
      } else {
        userPicks = {};
        usedPoints.clear();
        games.forEach((_, i) => updateConfidenceDropdown(i));
      }
    })
    .catch((error) => console.error('Error loading picks:', error));
}

export function displayUserPicks(picks) {
  for (const gameIndex in picks) {
    const pick = picks[gameIndex];
    const game = games[gameIndex];
    if (!game) continue;

    if (pick.team === game.homeTeam) {
      document.getElementById(`home-${gameIndex}`)?.classList.add('selected');
    } else if (pick.team === game.awayTeam) {
      document.getElementById(`away-${gameIndex}`)?.classList.add('selected');
    }

    if (pick.points) {
      usedPoints.add(pick.points);
      const sel = document.getElementById(`confidence${gameIndex}`);
      const disp = document.getElementById(`confidenceDisplay${gameIndex}`);
      if (sel) sel.value = pick.points;
      if (disp) disp.textContent = pick.points;
    }
  }
  games.forEach((_, i) => updateConfidenceDropdown(i));
}

export function resetPicks() {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }
  userPicks = {};
  usedPoints.clear();
  displayGames();
  if (auth.currentUser) saveUserPicks(auth.currentUser.uid);
  applyLockUI();
}

export async function submitPicks() {
  try {
    await refreshCurrentWeek();
    if (auth.currentUser) await saveUserPicks(auth.currentUser.uid);
    showToast('Your picks are saved ✓');
  } catch (e) {
    console.error('Error submitting picks:', e);
    showToast('Save failed', { error: true });
  }
}

export function attachPickHandlersToWindow() {
  window.selectPick = selectPick;
  window.assignConfidence = assignConfidence;
  window.resetPicks = resetPicks;
  window.submitPicks = submitPicks;
}

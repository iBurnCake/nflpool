import { auth, db, ref, set, get, child } from './firebaseConfig.js';
import { CURRENT_WEEK, IS_LOCKED, refreshCurrentWeek } from './settings.js';
import { applyLockUI, setSaveStatus, showToast } from './ui.js';

const games = [
  // Sat
  { homeTeam: 'Buccaneers',  awayTeam: 'Panthers',   homeRecord: '7-9',   awayRecord: '8-8' },   // 4:30 ET
  { homeTeam: '49ers',       awayTeam: 'Seahawks',   homeRecord: '12-4',  awayRecord: '13-3' },  // 8:00 ET

  // Sun early (1:00 ET)
  { homeTeam: 'Vikings',     awayTeam: 'Packers',    homeRecord: '8-8',   awayRecord: '9-6-1' },
  { homeTeam: 'Bengals',     awayTeam: 'Browns',     homeRecord: '6-10',  awayRecord: '4-12' },
  { homeTeam: 'Texans',      awayTeam: 'Colts',      homeRecord: '11-5',  awayRecord: '8-8' },
  { homeTeam: 'Giants',      awayTeam: 'Cowboys',    homeRecord: '3-13',  awayRecord: '7-8-1' },
  { homeTeam: 'Falcons',     awayTeam: 'Saints',     homeRecord: '7-9',   awayRecord: '6-10' },
  { homeTeam: 'Jaguars',     awayTeam: 'Titans',     homeRecord: '12-4',  awayRecord: '3-13' },

  // Sun late (4:25 ET)
  { homeTeam: 'Broncos',     awayTeam: 'Chargers',   homeRecord: '13-3',  awayRecord: '11-5' },
  { homeTeam: 'Raiders',     awayTeam: 'Chiefs',     homeRecord: '2-14',  awayRecord: '6-10' },
  { homeTeam: 'Eagles',      awayTeam: 'Commanders', homeRecord: '11-5',  awayRecord: '4-12' },
  { homeTeam: 'Bills',       awayTeam: 'Jets',       homeRecord: '11-5',  awayRecord: '3-13' },
  { homeTeam: 'Patriots',    awayTeam: 'Dolphins',   homeRecord: '13-3',  awayRecord: '7-9' },
  { homeTeam: 'Rams',        awayTeam: 'Cardinals',  homeRecord: '11-5',  awayRecord: '3-13' },
  { homeTeam: 'Bears',       awayTeam: 'Lions',      homeRecord: '11-5',  awayRecord: '8-8' },

  // Sun night (8:20 ET)
  { homeTeam: 'Steelers',    awayTeam: 'Ravens',     homeRecord: '9-7',   awayRecord: '8-8' },
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
  for (let i = 1; i <= 16; i++) {
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

  if (points >= 1 && points <= 16 && !usedPoints.has(points)) {
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

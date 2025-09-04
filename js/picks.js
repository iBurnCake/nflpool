// js/picks.js
import { auth, db, ref, set, get, child } from './firebaseConfig.js';
import { CURRENT_WEEK, IS_LOCKED, refreshCurrentWeek } from './settings.js';
import { setSaveStatus, showToast } from './ui.js';

// --- Week's games (can later move to schedule.js if you want) ---
const games = [
  { homeTeam: 'Cowboys',  awayTeam: 'Eagles',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Chiefs',   awayTeam: 'Chargers', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Dolphins', awayTeam: 'Colts',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Steelers', awayTeam: 'Jets',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Panthers', awayTeam: 'Jaguars',  homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Cardinals',awayTeam: 'Saints',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Giants',   awayTeam: 'Commanders',homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Buccaneers',awayTeam: 'Falcons', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Bengals',  awayTeam: 'Browns',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Raiders',  awayTeam: 'Patriots', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: '49ers',    awayTeam: 'Seahawks', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Titans',   awayTeam: 'Broncos',  homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Lions',    awayTeam: 'Packers',  homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Texans',   awayTeam: 'Rams',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Ravens',   awayTeam: 'Bills',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Vikings',  awayTeam: 'Bears',    homeRecord: '0-0', awayRecord: '0-0' }
];

let userPicks = {};
let usedPoints = new Set();

// ---------- Rendering ----------
export function displayGames() {
  const tableBody = document.getElementById('gamesTable')?.getElementsByTagName('tbody')[0];
  if (!tableBody) return;

  tableBody.innerHTML = '';

  games.forEach((game, index) => {
    const row = tableBody.insertRow();
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

function updateConfidenceDropdown(gameIndex) {
  const dropdown = document.getElementById(`confidence${gameIndex}`);
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">Select</option>';
  for (let i = 1; i <= 16; i++) {
    if (!usedPoints.has(i)) {
      const option = document.createElement('option');
      option.value = i;
      option.text = i;
      dropdown.appendChild(option);
    }
  }
}

// ---------- Interactions ----------
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

  const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
  const confidenceDisplay = document.getElementById(`confidenceDisplay${gameIndex}`);
  const points = parseInt(confidenceSelect?.value ?? '', 10);

  if (userPicks[gameIndex]?.points) usedPoints.delete(userPicks[gameIndex].points);

  if (points >= 1 && points <= 16 && !usedPoints.has(points)) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].points = points;
    usedPoints.add(points);
    if (confidenceDisplay) confidenceDisplay.textContent = String(points);

    if (auth.currentUser) saveUserPicks(auth.currentUser.uid);
    games.forEach((_, i) => updateConfidenceDropdown(i));
  } else {
    if (confidenceSelect) confidenceSelect.value = '';
    if (confidenceDisplay) confidenceDisplay.textContent = '';
  }
}

// ---------- Persistence ----------
function saveUserPicks(userId) {
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
    .then((snapshot) => {
      if (snapshot.exists()) {
        userPicks = snapshot.val() || {};
        displayUserPicks(userPicks);
      } else {
        userPicks = {};
        usedPoints.clear();
        games.forEach((_, i) => updateConfidenceDropdown(i));
      }
    })
    .catch((error) => console.error('Error loading picks:', error));
}

function displayUserPicks(picks) {
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

// ---------- Buttons ----------
export async function resetPicks() {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }
  userPicks = {};
  usedPoints.clear();
  displayGames();
  if (auth.currentUser) await saveUserPicks(auth.currentUser.uid);
}

export async function submitPicks() {
  try {
    await refreshCurrentWeek();
    if (auth.currentUser) await saveUserPicks(auth.currentUser.uid);
    showToast('Your picks are saved ✓');
  } catch (error) {
    console.error('Error submitting picks:', error);
    showToast('Save failed', { error: true });
  }
}

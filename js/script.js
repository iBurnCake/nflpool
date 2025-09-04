import {
  auth,
  db,
  signInWithPopup,
  GoogleAuthProvider,
  ref,
  set,
  get,
  child,
  onAuthStateChanged
} from './firebaseConfig.js';

import { CURRENT_WEEK, IS_LOCKED, refreshCurrentWeek } from './settings.js';
import { applyLockUI, setSaveStatus, showToast } from './ui.js';
import { attachPoolMembersListener, detachPoolMembersListener, updatePoolTotalCardOnce } from './poolTotal.js';
import { getNameByEmail, loadUsernameColor, loadProfilePic } from './profiles.js';
import { renderTeamLogoPicker } from './teams.js';

// ---------------------- AUTH WIRING ----------------------
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await handleSuccessfulLogin(user);
    } else {
      console.log('No user logged in');
      detachPoolMembersListener();
      const loginSection = document.getElementById('loginSection');
      loginSection.style.display = 'flex';
      document.getElementById('userHomeSection').style.display = 'none';
    }
  });

  document.getElementById('googleLoginButton')?.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => handleSuccessfulLogin(result.user))
      .catch((error) => {
        console.error('Google login error:', error);
        alert('Google login failed. Please try again.');
      });
  });

  document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        detachPoolMembersListener();
        const loginSection = document.getElementById('loginSection');
        loginSection.style.display = 'flex';
        document.getElementById('userHomeSection').style.display = 'none';
        alert('You have been logged out.');
      })
      .catch((error) => {
        console.error('Logout error:', error.message);
        alert('Error logging out. Please try again.');
      });
  });

  document.getElementById('resetButton')?.addEventListener('click', resetPicks);
  document.getElementById('submitButton')?.addEventListener('click', submitPicks);
  document.getElementById('pastWeeksButton')?.addEventListener('click', () => {
    window.location.href = 'pastWeeks.html';
  });
});

async function handleSuccessfulLogin(user) {
  await refreshCurrentWeek();

  console.log('User logged in:', user.email);
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('userHomeSection').style.display = 'block';

  // Profiles
  const displayName = getNameByEmail(user.email);
  document.getElementById('usernameDisplay').textContent = displayName;
  loadUsernameColor(user.uid);

  // Teams/logo picker
  renderTeamLogoPicker({ containerId: 'logoSelection', previewId: 'profilePicPreview' });
  loadProfilePic(user.uid); // highlights saved logo & sets preview

  // Games / picks
  displayGames();
  await loadUserPicks(user.uid);
  applyLockUI();

  // Money pool
  attachPoolMembersListener();
  updatePoolTotalCardOnce();
}

// ---------------------- GAMES + PICKS (stay here for now) ----------------------
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

function displayGames() {
  const tableBody = document.getElementById('gamesTable').getElementsByTagName('tbody')[0];
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
      const hb = document.getElementById(`home-${index}`);
      const ab = document.getElementById(`away-${index}`);
      const sel = document.getElementById(`confidence${index}`);
      if (hb) hb.disabled = true;
      if (ab) ab.disabled = true;
      if (sel) sel.disabled = true;
    }
  });
}

function updateConfidenceDropdown(gameIndex) {
  const dropdown = document.getElementById(`confidence${gameIndex}`);
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

window.selectPick = function (gameIndex, team) {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }

  userPicks[gameIndex] = userPicks[gameIndex] || {};
  userPicks[gameIndex].team = (team === 'home') ? games[gameIndex].homeTeam : games[gameIndex].awayTeam;

  const homeButton = document.getElementById(`home-${gameIndex}`);
  const awayButton = document.getElementById(`away-${gameIndex}`);
  if (team === 'home') {
    homeButton.classList.add('selected');
    awayButton.classList.remove('selected');
  } else {
    awayButton.classList.add('selected');
    homeButton.classList.remove('selected');
  }

  saveUserPicks(auth.currentUser.uid);
};

window.assignConfidence = function (gameIndex) {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }

  const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
  const points = parseInt(confidenceSelect.value);
  const confidenceDisplay = document.getElementById(`confidenceDisplay${gameIndex}`);

  if (userPicks[gameIndex]?.points) {
    usedPoints.delete(userPicks[gameIndex].points);
  }

  if (points >= 1 && points <= 16 && !usedPoints.has(points)) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].points = points;
    usedPoints.add(points);
    confidenceDisplay.textContent = points;

    saveUserPicks(auth.currentUser.uid);
    games.forEach((_, i) => updateConfidenceDropdown(i));
  } else {
    confidenceSelect.value = '';
    confidenceDisplay.textContent = '';
  }
};

function saveUserPicks(userId) {
  const path = `scoreboards/${CURRENT_WEEK}/${userId}`;
  console.log('[save] ->', path);
  setSaveStatus('saving');
  return set(ref(db, path), userPicks)
    .then(() => {
      console.log('Picks saved successfully!');
      setSaveStatus('saved');
    })
    .catch((error) => {
      console.error('Error saving picks:', error);
      setSaveStatus('error');
      showToast('Save failed', { error: true });
    });
}

function loadUserPicks(userId) {
  const path = `scoreboards/${CURRENT_WEEK}/${userId}`;
  console.log('[load] <-', path);
  return get(child(ref(db), path))
    .then((snapshot) => {
      if (snapshot.exists()) {
        userPicks = snapshot.val();
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
      document.getElementById(`home-${gameIndex}`).classList.add('selected');
    } else if (pick.team === game.awayTeam) {
      document.getElementById(`away-${gameIndex}`).classList.add('selected');
    }

    if (pick.points) {
      usedPoints.add(pick.points);
      document.getElementById(`confidence${gameIndex}`).value = pick.points;
      document.getElementById(`confidenceDisplay${gameIndex}`).textContent = pick.points;
    }
  }
  games.forEach((_, i) => updateConfidenceDropdown(i));
}

window.resetPicks = function () {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }
  userPicks = {};
  usedPoints.clear();
  displayGames();
  saveUserPicks(auth.currentUser.uid);
  applyLockUI();
};

window.submitPicks = async function () {
  try {
    await refreshCurrentWeek();
    await saveUserPicks(auth.currentUser.uid);
    showToast('Your picks are saved ✓');
  } catch (error) {
    console.error('Error submitting picks:', error);
    showToast('Save failed', { error: true });
  }
};

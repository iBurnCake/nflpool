// script.js
import { auth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, db, ref, get, update } from './firebaseConfig.js';
import { refreshCurrentWeek } from './settings.js';
import { applyLockUI } from './ui.js';
import { getUsername, loadUsernameColor } from './profiles.js';
import { displayGames, loadUserPicks, resetPicks, submitPicks, selectPick, assignConfidence } from './picks.js';
import { normalizeUserDoc } from './normalizeUser.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';
import ensureAccessRequest from './ensureAccessRequest.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2'; // (not used here but fine to keep)

let _initialized = false; // prevent double-init

document.addEventListener('DOMContentLoaded', () => {
  setBootMessage('Loading…');
  showLoader('Loading…');

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        // show login UI
        showLoginUI();
        return;
      }

      // Hide home until we confirm approval to avoid any flicker
      hideHomeUI();

      // === Approval gate: auto-create request if needed ===
      let approved = false;
      try {
        const res = await ensureAccessRequest(user);
        approved = !!res?.approved;
      } catch (e) {
        console.error('ensureAccessRequest error:', e);
        approved = false;
      }

      if (!approved) {
        // send to waiting page; do not initialize the app UI
        window.location.href = 'request-access.html';
        return;
      }

      // Approved → proceed (guard against double init)
      if (_initialized) return;
      _initialized = true;
      await handleSuccessfulLogin(user);
    } catch (e) {
      console.error('init error:', e);
    } finally {
      hideLoader();
      clearBootLoader();
    }
  });

  // Google Login button — just sign in; onAuthStateChanged handles the rest
  document.getElementById('googleLoginButton')?.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error('Google login error:', error);
      alert('Google login failed. Please try again.');
    });
  });

  document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        showLoginUI();
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

function showLoginUI() {
  const loginSection = document.getElementById('loginSection');
  const homeSection  = document.getElementById('userHomeSection');
  if (loginSection) loginSection.style.display = 'flex';
  if (homeSection)  homeSection.style.display  = 'none';
}

function showHomeUI() {
  const loginSection = document.getElementById('loginSection');
  const homeSection  = document.getElementById('userHomeSection');
  if (loginSection) loginSection.style.display = 'none';
  if (homeSection)  homeSection.style.display  = 'block';
}

function hideHomeUI() {
  const homeSection  = document.getElementById('userHomeSection');
  if (homeSection)  homeSection.style.display  = 'none';
}

async function applyProfileCardDecor(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (!snap.exists()) return;

    const { profileBanner, profilePic, usernameColor } = snap.val() || {};

    const hero = document.querySelector('#dashboardCards .card:first-child .card-hero');
    if (hero && profileBanner) {
      hero.style.backgroundImage = `url("${profileBanner}")`;
    }

    const img = document.getElementById('dashProfilePic');
    if (img) img.src = profilePic || 'images/NFL LOGOS/nfl-logo.jpg';

    const name = document.getElementById('dashDisplayName');
    if (name && usernameColor) name.style.color = usernameColor;
  } catch (e) {
    console.warn('applyProfileCardDecor error:', e);
  }
}

async function handleSuccessfulLogin(user) {
  await refreshCurrentWeek();

  showHomeUI();

  const displayName = await getUsername(user.uid);
  try {
    await update(ref(db, `users/${user.uid}`), { displayName });
  } catch (e) {
    console.warn('Failed to persist displayName:', e);
  }

  const nameEl = document.getElementById('usernameDisplay');
  if (nameEl) nameEl.textContent = displayName;

  loadUsernameColor(user.uid);
  await normalizeUserDoc(user.uid);
  await applyProfileCardDecor(user.uid);

  // expose handlers for inline onclicks
  window.selectPick = selectPick;
  window.assignConfidence = assignConfidence;
  window.resetPicks = resetPicks;
  window.submitPicks = submitPicks;

  displayGames();
  await loadUserPicks(user.uid);

  applyLockUI();
}

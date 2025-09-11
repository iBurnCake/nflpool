// js/script.js
import {
  auth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  db,
  ref,
  get
} from './firebaseConfig.js';

import { refreshCurrentWeek, CURRENT_WEEK } from './settings.js';
import { applyLockUI } from './ui.js';
// NOTE: drop getNameByEmail — we no longer map emails to names client-side
import { loadUsernameColor } from './profiles.js';
import {
  displayGames,
  loadUserPicks,
  resetPicks,
  submitPicks,
  selectPick,
  assignConfidence
} from './picks.js';
import { normalizeUserDoc } from './normalizeUser.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';

// --- helpers -------------------------------------------------------------------
const shortUid = (uid) => (uid ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : 'Player');

async function fetchDisplayName(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}/displayName`));
    const val = snap.exists() ? String(snap.val() ?? '').trim() : '';
    return val || null;
  } catch {
    return null;
  }
}

function setWelcomeName(name) {
  const nameEl = document.getElementById('usernameDisplay');
  if (nameEl) nameEl.textContent = name;
}

// --- boot ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setBootMessage('Loading…');
  showLoader('Loading…');

  onAuthStateChanged(auth, async (user) => {
    try {
      if (user) {
        await handleSuccessfulLogin(user);
      } else {
        const loginSection = document.getElementById('loginSection');
        if (loginSection) loginSection.style.display = 'flex';
        const homeSection = document.getElementById('userHomeSection');
        if (homeSection) homeSection.style.display = 'none';
      }
    } catch (e) {
      console.error('init error:', e);
    } finally {
      hideLoader();
      clearBootLoader();
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
        const loginSection = document.getElementById('loginSection');
        if (loginSection) loginSection.style.display = 'flex';
        const homeSection = document.getElementById('userHomeSection');
        if (homeSection) homeSection.style.display = 'none';
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

// --- UI polish -----------------------------------------------------------------
async function applyProfileCardDecor(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (!snap.exists()) return;

    const { profileBanner, profilePic, usernameColor } = snap.val() || {};

    const hero = document.querySelector('#dashboardCards .card:first-child .card-hero');
    if (hero && profileBanner) hero.style.backgroundImage = `url("${profileBanner}")`;

    const img = document.getElementById('dashProfilePic');
    if (img) img.src = profilePic || 'images/NFL LOGOS/nfl-logo.jpg';

    const name = document.getElementById('dashDisplayName');
    if (name && usernameColor) name.style.color = usernameColor;
  } catch (e) {
    console.warn('applyProfileCardDecor error:', e);
  }
}

// --- login success flow --------------------------------------------------------
async function handleSuccessfulLogin(user) {
  await refreshCurrentWeek();

  const loginSection = document.getElementById('loginSection');
  const homeSection  = document.getElementById('userHomeSection');
  if (loginSection) loginSection.style.display = 'none';
  if (homeSection)  homeSection.style.display  = 'block';

  // Get admin-set displayName; fallback to a neutral label (no email mapping)
  const adminName = await fetchDisplayName(user.uid);
  const fallback  = shortUid(user.uid); // or 'New Player'
  setWelcomeName(adminName || fallback);

  // Color, profile card visuals, and any doc normalization (ensure it DOES NOT write displayName)
  loadUsernameColor(user.uid);
  await normalizeUserDoc(user.uid);
  await applyProfileCardDecor(user.uid);

  // Expose handlers globally for your existing UI
  window.selectPick = selectPick;
  window.assignConfidence = assignConfidence;
  window.resetPicks = resetPicks;
  window.submitPicks = submitPicks;

  // Build picks table & load user picks
  displayGames();
  await loadUserPicks(user.uid);

  applyLockUI();
}

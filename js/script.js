// js/script.js
import {
  auth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  db,
  ref,
  get,
  update
} from './firebaseConfig.js';

import { refreshCurrentWeek, CURRENT_WEEK } from './settings.js';
import { applyLockUI } from './ui.js';
import {
  attachPoolMembersListener,
  detachPoolMembersListener,
  updatePoolTotalCardOnce
} from './poolTotal.js';
import { getNameByEmail, loadUsernameColor } from './profiles.js';
import {
  displayGames,
  loadUserPicks,
  resetPicks,
  submitPicks,
  selectPick,
  assignConfidence
} from './picks.js';
import { normalizeUserDoc } from './normalizeUser.js';
import { watchAndFinalizeWeek } from './winners.js';

const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2'; // your admin

// --- Auth wiring ---
document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await handleSuccessfulLogin(user);
    } else {
      console.log('No user logged in');
      detachPoolMembersListener();
      const loginSection = document.getElementById('loginSection');
      if (loginSection) loginSection.style.display = 'flex';
      const homeSection = document.getElementById('userHomeSection');
      if (homeSection) homeSection.style.display = 'none';
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

// --- Decorate the Profile card (hero bg, avatar, name color) ---
async function applyProfileCardDecor(uid) {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (!snap.exists()) return;

    const { profileBanner, profilePic, usernameColor } = snap.val() || {};

    // Profile card hero: first card's hero in the dashboard grid
    const hero = document.querySelector('#dashboardCards .card:first-child .card-hero');
    if (hero && profileBanner) {
      hero.style.backgroundImage = `url("${profileBanner}")`;
    }

    // Avatar on the card
    const img = document.getElementById('dashProfilePic');
    if (img) {
      img.src = profilePic || 'images/NFL LOGOS/nfl-logo.jpg';
    }

    // Name color on the card
    const name = document.getElementById('dashDisplayName');
    if (name && usernameColor) {
      name.style.color = usernameColor;
    }
  } catch (e) {
    console.warn('applyProfileCardDecor error:', e);
  }
}

// --- Main login success flow ---
async function handleSuccessfulLogin(user) {
  await refreshCurrentWeek();

  console.log('User logged in:', user.email);
  const loginSection = document.getElementById('loginSection');
  const homeSection = document.getElementById('userHomeSection');
  if (loginSection) loginSection.style.display = 'none';
  if (homeSection) homeSection.style.display = 'block';

  // Friendly name (and persist it for members page, etc.)
  const displayName = getNameByEmail(user.email);
  try {
    await update(ref(db, `users/${user.uid}`), { displayName });
  } catch (e) {
    console.warn('Failed to persist displayName:', e);
  }

  const nameEl = document.getElementById('usernameDisplay');
  if (nameEl) nameEl.textContent = displayName;

  // Username color + normalize doc + decorate profile card
  loadUsernameColor(user.uid);
  await normalizeUserDoc(user.uid);
  await applyProfileCardDecor(user.uid);

  // Admin: watch winners/<week>/games and auto-finalize leaderboards/wins
  if (user.uid === ADMIN_UID) {
    watchAndFinalizeWeek(CURRENT_WEEK);
  }

  // Expose pick handlers globally for inline event usage
  window.selectPick = selectPick;
  window.assignConfidence = assignConfidence;
  window.resetPicks = resetPicks;
  window.submitPicks = submitPicks;

  // Load picks UI
  displayGames();
  await loadUserPicks(user.uid);
  applyLockUI();

  // Pool totals
  attachPoolMembersListener();
  updatePoolTotalCardOnce();
}

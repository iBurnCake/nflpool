import {
  auth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from './firebaseConfig.js';

import { refreshCurrentWeek } from './settings.js';
import { applyLockUI, showToast, setSaveStatus } from './ui.js';
import { attachPoolMembersListener, detachPoolMembersListener, updatePoolTotalCardOnce } from './poolTotal.js';
import { getNameByEmail, loadUsernameColor, loadProfilePic } from './profiles.js';
import { renderTeamLogoPicker } from './teams.js';
import {
  displayGames,
  loadUserPicks,
  resetPicks,
  submitPicks,
  selectPick,
  assignConfidence
} from './picks.js';

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

// expose handlers for inline onclicks created in displayGames()
window.selectPick = selectPick;
window.assignConfidence = assignConfidence;
// optional: expose these too
window.resetPicks = resetPicks;
window.submitPicks = submitPicks;

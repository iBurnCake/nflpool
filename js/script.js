import { auth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';

import { refreshCurrentWeek } from './settings.js';
import { applyLockUI } from './ui.js';
import { attachPoolMembersListener, detachPoolMembersListener, updatePoolTotalCardOnce } from './poolTotal.js';
import { getNameByEmail, loadUsernameColor, loadProfilePic } from './profiles.js';
import { renderTeamLogoPicker } from './teams.js';
import { displayGames, loadUserPicks, resetPicks, submitPicks, selectPick, assignConfidence } from './picks.js';

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

async function handleSuccessfulLogin(user) {
  await refreshCurrentWeek();

  console.log('User logged in:', user.email);
  const loginSection = document.getElementById('loginSection');
  const homeSection = document.getElementById('userHomeSection');
  if (loginSection) loginSection.style.display = 'none';
  if (homeSection) homeSection.style.display = 'block';

  const displayName = getNameByEmail(user.email);
  const nameEl = document.getElementById('usernameDisplay');
  if (nameEl) nameEl.textContent = displayName;
  loadUsernameColor(user.uid);

  await setDashboardProfilePic(user.uid);

  renderTeamLogoPicker({ containerId: 'logoSelection', previewId: 'profilePicPreview' });
  loadProfilePic(user.uid);

  window.selectPick = selectPick;
  window.assignConfidence = assignConfidence;
  window.resetPicks = resetPicks;
  window.submitPicks = submitPicks;
  
  displayGames();
  await loadUserPicks(user.uid);
  applyLockUI();

  attachPoolMembersListener();
  updatePoolTotalCardOnce();
}

async function setDashboardProfilePic(uid) {
  try {
    const path = 'users/' + uid + '/profilePic';
    const snap = await get(ref(db, path));
    const url = snap.exists() ? snap.val() : 'images/NFL LOGOS/nfl-logo.jpg';
    const img = document.getElementById('dashProfilePic');
    if (img) img.src = url;
  } catch (e) {
    console.warn('setDashboardProfilePic error:', e);
  }
}


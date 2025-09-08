// js/profilePage.js
import {
    auth,
    db,
    signInWithPopup,
    GoogleAuthProvider,
    ref,
    get,
    onAuthStateChanged
  } from './firebaseConfig.js';
  
  import { getNameByEmail, loadUsernameColor, loadProfilePic } from './profiles.js';
  import { renderTeamLogoPicker } from './teams.js';
  
  // Simple auth gate + wiring
  document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        showLogin();
        return;
      }
      await showProfile(user);
    });
  
    document.getElementById('googleLoginButton')?.addEventListener('click', () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).catch((err) => {
        console.error('Google login error:', err);
        alert('Google login failed. Please try again.');
      });
    });
  
    document.getElementById('logoutButton')?.addEventListener('click', () => {
      auth.signOut().then(() => {
        location.href = 'index.html';
      }).catch((e) => {
        console.error('Logout error:', e);
        alert('Error logging out. Please try again.');
      });
    });
  });
  
  function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('profilePage').style.display = 'none';
  }
  
  async function showProfile(user) {
    // Gate UI
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('profilePage').style.display = 'block';
  
    // Name
    const displayName = getNameByEmail(user.email);
    document.getElementById('usernameDisplay').textContent = displayName;
  
    // Wire color + logo using your existing helpers
    loadUsernameColor(user.uid);
    loadProfilePic(user.uid); // sets #profilePicPreview automatically
  
    // Render team logo picker grid and wire saving
    renderTeamLogoPicker({ containerId: 'logoSelection', previewId: 'profilePicPreview' });
  
    // Load (placeholder) stats if present
    await loadUserStats(user.uid);
  }
  
  // Placeholder: reads stats if you store them at users/{uid}/stats
  async function loadUserStats(uid) {
    try {
      const snap = await get(ref(db, `users/${uid}/stats`));
      const stats = snap.exists() ? snap.val() : {};
      setText('statWeeksWon',   stats.weeksWon ?? '—');
      setText('statTotalWon',   formatUSD(stats.totalWon ?? 0));
      setText('statTotalStaked',formatUSD(stats.totalStaked ?? 0));
      const net = (stats.totalWon ?? 0) - (stats.totalStaked ?? 0);
      setText('statNet', formatUSD(net));
    } catch (e) {
      console.warn('loadUserStats error:', e);
    }
  }
  
  function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  }
  
  function formatUSD(n) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    } catch { return `$${Math.round(n)}`; }
  }
// js/dashboard.js
import {
    auth,
    db,
    signInWithPopup,
    GoogleAuthProvider,
    ref,
    get,
    child,
    onAuthStateChanged,
  } from './firebaseConfig.js';
  
  import { CURRENT_WEEK, IS_LOCKED, refreshCurrentWeek } from './settings.js';
  import { getNameByEmail } from './profiles.js';
  
  // If you want the pool total on the card without listeners,
  // we can do a one-shot read here.
  const MEMBERS_PATH = 'subscriberPools/week1/members';
  const POOL_DOLLARS_PER_MEMBER = 5;
  
  // ---------- Auth wiring ----------
  document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await showDashboard(user);
      } else {
        showEl('loginSection', 'flex');
        hideEl('dashboardSection');
      }
    });
  
    byId('googleLoginButton')?.addEventListener('click', () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider).catch((err) => {
        console.error('Google login error:', err);
        alert('Google login failed. Please try again.');
      });
    });
  
    byId('logoutButton')?.addEventListener('click', () => {
      auth.signOut().catch((e) => {
        console.error('Logout error:', e);
        alert('Error logging out. Please try again.');
      });
    });
  });
  
  // ---------- Dashboard render ----------
  async function showDashboard(user) {
    await refreshCurrentWeek();
  
    // Gate UI
    hideEl('loginSection');
    showEl('dashboardSection', 'block');
  
    // Lock status pill (header)
    setText('dashLockLabel', IS_LOCKED ? 'Locked' : 'Open');
  
    // Profile card: name + logo
    const name = getNameByEmail(user.email);
    setText('dashDisplayName', name);
    await setDashboardProfilePic(user.uid);
  
    // My Picks card info
    setText('dashWeekLabel', extractWeekNumber(CURRENT_WEEK));
    const { pickCount } = await getPickSummary(user.uid);
    setText('dashPickCount', String(pickCount));
    setText('dashPickStatus', IS_LOCKED ? 'Locked' : 'Open');
  
    // Money pool (one-shot fetch)
    const total = await getPoolTotalOnce();
    setText('dashPoolTotal', formatUSD(total));
  }
  
  // ---------- Helpers ----------
  function byId(id) {
    return document.getElementById(id);
  }
  function setText(id, txt) {
    const el = byId(id);
    if (el) el.textContent = txt;
  }
  function showEl(id, display = 'block') {
    const el = byId(id);
    if (el) el.style.display = display;
  }
  function hideEl(id) {
    const el = byId(id);
    if (el) el.style.display = 'none';
  }
  
  function extractWeekNumber(weekKey) {
    // "week1" -> "1"
    const m = String(weekKey || '').match(/week(\d+)/i);
    return m ? m[1] : String(weekKey || '');
  }
  
  // Quick summary of the user’s picks this week
  async function getPickSummary(uid) {
    const path = `scoreboards/${CURRENT_WEEK}/${uid}`;
    try {
      const snap = await get(child(ref(db), path));
      if (!snap.exists()) return { pickCount: 0 };
      const val = snap.val() || {};
      const pickCount = Object.keys(val).length;
      return { pickCount };
    } catch (e) {
      console.warn('getPickSummary error:', e);
      return { pickCount: 0 };
    }
  }
  
  // One-shot money pool total
  async function getPoolTotalOnce() {
    try {
      const snap = await get(ref(db, MEMBERS_PATH));
      const obj = snap.exists() ? (snap.val() || {}) : {};
      const count = Object.values(obj).filter(Boolean).length;
      return count * POOL_DOLLARS_PER_MEMBER;
    } catch {
      return 0;
    }
  }
  
  function formatUSD(n) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `$${Math.round(n)}`;
    }
  }
  
  // Set the circular profile image used on the Profile card
  async function setDashboardProfilePic(uid) {
    try {
      const picSnap = await get(ref(db, `users/${uid}/profilePic`));
      const url = picSnap.exists()
        ? picSnap.val()
        : 'images/NFL LOGOS/nfl-logo.jpg';
      const img = byId('dashProfilePic');
      if (img) img.src = url;
    } catch (e) {
      console.warn('setDashboardProfilePic error:', e);
    }
  }
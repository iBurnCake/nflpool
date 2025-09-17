// dashboard.js
import {
  auth,
  db,
  signInWithPopup,
  GoogleAuthProvider,
  ref,
  get,
  onAuthStateChanged,
} from './firebaseConfig.js';

import { CURRENT_WEEK, CURRENT_WEEK_LABEL, IS_LOCKED, refreshCurrentWeek } from './settings.js';
import { preloadUserMeta, nameFor } from './names.js'; // UID-based names fallback to users/<uid> fields

const POOL_DOLLARS_PER_MEMBER = 5;

/* ------------- tiny DOM helpers ------------- */
const byId = (id) => document.getElementById(id);
const setText = (id, txt) => { const el = byId(id); if (el) el.textContent = txt; };
const showEl = (id, display='block') => { const el = byId(id); if (el) el.style.display = display; };
const hideEl = (id) => { const el = byId(id); if (el) el.style.display = 'none'; };

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

async function showDashboard(user) {
  // Make sure CURRENT_WEEK / label / lock state are fresh
  await refreshCurrentWeek();

  hideEl('loginSection');
  showEl('dashboardSection', 'block');

  // Lock/open label
  setText('dashLockLabel', IS_LOCKED ? 'Locked' : 'Open');

  // Name (UID-based from /users; falls back to short UID)
  await preloadUserMeta();
  const displayName = nameFor(user.uid);
  setText('dashDisplayName', displayName);

  // Profile card image
  await setDashboardProfilePic(user.uid);

  // Week label: prefer settings label if present
  const label = CURRENT_WEEK_LABEL || `Week ${extractWeekNumber(CURRENT_WEEK)}`;
  setText('dashWeekLabel', label);

  // Picks summary
  const { pickCount } = await getPickSummary(user.uid);
  setText('dashPickCount', String(pickCount));
  setText('dashPickStatus', IS_LOCKED ? 'Locked' : 'Open');

  // Money pool total for the current week
  const total = await getPoolTotalOnce(CURRENT_WEEK);
  setText('dashPoolTotal', formatUSD(total));
}

function extractWeekNumber(weekKey) {
  const m = String(weekKey || '').match(/week(\d+)/i);
  return m ? m[1] : String(weekKey || '');
}

async function getPickSummary(uid) {
  const path = `scoreboards/${CURRENT_WEEK}/${uid}`;
  try {
    const snap = await get(ref(db, path));
    if (!snap.exists()) return { pickCount: 0 };
    const val = snap.val() || {};
    return { pickCount: Object.keys(val).length };
  } catch (e) {
    console.warn('getPickSummary error:', e);
    return { pickCount: 0 };
  }
}

async function getPoolTotalOnce(weekKey) {
  try {
    const snap = await get(ref(db, `subscriberPools/${weekKey}/members`));
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
    }).format(Number(n) || 0);
  } catch {
    return `$${Math.round(Number(n) || 0)}`;
  }
}

async function setDashboardProfilePic(uid) {
  try {
    const picSnap = await get(ref(db, `users/${uid}/profilePic`));
    const url = picSnap.exists() ? picSnap.val() : 'images/NFL LOGOS/nfl-logo.jpg';
    const img = byId('dashProfilePic');
    if (img) img.src = url;
  } catch (e) {
    console.warn('setDashboardProfilePic error:', e);
  }
}

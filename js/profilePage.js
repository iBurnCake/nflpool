// js/profilePage.js
import {
  auth,
  db,
  signInWithPopup,
  GoogleAuthProvider,
  ref,
  get,
  set,
  update,
  onAuthStateChanged,
} from './firebaseConfig.js';

import { getNameByEmail, loadUsernameColor, loadProfilePic } from './profiles.js';
import { renderTeamLogoPicker } from './teams.js';
import { BANNERS } from './banners.js'; // list of banner data-URIs/URLs

// ---------- Helpers ----------
function getProfileRoot() {
  return document.getElementById('profilePage') || document.getElementById('profileSection');
}
function show(el, val = 'block') { if (el) el.style.display = val; }
function hide(el) { if (el) el.style.display = 'none'; }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function formatUSD(n) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch { return `$${Math.round(n || 0)}`; }
}

// ---------- Auth wiring ----------
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
    auth.signOut()
      .then(() => { location.href = 'index.html'; })
      .catch((e) => {
        console.error('Logout error:', e);
        alert('Error logging out. Please try again.');
      });
  });
});

function showLogin() {
  show(document.getElementById('loginSection'), 'flex');
  hide(getProfileRoot());
}

async function showProfile(user) {
  hide(document.getElementById('loginSection'));
  show(getProfileRoot());

  // Name
  const displayName = getNameByEmail(user.email);
  setText('usernameDisplay', displayName);

  // Username color + logo preview
  loadUsernameColor(user.uid);
  loadProfilePic(user.uid); // sets #profilePicPreview automatically

  // Team logo picker grid
  renderTeamLogoPicker({ containerId: 'logoSelection', previewId: 'profilePicPreview' });

  // Banner picker
  await renderBannerPicker(user);

  // Stats (will compute totalStaked from subscriberPools if missing)
  await loadUserStats(user.uid);
}

// ---------- Banner picker (stores both URL and ID) ----------
async function renderBannerPicker(user) {
  const root = document.getElementById('bannerSelection');
  const hero = document.getElementById('profileHero');
  if (!root) return;

  const urlRef = ref(db, `users/${user.uid}/profileBanner`);
  const idRef  = ref(db, `users/${user.uid}/profileBannerId`);

  let savedUrl = null;
  let savedId  = null;

  try {
    const [urlSnap, idSnap] = await Promise.all([get(urlRef), get(idRef)]);
    savedUrl = urlSnap.exists() ? urlSnap.val() : null;
    savedId  = idSnap.exists()  ? idSnap.val()  : null;
  } catch {}

  // Which tile to mark as selected?
  let selectedIndex = Number.isInteger(savedId) && savedId >= 0 && savedId < BANNERS.length
    ? savedId
    : matchBannerIndex(savedUrl);

  // Build grid
  root.innerHTML = '';
  BANNERS.forEach((url, i) => {
    const tile = document.createElement('button');
    tile.className = 'banner-option';
    tile.type = 'button';
    tile.style.backgroundImage = `url("${url}")`;
    tile.setAttribute('aria-label', `Banner ${i + 1}`);
    if (i === selectedIndex) tile.classList.add('selected');

    tile.addEventListener('click', async () => {
      // UI select
      [...root.children].forEach(c => c.classList.remove('selected'));
      tile.classList.add('selected');

      // Save BOTH: stable id + url
      try {
        await update(ref(db, `users/${user.uid}`), {
          profileBanner: url,
          profileBannerId: i,
        });
      } catch {}

      // Live hero preview (if your CSS uses --hero-bg)
      if (hero) hero.style.setProperty('--hero-bg', `url("${url}")`);
    });

    root.appendChild(tile);
  });

  // Apply hero bg on load (use whichever we have)
  const initialUrl = (selectedIndex != null && selectedIndex >= 0) ? BANNERS[selectedIndex] : savedUrl;
  if (initialUrl && hero) {
    hero.style.setProperty('--hero-bg', `url("${initialUrl}")`);
  }
}

// Try to match a saved URL to a current index (helps when you had only URLs before)
function matchBannerIndex(url) {
  if (!url) return -1;
  const norm = normalize(url);
  for (let i = 0; i < BANNERS.length; i++) {
    if (normalize(BANNERS[i]) === norm) return i;
  }
  return -1;
}
function normalize(u) {
  try {
    if (u.startsWith('data:image')) return decodeURIComponent(u).replace(/\s+/g, '');
    return u.trim();
  } catch {
    return u.trim();
  }
}

// ---------- Stakes helper ----------
const POOL_ENTRY_DOLLARS = 5;

// Replace your existing calcTotalStakedFromPools with this
async function calcTotalStakedFromPools(uid) {
  try {
    const snap = await get(ref(db, 'subscriberPools'));
    if (!snap.exists()) return 0;

    const pools = snap.val() || {};
    const STAKE = 5;            // dollars per member per week
    let total = 0;

    for (const [weekKey, weekNode] of Object.entries(pools)) {
      const members = weekNode && weekNode.members ? weekNode.members : null;
      if (members && typeof members === 'object' && members[uid]) {
        total += STAKE;
      }
    }
    return total;
  } catch (e) {
    console.error('calcTotalStakedFromPools error:', e);
    return 0;
  }
}

async function loadUserStats(uid) {
  // 1) Get existing stats (if any)
  let stats = {};
  try {
    const snap = await get(ref(db, `users/${uid}/stats`));
    if (snap.exists()) stats = snap.val() || {};
  } catch (e) {
    console.warn('loadUserStats: could not read user stats', e);
  }

  // 2) Compute staked from subscriberPools via helper
  const computedStaked = await calcTotalStakedFromPools(uid);

  // Prefer explicit value in DB if > 0, else use computed
  const totalStaked =
    Number.isFinite(Number(stats.totalStaked)) && Number(stats.totalStaked) > 0
      ? Number(stats.totalStaked)
      : computedStaked;

  const totalWon  = Number(stats.totalWon) || 0;
  const weeksWon  = Number(stats.weeksWon) ||  0;

  // 3) If DB had 0/missing but we computed > 0, persist it back
  if ((!stats.totalStaked || Number(stats.totalStaked) === 0) && computedStaked > 0) {
    try {
      await update(ref(db, `users/${uid}/stats`), { totalStaked: computedStaked });
    } catch (e) {
      console.warn('loadUserStats: could not write back totalStaked', e);
    }
  }

  // 4) Update UI
  setText('statWeeksWon', weeksWon || '—');
  setText('statTotalWon', formatUSD(totalWon));
  setText('statTotalStaked', formatUSD(totalStaked));
  setText('statNet', formatUSD(totalWon - totalStaked));
}

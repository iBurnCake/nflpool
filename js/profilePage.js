// js/profilePage.js
import {
  auth, db, signInWithPopup, GoogleAuthProvider,
  ref, get, update, onAuthStateChanged
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
const toNum = (x) => (typeof x === 'number') ? x : Number(x) || 0;

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

  // Friendly display name
  const displayName = getNameByEmail(user.email);
  setText('usernameDisplay', displayName);

  // Persist friendly name for Members page (safe here; user defined)
  try {
    await update(ref(db, `users/${user.uid}`), { displayName });
  } catch (e) {
    console.warn('Could not persist displayName', e);
  }

  // Username color + logo preview
  loadUsernameColor(user.uid);
  loadProfilePic(user.uid); // sets #profilePicPreview automatically

  // Team logo picker grid
  renderTeamLogoPicker({ containerId: 'logoSelection', previewId: 'profilePicPreview' });

  // Banner picker
  await renderBannerPicker(user);

  // Stats (compute fallbacks from pools + winners if missing)
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

async function calcTotalStakedFromPools(uid) {
  try {
    const snap = await get(ref(db, 'subscriberPools'));
    if (!snap.exists()) return 0;

    const pools = snap.val() || {};
    let total = 0;

    for (const weekNode of Object.values(pools)) {
      const members = weekNode && weekNode.members ? weekNode.members : null;
      if (members && typeof members === 'object' && members[uid]) {
        total += POOL_ENTRY_DOLLARS;
      }
    }
    return total;
  } catch (e) {
    console.error('calcTotalStakedFromPools error:', e);
    return 0;
  }
}

// ---------- Winners backfill helpers ----------
async function fetchWinnersRoot() {
  const snap = await get(ref(db, 'winners'));
  return snap.exists() ? (snap.val() || {}) : {};
}

/** For a single user, compute fallback totalWon and weeksWon from /winners. */
function computeBackfillFromWinners(winnersRoot, uid) {
  let totalWon = 0;
  let weeksWon = 0;

  for (const node of Object.values(winnersRoot || {})) {
    if (!node || typeof node !== 'object') continue;

    const houseWinners = Array.isArray(node.houseWinners) ? node.houseWinners : [];
    const poolWinners  = Array.isArray(node.moneyPoolWinners) ? node.moneyPoolWinners : [];
    const payout       = Number(node.payoutPerWinner) || 0;

    const inHouse = houseWinners.includes(uid);
    const inPool  = poolWinners.includes(uid);

    if (inHouse || inPool) weeksWon += 1;
    if (inPool) totalWon += payout;
  }
  return { totalWon, weeksWon };
}

async function loadUserStats(uid) {
  // 1) Read existing stats (if any)
  let stats = {};
  try {
    const snap = await get(ref(db, `users/${uid}/stats`));
    if (snap.exists()) stats = snap.val() || {};
  } catch (e) {
    console.warn('loadUserStats: could not read user stats', e);
  }

  // 2) Compute fallbacks
  const [computedStaked, winnersRoot] = await Promise.all([
    calcTotalStakedFromPools(uid),
    fetchWinnersRoot(),
  ]);
  const { totalWon: fallbackWon, weeksWon: fallbackWeeks } = computeBackfillFromWinners(winnersRoot, uid);

  // Prefer explicit DB values if > 0, else use computed/backfill
  const totalStaked =
    toNum(stats.totalStaked) > 0 ? toNum(stats.totalStaked) : computedStaked;

  const totalWon =
    toNum(stats.totalWon) > 0 ? toNum(stats.totalWon) : fallbackWon;

  const weeksWon =
    toNum(stats.weeksWon) > 0 ? toNum(stats.weeksWon) : fallbackWeeks;

  // 3) If DB had 0/missing but we computed > 0, persist them back for convenience
  const patch = {};
  if (toNum(stats.totalStaked) === 0 && computedStaked > 0) patch.totalStaked = computedStaked;
  if (toNum(stats.totalWon)   === 0 && fallbackWon    > 0) patch.totalWon    = fallbackWon;
  if (toNum(stats.weeksWon)   === 0 && fallbackWeeks  > 0) patch.weeksWon    = fallbackWeeks;

  if (Object.keys(patch).length) {
    try { await update(ref(db, `users/${uid}/stats`), patch); }
    catch (e) { console.warn('loadUserStats: could not write back stats', e); }
  }

  // 4) Update UI
  setText('statWeeksWon', weeksWon || '—');
  setText('statTotalWon', formatUSD(totalWon));
  setText('statTotalStaked', formatUSD(totalStaked));
  setText('statNet', formatUSD(totalWon - totalStaked));
}

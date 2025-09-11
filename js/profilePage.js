import {
  auth, db, signInWithPopup, GoogleAuthProvider,
  ref, get, update, onAuthStateChanged
} from './firebaseConfig.js';

import { loadUsernameColor, loadProfilePic } from './profiles.js'; // removed getNameByEmail
import { renderTeamLogoPicker } from './teams.js';
import { BANNERS } from './banners.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader, setBootMessage } from './boot.js';

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

// --- display name helpers (admin-controlled) -----------------------------------
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

document.addEventListener('DOMContentLoaded', () => {
  setBootMessage('Loading profile…');
  showLoader('Loading profile…');

  onAuthStateChanged(auth, async (user) => {
    try {
      if (!user) {
        showLogin();
        return;
      }
      await showProfile(user);
    } catch (e) {
      console.error('Profile init error:', e);
      alert('There was an error loading your profile.');
    } finally {
      hideLoader();
      clearBootLoader();
    }
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

  // --- display name comes only from DB; never write it from client
  const adminName = await fetchDisplayName(user.uid);
  setText('usernameDisplay', adminName || shortUid(user.uid));

  // User-owned visuals
  loadUsernameColor(user.uid);
  loadProfilePic(user.uid);

  renderTeamLogoPicker({ containerId: 'logoSelection', previewId: 'profilePicPreview' });

  await renderBannerPicker(user);
  await renderUserStats(user.uid);
}

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

  let selectedIndex = Number.isInteger(savedId) && savedId >= 0 && savedId < BANNERS.length
    ? savedId
    : matchBannerIndex(savedUrl);

  root.innerHTML = '';
  BANNERS.forEach((url, i) => {
    const tile = document.createElement('button');
    tile.className = 'banner-option';
    tile.type = 'button';
    tile.style.backgroundImage = `url("${url}")`;
    tile.setAttribute('aria-label', `Banner ${i + 1}`);
    if (i === selectedIndex) tile.classList.add('selected');

    tile.addEventListener('click', async () => {
      [...root.children].forEach(c => c.classList.remove('selected'));
      tile.classList.add('selected');
      try {
        await update(ref(db, `users/${user.uid}`), {
          profileBanner: url,
          profileBannerId: i,
        });
      } catch {}
      if (hero) hero.style.setProperty('--hero-bg', `url("${url}")`);
    });

    root.appendChild(tile);
  });

  const initialUrl = (selectedIndex != null && selectedIndex >= 0) ? BANNERS[selectedIndex] : savedUrl;
  if (initialUrl && hero) {
    hero.style.setProperty('--hero-bg', `url("${initialUrl}")`);
  }
}

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

async function fetchWinnersRoot() {
  const snap = await get(ref(db, 'winners'));
  return snap.exists() ? (snap.val() || {}) : {};
}

function computeFromWinnersFinalized(winnersRoot, uid) {
  let totalWon = 0;
  let weeksWon = 0;

  for (const node of Object.values(winnersRoot || {})) {
    if (!node || typeof node !== 'object' || node.awardedStats !== true) continue;

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

async function renderUserStats(uid) {
  let stats = {};
  try {
    const snap = await get(ref(db, `users/${uid}/stats`));
    if (snap.exists()) stats = snap.val() || {};
  } catch (e) {
    console.warn('renderUserStats: could not read user stats', e);
  }

  const [computedStaked, winnersRoot] = await Promise.all([
    calcTotalStakedFromPools(uid),
    fetchWinnersRoot(),
  ]);
  const { totalWon: calcWon, weeksWon: calcWeeks } = computeFromWinnersFinalized(winnersRoot, uid);

  const totalStaked = toNum(stats.totalStaked) > 0 ? toNum(stats.totalStaked) : computedStaked;
  const totalWon    = toNum(stats.totalWon)   > 0 ? toNum(stats.totalWon)   : calcWon;
  const weeksWon    = toNum(stats.weeksWon)   > 0 ? toNum(stats.weeksWon)   : calcWeeks;

  setText('statWeeksWon', weeksWon || '—');
  setText('statTotalWon', formatUSD(totalWon));
  setText('statTotalStaked', formatUSD(totalStaked));
  setText('statNet', formatUSD(totalWon - totalStaked));
}

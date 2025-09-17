import { auth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';
import { showLoader, hideLoader } from './loader.js';
import { clearBootLoader } from './boot.js';
import { preloadUserMeta, nameFor } from './names.js';

const ENTRY_FEE = 5;

/* ---------- data helpers ---------- */

async function fetchPools() {
  const snap = await get(ref(db, 'subscriberPools'));
  return snap.exists() ? (snap.val() || {}) : {};
}
function stakedFromPools(uid, pools) {
  let total = 0;
  for (const weekKey of Object.keys(pools || {})) {
    const mem = pools[weekKey]?.members;
    if (mem && typeof mem === 'object' && mem[uid]) total += ENTRY_FEE;
  }
  return total;
}

async function fetchWinnersRoot() {
  const snap = await get(ref(db, 'winners'));
  return snap.exists() ? (snap.val() || {}) : {};
}

function buildBackfillMaps(winnersRoot) {
  const wonMap = Object.create(null);
  const weeksMap = Object.create(null);

  for (const [, node] of Object.entries(winnersRoot || {})) {
    if (!node || typeof node !== 'object') continue;

    const houseWinners = Array.isArray(node.houseWinners) ? node.houseWinners : [];
    const poolWinners  = Array.isArray(node.moneyPoolWinners) ? node.moneyPoolWinners : [];
    const payout       = Number(node.payoutPerWinner) || 0;

    const union = new Set([...houseWinners, ...poolWinners]);
    for (const uid of union) weeksMap[uid] = (weeksMap[uid] || 0) + 1;
    for (const uid of poolWinners) wonMap[uid] = (wonMap[uid] || 0) + payout;
  }
  return { wonMap, weeksMap };
}

/* ---------- small utils ---------- */

const grid = () => document.getElementById('memberGrid');
const setStatus = (t) => { const s = document.getElementById('members-status'); if (s) s.textContent = t || ''; };
const shortUid = (uid) => `${uid.slice(0,6)}…${uid.slice(-4)}`;
const toNum = (x) => (typeof x === 'number') ? x : Number(x) || 0;
const clamp0 = (n) => Math.max(0, toNum(n));
const fmtUSD = (n) => {
  try {
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(Number(n)||0);
  } catch { return `$${Math.round(Number(n)||0)}`; }
};

const FALLBACK_BANNER = 'images/banners/banner01.svg';
const FALLBACK_AVATAR = 'images/NFL LOGOS/nfl-logo.jpg';

async function getUsersMeta() {
  const snap = await get(ref(db, 'users'));
  return snap.exists() ? (snap.val() || {}) : {};
}

async function getAllRosterUids() {
  const rosterSnap = await get(ref(db, 'subscriberPools/users'));
  if (rosterSnap.exists()) {
    const obj = rosterSnap.val() || {};
    return Object.keys(obj).filter((uid) => !!obj[uid]);
  }
  const usersSnap = await get(ref(db, 'users'));
  if (usersSnap.exists()) return Object.keys(usersSnap.val() || {});
  return [];
}

/* ---------- render ---------- */

function renderMemberCards(usersMeta, uids, pools, backfill) {
  const { wonMap, weeksMap } = backfill || { wonMap:{}, weeksMap:{} };

  const container = grid();
  container.innerHTML = '';

  if (!uids.length) {
    container.innerHTML = `
      <div class="settings-container" style="grid-column:1/-1;">
        <p>No users found.</p>
      </div>`;
    return;
  }

  const sorted = [...uids].sort((a, b) =>
    (nameFor(a) || usersMeta[a]?.displayName || shortUid(a)).toLowerCase()
      .localeCompare((nameFor(b) || usersMeta[b]?.displayName || shortUid(b)).toLowerCase())
  );

  for (const uid of sorted) {
    const u = usersMeta[uid] || {};

    const banner = u.profileBanner || FALLBACK_BANNER;
    const avatar = u.profilePic    || FALLBACK_AVATAR;
    const name   = nameFor(uid) || u.displayName || u.name || u.username || shortUid(uid);
    const color  = u.usernameColor || '#FFD700';

    // ---- stored vs computed (robust selection) ----
    const stats = u.stats || {};
    const storedStaked = clamp0(stats.totalStaked);
    const storedWon    = clamp0(stats.totalWon);
    const storedWeeks  = clamp0(stats.weeksWon);

    const computedStaked = clamp0(stakedFromPools(uid, pools));
    const computedWon    = clamp0(wonMap[uid]);
    const computedWeeks  = clamp0(weeksMap[uid]);

    // Prefer stored if positive; otherwise use computed
    const totalStaked = storedStaked > 0 ? storedStaked : computedStaked;
    const totalWon    = storedWon    > 0 ? storedWon    : computedWon;
    const weeksWon    = storedWeeks  > 0 ? storedWeeks  : computedWeeks;

    const net = clamp0(totalWon) - clamp0(totalStaked); // prevent weird negatives from bad data

    const card = document.createElement('div');
    card.className = 'card member-card';

    const hero = document.createElement('div');
    hero.className = 'card-hero';
    hero.style.backgroundImage = `url("${banner}")`;

    const img = document.createElement('img');
    img.className = 'member-avatar';
    img.src = avatar;
    img.alt = `${name} avatar`;
    hero.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    const h3 = document.createElement('h3');
    h3.className = 'member-name';
    h3.textContent = name;
    h3.style.color = color;

    const p = document.createElement('p');
    p.className = 'member-stats';
    p.innerHTML = `Weeks Won: <b>${weeksWon}</b> • Net: <b>${fmtUSD(net)}</b>`;

    body.appendChild(h3);
    body.appendChild(p);

    card.appendChild(hero);
    card.appendChild(body);

    container.appendChild(card);
  }
}

async function renderMembers() {
  setStatus('Loading…');
  grid().innerHTML = '';

  await preloadUserMeta();

  const [usersMeta, uids, pools, winnersRoot] = await Promise.all([
    getUsersMeta(),
    getAllRosterUids(),
    fetchPools(),
    fetchWinnersRoot(),
  ]);

  const backfill = buildBackfillMaps(winnersRoot);
  renderMemberCards(usersMeta, uids, pools, backfill);
  setStatus('');
}

/* ---------- boot ---------- */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('members-status')) {
    const s = document.createElement('div');
    s.id = 'members-status';
    s.style.cssText = 'margin:10px 0;font-weight:700;text-align:center;color:#FFD700;';
    document.body.insertAdjacentElement('afterbegin', s);
  }

  onAuthStateChanged(auth, async (user) => {
    showLoader('Loading members…');
    try {
      const login = document.getElementById('loginSection');
      const main  = document.getElementById('membersSection');

      if (!user) {
        if (login) login.style.display = 'flex';
        if (main)  main.style.display  = 'none';
        const btn = document.getElementById('googleLoginButton');
        btn?.addEventListener('click', () => {
          const provider = new GoogleAuthProvider();
          signInWithPopup(auth, provider).catch((err) => {
            console.error('Google login error:', err);
            alert('Google login failed. Please try again.');
          });
        });
        setStatus('Sign in required.');
        return;
      }

      if (login) login.style.display = 'none';
      if (main)  main.style.display  = 'block';

      await renderMembers();
    } catch (e) {
      console.error('renderMembers error:', e);
      setStatus('There was an error loading users.');
    } finally {
      hideLoader();
      clearBootLoader();
    }
  });
});

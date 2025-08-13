// js/moneyPool.js
// Money Pool page logic: login gate, week label, load allowlist, render members' boards.
// This version is self-contained and will render simple cards with each member's picks.
// If you later expose a shared renderer (e.g., loadHousePicks(allowUids)), see the hook below.

// OPTIONAL: if you create a shared renderer later, uncomment this and the call in renderMoneyPool()
// import { loadHousePicks } from './housePicks.js';

import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';

/* -------------------------
   Week ID (keep consistent)
-------------------------- */
function getCurrentWeekId() {
  const d = new Date();
  const year = d.getFullYear();
  const firstJan = new Date(year, 0, 1);
  const days = Math.floor((d - firstJan) / 86400000);
  const week = Math.floor((days + firstJan.getDay() + 6) / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/* -------------------------
   UI helpers
-------------------------- */
function setWeekLabel() {
  const el = document.getElementById('mp-week');
  if (el) el.textContent = `— ${getCurrentWeekId()}`;
}

function setStatus(text) {
  const s = document.getElementById('mp-status');
  if (!s) return;
  s.textContent = text || '';
}

function clearContainer() {
  const container = document.getElementById('mp-container');
  if (container) container.innerHTML = '';
}

function appendToContainer(node) {
  const container = document.getElementById('mp-container');
  if (container) container.appendChild(node);
}

/* -------------------------
   Data helpers
-------------------------- */

// Try common picks locations in order; return first that exists.
// Adjust or add paths to match your database layout if needed.
const PICKS_PATHS = [
  (weekId, uid) => `picks/${weekId}/${uid}`,
  (weekId, uid) => `userPicks/${uid}/${weekId}`,
  (weekId, uid) => `picks/${uid}/${weekId}`,
];

async function fetchFirstExistingPath(weekId, uid) {
  for (const pathBuilder of PICKS_PATHS) {
    const path = pathBuilder(weekId, uid);
    const snap = await get(ref(db, path));
    if (snap.exists()) {
      return { path, data: snap.val() };
    }
  }
  return { path: null, data: null };
}

// Optional profile lookup if you store profile info.
// Looks in: profiles/{uid} and users/{uid}/profile
async function fetchUserProfile(uid) {
  const candidates = [
    `profiles/${uid}`,
    `users/${uid}/profile`,
  ];
  for (const p of candidates) {
    const snap = await get(ref(db, p));
    if (snap.exists()) return snap.val();
  }
  return null;
}

/* -------------------------
   Rendering
-------------------------- */

function makeCard({ displayName, uid, profilePicUrl, usernameColor, picks, picksPath }) {
  const card = document.createElement('div');
  card.className = 'mp-card';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '10px';
  header.style.marginBottom = '8px';

  const avatar = document.createElement('img');
  avatar.src = profilePicUrl || 'images/NFL LOGOS/nfl-logo.jpg';
  avatar.alt = displayName || uid;
  avatar.style.width = '36px';
  avatar.style.height = '36px';
  avatar.style.borderRadius = '50%';
  avatar.style.border = '2px solid #FFD700';
  avatar.style.objectFit = 'cover';

  const title = document.createElement('h3');
  title.textContent = displayName || uid;
  title.style.margin = 0;
  if (usernameColor) title.style.color = usernameColor;

  header.appendChild(avatar);
  header.appendChild(title);

  const body = document.createElement('div');

  if (picks) {
    // If you want fancier board UI, replace this with your existing board renderer.
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(picks, null, 2);
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.fontSize = '0.95rem';
    pre.style.opacity = '0.95';

    const small = document.createElement('div');
    small.textContent = picksPath ? `Source: ${picksPath}` : '';
    small.style.fontSize = '0.75rem';
    small.style.opacity = '0.7';
    small.style.marginTop = '6px';

    body.appendChild(pre);
    if (picksPath) body.appendChild(small);
  } else {
    const p = document.createElement('p');
    p.textContent = 'No picks submitted yet.';
    body.appendChild(p);
  }

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

/* -------------------------
   Main page flow
-------------------------- */

async function loadAllowlist(weekId) {
  const mSnap = await get(ref(db, `subscriberPools/${weekId}/members`));
  if (!mSnap.exists()) return new Set();
  return new Set(Object.keys(mSnap.val()));
}

async function renderMoneyPool() {
  setStatus('Loading…');
  clearContainer();

  const weekId = getCurrentWeekId();

  // 1) Get allowlist
  const allowUids = await loadAllowlist(weekId);

  if (!allowUids || allowUids.size === 0) {
    setStatus('No subscribers yet for this week.');
    return;
  }

  // If you later unify with a shared renderer, you can replace everything below with:
  // await loadHousePicks(allowUids); setStatus(''); return;

  // 2) For each member, attempt to fetch their profile and their picks
  const tasks = [];
  allowUids.forEach((uid) => {
    tasks.push((async () => {
      // Profile (optional)
      const profile = await fetchUserProfile(uid);
      const displayName =
        (profile && (profile.displayName || profile.name || profile.username)) || uid;
      const profilePicUrl =
        profile && (profile.profilePicUrl || profile.avatarUrl || profile.photoURL);
      const usernameColor = profile && profile.usernameColor;

      // Picks
      const { path: picksPath, data: picks } = await fetchFirstExistingPath(weekId, uid);

      // Render
      const card = makeCard({
        displayName, uid, profilePicUrl, usernameColor, picks, picksPath,
      });
      appendToContainer(card);
    })());
  });

  await Promise.all(tasks);
  setStatus('');
}

/* -------------------------
   Auth gate + boot
-------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  setWeekLabel();
  setStatus('Loading…');

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // not signed in — go back to home/login
      window.location.href = 'index.html';
      return;
    }
    // user is signed in; render page
    renderMoneyPool().catch((err) => {
      console.error('Money Pool render error:', err);
      setStatus('Something went wrong loading the Money Pool.');
    });
  });
});

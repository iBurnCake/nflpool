// js/names.js
import { db, ref, get } from './firebaseConfig.js';

let CACHE = {};
let PRIMED = false;

export function warmUsersCache(usersObject) {
  if (usersObject && typeof usersObject === 'object') {
    CACHE = usersObject;
    PRIMED = true;
  }
}

export async function preloadUserMeta(force = false) {
  if (PRIMED && !force) return;
  try {
    const snap = await get(ref(db, 'users'));
    CACHE = snap.exists() ? (snap.val() || {}) : {};
  } catch {
    CACHE = {};
  } finally {
    PRIMED = true;
  }
}

function u(uid) { return CACHE?.[uid] || {}; }
function pickFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  return undefined;
}

// ----- accessors (root-first, awards as fallback only) -----
export function nameFor(uid, localMap = {}) {
  const dn = pickFirst(
    u(uid)?.displayName,         // <-- your structure
    u(uid)?.username,
    u(uid)?.name,
    u(uid)?.awards?.displayName, // legacy fallback (optional)
    localMap?.[uid]
  );
  return dn || `User ${String(uid || '').slice(0, 6)}…`;
}

export function colorFor(uid, defaultColor = '#FFD700') {
  return pickFirst(u(uid)?.usernameColor, u(uid)?.awards?.usernameColor) || defaultColor;
}

export function avatarFor(uid, fallback = 'images/NFL LOGOS/nfl-logo.jpg') {
  return pickFirst(u(uid)?.profilePic, u(uid)?.avatar, u(uid)?.awards?.profilePic) || fallback;
}

export function emailFor(uid, fallback = null) {
  return pickFirst(u(uid)?.email, u(uid)?.awards?.email) || fallback;
}

export function metaFor(uid, localMap = {}) {
  return {
    displayName: nameFor(uid, localMap),
    usernameColor: colorFor(uid),
    profilePic: avatarFor(uid),
    email: emailFor(uid, null),
  };
}

export function clearNameCache() {
  CACHE = {};
  PRIMED = false;
}

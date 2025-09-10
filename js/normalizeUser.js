import { db, ref, get, update, auth } from './firebaseConfig.js';
import { getNameByEmail } from './profiles.js';

export async function normalizeUserDoc(uid){
  const uref = ref(db, `users/${uid}`);
  const snap = await get(uref);
  if (!snap.exists()) return;

  const v = snap.val() || {};
  const patch = {};

  const email = auth.currentUser?.email || v.email || '';
  if (email && v.email !== email) patch.email = email;

  const displayName = email ? getNameByEmail(email) : null;
  if (displayName && !v.displayName) patch.displayName = displayName;

  const s = v.stats ?? {};
  const toNum = (x) => (typeof x === 'number' ? x : Number(x) || 0);
  const fixedStats = {
    totalStaked: toNum(s.totalStaked),
    totalWon:    toNum(s.totalWon),
    weeksWon:    toNum(s.weeksWon),
  };
  if (JSON.stringify(s) !== JSON.stringify(fixedStats)) patch.stats = fixedStats;

  if (v.profileBanner === '') patch.profileBanner = null;

  if (Object.keys(patch).length) {
    await update(uref, patch);
  }
}


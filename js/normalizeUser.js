// js/normalizeUser.js
import { db, ref, get, update } from './firebaseConfig.js';

export async function normalizeUserDoc(uid) {
  const uref = ref(db, `users/${uid}`);
  const snap = await get(uref);
  if (!snap.exists()) return;

  const v = snap.val() || {};
  const patch = {};

  // Fix stats types
  const s = v.stats ?? {};
  const toNum = (x, d = 0) => (typeof x === 'number' ? x : Number(x) || d);
  const fixedStats = {
    totalStaked: toNum(s.totalStaked),
    totalWon:    toNum(s.totalWon),
    weeksWon:    toNum(s.weeksWon),
  };
  if (JSON.stringify(s) !== JSON.stringify(fixedStats)) {
    patch.stats = fixedStats;
  }

  // Normalize empty banner to null (so your code can fall back)
  if (v.profileBanner === '') patch.profileBanner = null;

  if (Object.keys(patch).length) {
    await update(uref, patch);
  }
}
// normalizeUser.js (updated)
import { db, ref, get, update, auth } from './firebaseConfig.js';
import { getUsername, saveDisplayName } from './profiles.js';

export async function normalizeUserDoc(uid) {
  const uref = ref(db, `users/${uid}`);
  const snap = await get(uref);
  if (!snap.exists()) return;

  const v = snap.val() || {};
  const patch = {};

  // Keep the latest email on file (useful for admin, exports, etc.)
  const email = auth.currentUser?.email || v.email || '';
  if (email && v.email !== email) patch.email = email;

  // Resolve a nice display name from users/<uid> (fallbacks handled inside)
  try {
    const resolved = await getUsername(uid);
    if (resolved && v.displayName !== resolved) {
      patch.displayName = resolved;
      // Best-effort persist through the helper as well (non-fatal if it fails)
      await saveDisplayName(uid, resolved).catch(() => {});
    }
  } catch (e) {
    console.warn('normalizeUserDoc: name resolution failed', e);
  }

  // Normalize stats to numbers
  const s = v.stats ?? {};
  const toNum = (x) => (typeof x === 'number' ? x : Number(x) || 0);
  const fixedStats = {
    totalStaked: toNum(s.totalStaked),
    totalWon:    toNum(s.totalWon),
    weeksWon:    toNum(s.weeksWon),
  };
  if (JSON.stringify(s) !== JSON.stringify(fixedStats)) patch.stats = fixedStats;

  // Clean up empty banner string
  if (v.profileBanner === '') patch.profileBanner = null;

  if (Object.keys(patch).length) {
    await update(uref, patch);
  }
}

export default normalizeUserDoc;

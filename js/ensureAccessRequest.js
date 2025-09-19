// ensureAccessRequest.js
import { db, ref, get, update } from './firebaseConfig.js';

/**
 * Ensures the user has a profile stub and an allowlist request.
 * Returns:
 *   { approved: true }  -> user can proceed
 *   { approved: false } -> user is gated (we created/refreshed their request)
 */
export async function ensureAccessAndGate(user) {
  const uid = user?.uid;
  if (!uid) return { approved: false };

  // 1) Seed/patch the user's profile so names aren’t blank anywhere
  try {
    const uref = ref(db, `users/${uid}`);
    const usnap = await get(uref);
    const displayName =
      user.displayName ||
      user.providerData?.[0]?.displayName ||
      user.email ||
      `User ${uid.slice(0, 6)}…`;
    const email = user.email || user.providerData?.[0]?.email || null;

    const patch = {};
    if (!usnap.exists() || !usnap.val()?.displayName) patch.displayName = displayName;
    if (email && (!usnap.exists() || !usnap.val()?.email)) patch.email = email;
    if (Object.keys(patch).length) await update(uref, patch);
  } catch (e) {
    console.warn('ensureAccess: profile seed failed', e);
  }

  // 2) Check approval
  const approvedSnap = await get(ref(db, `allowlist/${uid}/approved`));
  const approved = approvedSnap.exists() && approvedSnap.val() === true;
  if (approved) return { approved: true };

  // 3) Create/refresh the request node so it shows up for you to approve
  try {
    const reqRef = ref(db, `allowlist/${uid}/requested`);
    await update(reqRef, {
      email: user.email || null,
      displayName:
        user.displayName ||
        user.providerData?.[0]?.displayName ||
        '',
      requestedAt: Date.now(),
    });
  } catch (e) {
    console.warn('ensureAccess: request write failed', e);
  }

  return { approved: false };
}

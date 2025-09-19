// js/ensureAccessRequest.js
import { db, ref, get, set } from './firebaseConfig.js';

/**
 * Ensure a user is either approved or has a pending request.
 * Returns { approved: boolean }.
 *
 * Writes:
 *   allowlist/<uid>/requested = { email, displayName, requestedAt }
 * Optionally mirrors to:
 *   accessRequests/<uid> = { email, displayName, requestedAt }
 */
export async function ensureAccessRequest(user, { mirrorToAccessRequests = true } = {}) {
  const uid = user.uid;
  const email = user.email || '';
  const displayName =
    user.displayName ||
    email.split('@')[0] ||
    `User ${uid.slice(0, 6)}…`;

  // Check approval
  const allowRef = ref(db, `allowlist/${uid}`);
  const allowSnap = await get(allowRef);
  const approved =
    allowSnap.exists() && allowSnap.child('approved').val() === true;

  if (approved) return { approved: true };

  // Not approved → (re)post a request so admin can see it
  const now = Date.now();
  await set(ref(db, `allowlist/${uid}/requested`), {
    email,
    displayName,
    requestedAt: now,
  });

  if (mirrorToAccessRequests) {
    await set(ref(db, `accessRequests/${uid}`), {
      email,
      displayName,
      requestedAt: now,
    });
  }

  return { approved: false };
}

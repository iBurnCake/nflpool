import { db, ref, get, set, update } from './firebaseConfig.js';

export default async function ensureAccessRequest(user) {
  const uid = user?.uid;
  if (!uid) return { approved: false, requestCreated: false };

  const provider = user.providerData?.[0]?.providerId || 'google';
  const displayName =
    user.displayName ||
    user.providerData?.[0]?.displayName ||
    user.email ||
    `User ${uid.slice(0, 6)}…`;
  const email = user.email || user.providerData?.[0]?.email || null;
  const now = Date.now();

  try {
    const uref = ref(db, `users/${uid}`);
    const usnap = await get(uref);
    const cur = usnap.exists() ? (usnap.val() || {}) : {};

    const patch = {};
    if (!cur.displayName) patch.displayName = displayName;
    if (email && !cur.email) patch.email = email;

    if (Object.keys(patch).length) {
      await update(uref, patch);
    }
  } catch (e) {
    console.warn('ensureAccessRequest: profile seed/patch failed', e);
  }

  try {
    const approvedSnap = await get(ref(db, `allowlist/${uid}/approved`));
    const approved = approvedSnap.exists() && approvedSnap.val() === true;
    if (approved) return { approved: true, requestCreated: false };
  } catch (e) {
    console.warn('ensureAccessRequest: read approved failed', e);
  }

  let requestCreated = false;

  try {
    const rRef = ref(db, `allowlist/${uid}/requested`);
    const rSnap = await get(rRef);
    if (!rSnap.exists()) {
      await set(rRef, { email, displayName, requestedAt: now });
      requestCreated = true;
    } else {
      await update(rRef, { email, displayName, requestedAt: now });
    }
  } catch (e) {
    console.warn('ensureAccessRequest: write allowlist/requested failed', e);
  }

  try {
    const aRef = ref(db, `accessRequests/${uid}`);
    const aSnap = await get(aRef);
    if (!aSnap.exists()) {
      await set(aRef, {
        uid,
        email,
        displayName,
        provider,
        status: 'pending',
        requestedAt: now,
        lastSeenAt: now,
      });
      requestCreated = true;
    } else {
      await update(aRef, { email, displayName, provider, lastSeenAt: now });
    }
  } catch (e) {
    console.warn('ensureAccessRequest: write accessRequests failed', e);
  }

  return { approved: false, requestCreated };
}

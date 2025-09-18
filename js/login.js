import { auth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, db, ref, get, set } from './firebaseConfig.js';
  
  const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';
  
  const provider  = new GoogleAuthProvider();
  const loginBtn  = document.getElementById('loginBtn');  
  const signupBtn = document.getElementById('signupBtn'); 
  const msgEl     = document.getElementById('authMsg');
  
  function setMsg(t){ if (msgEl) msgEl.textContent = t || ''; }
  
  function rememberIntent(kind){ try { sessionStorage.setItem('loginIntent', kind); } catch {} }
  function readIntent(){ try { return sessionStorage.getItem('loginIntent') || 'login'; } catch { return 'login'; } }
  function clearIntent(){ try { sessionStorage.removeItem('loginIntent'); } catch {} }
  
  async function startSignIn(kind){
    rememberIntent(kind);
    setMsg(kind === 'signup' ? 'Opening Google to request access…' : 'Opening Google to sign you in…');
    try { await signInWithPopup(auth, provider); }
    catch { await signInWithRedirect(auth, provider); }
  }
   
  async function isApproved(uid){
    const s = await get(ref(db, `allowlist/${uid}/approved`));
    return s.exists() && s.val() === true;
  }
  
  async function ensureAccessRequest(user){
    const path = `accessRequests/${user.uid}`;
    const uref = ref(db, path);
    const snap = await get(uref);
    const base = {
      uid: user.uid,
      displayName: user.displayName || user.email || 'New User',
      email: user.email || null
    };
    const payload = {
      ...(snap.exists() ? (snap.val() || {}) : {}),
      ...base,
      status: 'pending',
      updatedAt: Date.now()
    };
    await set(uref, payload);
  }
  
  async function ensureAllowlistRequested(user){
    const aref = ref(db, `allowlist/${user.uid}/requested`);
    await set(aref, {
      email: user.email || null,
      displayName: user.displayName || user.email || 'New User',
      requestedAt: Date.now()
    });
  }
  
  async function ensureAdminAllowlist(user){
    if (user.uid !== ADMIN_UID) return;
    const ok = await isApproved(user.uid);
    if (!ok) {
      await set(ref(db, `allowlist/${user.uid}`), {
        approved: true,
        approvedAt: Date.now(),
        approvedBy: ADMIN_UID
      });
    }
  }
  
  async function hasLegacyUserDoc(uid){
    const s = await get(ref(db, `users/${uid}`));
    return s.exists();
  }
    
  async function routeAfterSignIn(user, intent){
    if (user.uid === ADMIN_UID) {
      await ensureAdminAllowlist(user);
      location.href = 'index.html';
      return;
    }
  
    if (await isApproved(user.uid)) {
      location.href = 'index.html';
      return;
    }
  
    const legacy = await hasLegacyUserDoc(user.uid);
  
    if (intent === 'signup' || legacy) {
      await ensureAccessRequest(user);
      await ensureAllowlistRequested(user);
  
      try {
        sessionStorage.setItem(
          'gate_message',
          legacy
            ? 'We recognize your account. An admin is finalizing your access now.'
            : 'Access request received. An admin will approve you soon.'
        );
      } catch {}
  
      location.href = 'waiting.html';
      return;
    }
  
    try { sessionStorage.setItem('gate_message', 'Your account isn’t approved yet. We’ll notify you once it is.'); } catch {}
    location.href = 'waiting.html';
  }
  
  loginBtn?.addEventListener('click',  () => startSignIn('login'));
  signupBtn?.addEventListener('click', () => startSignIn('signup'));
  
  getRedirectResult(auth).catch(() => {});
  
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    const intent = readIntent();
    try {
      await routeAfterSignIn(user, intent);
    } finally {
      clearIntent();
    }
  });

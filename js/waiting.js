import { auth, onAuthStateChanged, db, ref, onValue, get } from './firebaseConfig.js';
  
  const statusEl = document.getElementById('statusText');   
  const msgEl    = document.getElementById('waitingMsg');   
  const refresh  = document.getElementById('refreshBtn');   
  const logout   = document.getElementById('logoutBtn');   
  
  function setStatus(t){ if (statusEl) statusEl.textContent = t; }
  function setMsg(t){ if (msgEl) msgEl.textContent = t; }
  function goHome(){ location.href = 'index.html'; }
  function goLogin(){ location.href = 'login.html'; }
  
  async function checkOnceAndMaybeEnter(uid){
    const s = await get(ref(db, `allowlist/${uid}/approved`));
    const ok = s.exists() && s.val() === true;
    if (ok) {
      setStatus('approved');
      setMsg('Approved! Redirecting…');
      setTimeout(goHome, 700);
    } else {
      setStatus('pending');
    }
  }
  
  onAuthStateChanged(auth, async (user) => {
    if (!user) { goLogin(); return; }
  
    try {
      const m = sessionStorage.getItem('gate_message');
      if (m) setMsg(m);
    } catch {}
  
    await checkOnceAndMaybeEnter(user.uid);
  
    const approvedRef = ref(db, `allowlist/${user.uid}/approved`);
    onValue(approvedRef, (snap) => {
      const ok = snap.exists() && snap.val() === true;
      if (ok) {
        setStatus('approved');
        setMsg('Approved! Redirecting…');
        setTimeout(goHome, 700);
      } else {
        setStatus('pending');
      }
    });
  
    refresh?.addEventListener('click', () => checkOnceAndMaybeEnter(user.uid));
    logout?.addEventListener('click', async () => {
      try { await auth.signOut(); } finally { goLogin(); }
    });
  });

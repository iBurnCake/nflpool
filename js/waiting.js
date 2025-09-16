import {
    auth,
    onAuthStateChanged,
    db,
    ref,
    onValue,
    get
  } from './firebaseConfig.js';
  
  const statusEl = document.getElementById('statusText');   // e.g., <span id="statusText">
  const msgEl    = document.getElementById('waitingMsg');   // optional: <div id="waitingMsg">
  const refresh  = document.getElementById('refreshBtn');   // "Refresh Status" button
  const logout   = document.getElementById('logoutBtn');    // "Log out" button
  
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
  
    // Show any message passed from login page
    try {
      const m = sessionStorage.getItem('gate_message');
      if (m) setMsg(m);
    } catch {}
  
    // 1) Instant check (handles the case where approval already happened)
    await checkOnceAndMaybeEnter(user.uid);
  
    // 2) Live listener: auto-redirect the moment admin approves
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
  
    // Buttons
    refresh?.addEventListener('click', () => checkOnceAndMaybeEnter(user.uid));
    logout?.addEventListener('click', async () => {
      try { await auth.signOut(); } finally { goLogin(); }
    });
  });
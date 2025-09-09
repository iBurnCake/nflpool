// js/adminGate.js
import { auth, onAuthStateChanged } from './firebaseConfig.js';

// Your admin UID
const ADMIN_UID = 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2';

onAuthStateChanged(auth, (user) => {
  const card = document.getElementById('adminCard');
  if (!card) return;
  card.style.display = (user && user.uid === ADMIN_UID) ? '' : 'none';
});

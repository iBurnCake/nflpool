import { db, ref, get, onValue, off } from './firebaseConfig.js';

const POOL_DOLLARS_PER_MEMBER = 5;
const MEMBERS_PATH = 'subscriberPools/week1/members';

let _membersRef = null;
let _membersCb  = null;

function formatUSD(n) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch { return `$${Math.round(n)}`; }
}

export function attachPoolMembersListener() {
  if (_membersRef && _membersCb) {
    try { off(_membersRef, 'value', _membersCb); } catch {}
  }
  _membersRef = ref(db, MEMBERS_PATH);
  _membersCb  = (snap) => {
    const obj = snap.exists() ? (snap.val() || {}) : {};
    const count = Object.values(obj).filter(Boolean).length;
    const total = count * POOL_DOLLARS_PER_MEMBER;
    const el = document.getElementById('poolTotalAmount');
    if (el) el.textContent = formatUSD(total);
  };
  onValue(_membersRef, _membersCb);
}

export function detachPoolMembersListener() {
  if (_membersRef && _membersCb) {
    try { off(_membersRef, 'value', _membersCb); } catch {}
  }
  _membersRef = null;
  _membersCb  = null;
}

export async function updatePoolTotalCardOnce() {
  const el = document.getElementById('poolTotalAmount');
  if (!el) return;
  try {
    const snap = await get(ref(db, MEMBERS_PATH));
    const obj = snap.exists() ? (snap.val() || {}) : {};
    const count = Object.values(obj).filter(Boolean).length;
    el.textContent = formatUSD(count * POOL_DOLLARS_PER_MEMBER);
  } catch {
    el.textContent = '$0';
  }
}

import { db, ref, get, onValue, off } from './firebaseConfig.js';

const ENTRY_FEE = 5;

let weekRef, membersRef, weekCb, membersCb;

function formatUSD(n) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(Number(n) || 0);
  } catch {
    return `$${Math.round(Number(n) || 0)}`;
  }
}

function ensureBadge() {
  const card = document.querySelector('#moneyPoolCard, .money-pool-card, a[href*="moneyPool"]');
  const hero = card?.querySelector('.card-hero') || card;
  if (!hero) return null;

  let badge = document.getElementById('mpPotBadge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'mpPotBadge';
    badge.className = 'mp-badge';
    badge.textContent = 'Pot: $0';
    if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
    hero.appendChild(badge);
  }
  return badge;
}

function updateBadge(count) {
  const badge = ensureBadge();
  if (!badge) return;
  const total = (count || 0) * ENTRY_FEE;
  badge.textContent = `Pot: ${formatUSD(total)}`;
  badge.setAttribute('aria-label', `${count} entrants`);
}

function watchMembers(weekKey) {
  if (membersRef && membersCb) try { off(membersRef, 'value', membersCb); } catch {}
  membersRef = ref(db, `subscriberPools/${weekKey}/members`);
  membersCb = (snap) => {
    const obj = snap.exists() ? (snap.val() || {}) : {};
    const count = Object.values(obj).filter(Boolean).length;
    updateBadge(count);
  };
  onValue(membersRef, membersCb);
}

export function initMoneyPoolPotBadge() {
  ensureBadge();

  if (weekRef && weekCb) try { off(weekRef, 'value', weekCb); } catch {}
  weekRef = ref(db, 'settings/currentWeek');
  weekCb = (snap) => {
    const wk = snap.exists() ? snap.val() : 'week1';
    watchMembers(wk);
  };
  onValue(weekRef, weekCb);

  get(weekRef).then(s => watchMembers(s.exists() ? s.val() : 'week1'));
}

export function destroyMoneyPoolPotBadge() {
  if (membersRef && membersCb) try { off(membersRef, 'value', membersCb); } catch {}
  if (weekRef && weekCb) try { off(weekRef, 'value', weekCb); } catch {}
  membersRef = membersCb = weekRef = weekCb = null;
}

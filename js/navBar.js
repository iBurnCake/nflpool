// js/navBar.js
import { auth } from './firebaseConfig.js';

export function renderNavBar({ hostId, current } = {}) {
  const host = document.getElementById(hostId);
  if (!host) return;

  const items = [
    { id: 'moneyPool',  label: 'Money Pool',       href: 'moneyPool.html' },
    { id: 'pastWeeks',  label: 'Past Weeks',       href: 'pastWeeks.html' },
    { id: 'housePicks', label: 'View House Picks', href: 'housePicks.html' },
  ].filter(i => i.id !== current); // hide the current page

  host.innerHTML = `
    <div class="settings-container" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center;">
      ${items.map(i => `<button class="nav-btn" data-href="${i.href}">${i.label}</button>`).join('')}
      <span style="flex:1 1 auto"></span>
      <button id="logoutButton" class="nav-btn">Logout</button>
    </div>
  `;

  host.querySelectorAll('.nav-btn[data-href]').forEach(btn => {
    btn.addEventListener('click', () => window.location.href = btn.dataset.href);
  });

  const logout = host.querySelector('#logoutButton');
  if (logout) {
    logout.addEventListener('click', () => {
      auth.signOut().then(() => (window.location.href = 'index.html'));
    });
  }
}

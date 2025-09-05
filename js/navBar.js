// /js/navBar.js
// Renders the top action bar. Auto-detects current page and
// replaces that page's button with "Back to Home".
export function renderNavBar({ hostId = 'globalNavBar' } = {}) {
  const host = document.getElementById(hostId);
  if (!host) return;

  const page = detectPage(); // 'index' | 'housePicks' | 'moneyPool' | 'pastWeeks' | 'other'

  const btn = (text, href, cls) =>
    `<a class="btn ${cls}" href="${href}">${text}</a>`;

  const buttons = [];

  if (page === 'index') {
    // Home page uses the full bar (as you already have)
    buttons.push(`<button id="resetButton" class="btn btn-red" type="button">Reset Picks</button>`);
    buttons.push(`<button id="submitButton" class="btn btn-green" type="button">Submit Picks</button>`);
    buttons.push(btn('View House Picks', 'housePicks.html', 'btn-blue'));
    buttons.push(btn('Money Pool', 'moneyPool.html', 'btn-teal'));
    buttons.push(btn('Past Weeks', 'pastWeeks.html', 'btn-purple'));
    buttons.push(`<button id="logoutButton" class="btn btn-orange" type="button">Logout</button>`);
  } else {
    // Secondary pages: show the other destinations + Back to Home + Logout
    if (page !== 'housePicks') buttons.push(btn('View House Picks', 'housePicks.html', 'btn-blue'));
    if (page !== 'moneyPool')  buttons.push(btn('Money Pool', 'moneyPool.html', 'btn-teal'));
    if (page !== 'pastWeeks')  buttons.push(btn('Past Weeks', 'pastWeeks.html', 'btn-purple'));

    buttons.push(btn('Back to Home', 'index.html', 'btn-green'));
    buttons.push(`<button id="logoutButton" class="btn btn-orange" type="button">Logout</button>`);
  }

  host.innerHTML = `<div class="action-bar">${buttons.join('')}</div>`;
}

function detectPage() {
  const p = location.pathname.toLowerCase();
  if (p.endsWith('/') || p.endsWith('/index.html')) return 'index';
  if (p.includes('housepicks')) return 'housePicks';
  if (p.includes('moneypool'))  return 'moneyPool';
  if (p.includes('pastweeks'))  return 'pastWeeks';
  return 'other';
}

export default renderNavBar;

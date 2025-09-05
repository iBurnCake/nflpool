export function renderNavBar({ hostId = 'globalNavBar', variant = 'secondary' } = {}) {
  const host = document.getElementById(hostId);
  if (!host) return;

  const includeHomeButtons = (variant === 'home');

  const html = `
    <div class="settings-container">
      ${includeHomeButtons ? `
        <button id="resetButton">Reset Picks</button>
        <button id="submitButton">Submit Picks</button>
      ` : ``}
      <button id="viewHousePicksButton" onclick="window.location.href='housePicks.html'">View House Picks</button>
      <button id="moneyPoolBtn" onclick="window.location.href='moneyPool.html'">Money Pool</button>
      <button id="pastWeeksButton" onclick="window.location.href='pastWeeks.html'">Past Weeks</button>
      <button id="logoutButton">Logout</button>
    </div>
  `;

  host.innerHTML = html;
}

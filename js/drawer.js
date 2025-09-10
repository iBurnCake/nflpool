export function mountDrawer() {
    if (document.getElementById('drawer-root')) return;
  
    const root = document.createElement('div');
    root.id = 'drawer-root';
    root.innerHTML = `
      <button class="drawer-toggle" aria-label="Open menu" type="button">
        <span></span><span></span><span></span>
      </button>
  
      <div class="drawer">
        <div class="drawer-header">
          <div>Menu</div>
          <button class="drawer-close" type="button" aria-label="Close menu">✕</button>
        </div>
        <nav class="drawer-links" id="drawerLinks"></nav>
      </div>
  
      <div class="drawer-backdrop" aria-hidden="true"></div>
    `;
    document.body.appendChild(root);

    const path = location.pathname.toLowerCase();
    const is = (key) =>
      key === 'index'     ? (path.endsWith('/') || path.endsWith('/index.html')) :
      key === 'house'     ? path.includes('housepicks') :
      key === 'pool'      ? path.includes('moneypool')  :
      key === 'weeks'     ? path.includes('pastweeks')  : false;
  
    const links = [
      !is('house') && `<a class="drawer-link" href="housePicks.html">View House Picks</a>`,
      !is('pool')  && `<a class="drawer-link" href="moneyPool.html">Money Pool</a>`,
      !is('weeks') && `<a class="drawer-link" href="pastWeeks.html">Past Weeks</a>`,
      !is('index') && `<a class="drawer-link" href="index.html">Back to Home</a>`,
      `<button class="drawer-link danger" id="drawerLogout" type="button">Logout</button>`
    ].filter(Boolean).join('');
  
    document.getElementById('drawerLinks').innerHTML = links;
  
    const open  = () => root.classList.add('open');
    const close = () => root.classList.remove('open');
  
    root.querySelector('.drawer-toggle').addEventListener('click', open);
    root.querySelector('.drawer-close').addEventListener('click', close);
    root.querySelector('.drawer-backdrop').addEventListener('click', close);
  
    document.getElementById('drawerLogout')?.addEventListener('click', () => {
      document.getElementById('logoutButton')?.click();
    });

  }

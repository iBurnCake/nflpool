let overlay = null;
let msgEl = null;
let autoHideTimer = null;

function ensureOverlay() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'appLoader';
  overlay.className = 'app-loader';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9998;
    display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,.6); opacity:0.1; pointer-events:none;
    transition:opacity .2s ease;
  `;
  overlay.innerHTML = `
    <div class="loader-box" role="status" aria-live="polite" aria-busy="true"
         style="display:flex;flex-direction:column;align-items:center;gap:12px;
                padding:16px 20px;border:1px solid #333;border-radius:12px;
                background:#141414;box-shadow:0 6px 24px rgba(0,0,0,.5);">
      <div class="spinner" style="width:42px;height:42px;border:3px solid #333;border-top-color:#FFD700;border-radius:50%;animation:alspin 1s linear infinite;"></div>
      <div class="loader-text" id="appLoaderMsg" style="color:#fff;opacity:.9;font-weight:600;">Loading…</div>
    </div>
    <style>@keyframes alspin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(overlay);
  msgEl = overlay.querySelector('#appLoaderMsg');
}

export function showLoader(message = 'Loading…') {
  ensureOverlay();
  if (msgEl) msgEl.textContent = message;
  overlay.style.pointerEvents = 'auto';
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  clearTimeout(autoHideTimer);
  autoHideTimer = setTimeout(() => hideLoader(), 15000);
}

export function setLoaderMessage(message) {
  if (!overlay) return;
  if (msgEl) msgEl.textContent = message;
}

export function hideLoader() {
  clearTimeout(autoHideTimer);
  if (!overlay) return;
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    msgEl = null;
  }, 250);
}

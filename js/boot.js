// No-flash boot helpers
let _cleared = false;

export function clearBootLoader() {
  if (_cleared) return;
  _cleared = true;
  // remove boot classes (whichever was used)
  document.documentElement.classList.remove('app-boot', 'boot-preload');
  // remove the boot overlay if present
  const el = document.getElementById('appBootLoader');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

export function setBootMessage(msg) {
  const el = document.getElementById('appBootMsg');
  if (el) el.textContent = String(msg || 'Loading…');
}

let _cleared = false;

export function clearBootLoader() {
  if (_cleared) return;
  _cleared = true;
  document.documentElement.classList.remove('app-boot', 'boot-preload');
  const el = document.getElementById('appBootLoader');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

export function setBootMessage(msg) {
  const el = document.getElementById('appBootMsg');
  if (el) el.textContent = String(msg || 'Loading…');
}

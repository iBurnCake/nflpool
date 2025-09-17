// boot.js
let _cleared = false;
let _timer = null;
let _shownAt = Date.now();

/**
 * Optionally set/override the boot message.
 */
export function setBootMessage(msg) {
  const el = document.getElementById('appBootMsg');
  if (el) el.textContent = String(msg || 'Loading…');
}

/**
 * Mark the time when the boot overlay became visible.
 * Call this early if you render the overlay later than page start.
 */
export function markBootVisible() {
  _shownAt = Date.now();
}

/**
 * Clear the boot overlay after a minimum visible time, with fade-out.
 * Usage: clearBootLoader({ min: 900, fade: 200 })
 * Defaults: min=800ms, fade=200ms
 */
export function clearBootLoader(opts = {}) {
  if (_cleared || _timer) return;

  const { min = 800, fade = 200 } = opts;
  const elapsed = Date.now() - _shownAt;
  const wait = Math.max(0, min - elapsed);

  _timer = setTimeout(() => {
    const root = document.documentElement;
    const el = document.getElementById('appBootLoader');

    const finish = () => {
      root.classList.remove('app-boot', 'boot-preload');
      if (el) el.remove();
      _cleared = true;
    };

    if (el) {
      try {
        el.style.transition = `opacity ${fade}ms ease`;
        el.style.opacity = '0';
        setTimeout(finish, fade);
      } catch {
        finish();
      }
    } else {
      finish();
    }
  }, wait);
}

import { IS_LOCKED } from './settings.js';

let _savePill, _saveStateTimer;
let _toast, _toastTimer;

export function applyLockUI() {
  const table = document.getElementById('gamesTable');
  const pickButtons = table ? table.querySelectorAll('button[id^="home-"], button[id^="away-"]') : [];
  const pickSelects = table ? table.querySelectorAll('select[id^="confidence"]') : [];
  const submitBtn = document.getElementById('submitButton');
  const resetBtn  = document.getElementById('resetButton');

  [...pickButtons, ...pickSelects].forEach(el => { if (el) el.disabled = IS_LOCKED; });
  if (submitBtn) submitBtn.disabled = IS_LOCKED;
  if (resetBtn)  resetBtn.disabled  = IS_LOCKED;

  if (table) table.classList.toggle('locked', IS_LOCKED);

  const id = 'lockedBanner';
  const existing = document.getElementById(id);
  if (IS_LOCKED && !existing) {
    const banner = document.createElement('div');
    banner.id = id;
    banner.textContent = 'Picks are locked for this week.';
    banner.style.cssText =
      'margin:10px 0;padding:10px 14px;border:2px solid #FFD700;color:#FFD700;background:#222;border-radius:10px;text-align:center;font-weight:700;';
    const container = document.getElementById('userHomeSection') || document.body;
    container.insertBefore(banner, container.firstChild);
  } else if (!IS_LOCKED && existing) {
    existing.remove();
  }
}

function ensureSavePill() {
  if (_savePill) return _savePill;
  _savePill = document.createElement('div');
  _savePill.className = 'save-status-pill';
  _savePill.setAttribute('aria-live', 'polite');
  _savePill.textContent = 'Saved';
  document.body.appendChild(_savePill);
  return _savePill;
}

export function setSaveStatus(state) {
  const pill = ensureSavePill();
  clearTimeout(_saveStateTimer);

  if (state === 'saving') {
    pill.textContent = 'Saving…';
    pill.classList.remove('error');
    pill.classList.add('show');
  } else if (state === 'saved') {
    pill.textContent = 'Saved ✓';
    pill.classList.remove('error');
    pill.classList.add('show');
    _saveStateTimer = setTimeout(() => pill.classList.remove('show'), 1200);
  } else if (state === 'error') {
    pill.textContent = 'Save failed';
    pill.classList.add('error', 'show');
    _saveStateTimer = setTimeout(() => pill.classList.remove('show'), 2000);
  }
}

export function showToast(message, { error = false } = {}) {
  if (!_toast) {
    _toast = document.createElement('div');
    _toast.className = 'toast';
    _toast.setAttribute('role', 'status');
    _toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(_toast);
  }
  clearTimeout(_toastTimer);
  _toast.textContent = message;
  _toast.classList.toggle('error', !!error);
  _toast.classList.add('show');
  _toastTimer = setTimeout(() => _toast.classList.remove('show'), 1600);
}

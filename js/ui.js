import { IS_LOCKED } from './settings.js';

let _savePill, _saveStateTimer;
let _toast, _toastTimer;

export function applyLockUI() {
  const table = document.getElementById('gamesTable');
  const submitBtn = document.getElementById('submitButton');
  const resetBtn  = document.getElementById('resetButton');

  const pickButtons = table ? table.querySelectorAll('button[id^="home-"], button[id^="away-"]') : [];
  const pickSelects = table ? table.querySelectorAll('select[id^="confidence"]') : [];
  [...pickButtons, ...pickSelects].forEach(el => { if (el) el.disabled = IS_LOCKED; });
  if (submitBtn) submitBtn.disabled = IS_LOCKED;
  if (resetBtn)  resetBtn.disabled  = IS_LOCKED;

  if (table) {
    table.classList.toggle('locked', IS_LOCKED);

    const thead = table.querySelector('thead');
    if (thead) {
      let noticeRow = thead.querySelector('#lockNoticeRow');

      if (IS_LOCKED) {
        if (!noticeRow) {
          noticeRow = document.createElement('tr');
          noticeRow.id = 'lockNoticeRow';

          const headerRow = thead.querySelector('tr');
          const colSpan = headerRow ? headerRow.children.length : 3;

          const th = document.createElement('th');
          th.colSpan = colSpan;
          th.className = 'lock-notice';
          th.textContent = 'Picks are locked for this week.';
          noticeRow.appendChild(th);

          thead.insertBefore(noticeRow, thead.firstChild);
        }
      } else if (noticeRow) {
        noticeRow.remove();
      }
    }
  }

  const oldBanner = document.getElementById('lockedBanner');
  if (oldBanner) oldBanner.remove();
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

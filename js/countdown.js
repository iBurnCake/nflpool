import { auth, onAuthStateChanged, db, ref, get } from './firebaseConfig.js';

const WIDGET_ID = 'lock-countdown-widget';

function pad2(n) { return n.toString().padStart(2, '0'); }
function formatDiff(ms) {
  if (ms <= 0) return 'Locked';
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (d > 0 ? `${d}d ` : '') + `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function ensureWidget() {
  let el = document.getElementById(WIDGET_ID);
  if (el) return el;

  el = document.createElement('div');
  el.id = WIDGET_ID;
  el.innerHTML = `
    <div class="cd-box">
      <div class="cd-label" id="cd-label">Picks lock in</div>
      <div class="cd-time" id="cd-time">--:--:--</div>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

async function loadCountdownSettings() {
  try {
    const snap = await get(ref(db, 'settings/countdown'));
    if (!snap.exists()) return null;
    const v = snap.val() || {};
    let targetMs = null;
    if (v.targetISO) {
      const t = Date.parse(v.targetISO);
      if (!Number.isNaN(t)) targetMs = t;
    }
    if (!targetMs && v.target != null) {
      const n = Number(v.target);
      if (Number.isFinite(n)) targetMs = n;
    }
    return {
      enabled: v.enabled === true || v.enabled === 'true',
      label: typeof v.label === 'string' ? v.label : 'Picks lock in',
      targetMs,
    };
  } catch (e) {
    return null;
  }
}

function startTicker(targetMs, label) {
  const labelEl = document.getElementById('cd-label');
  const timeEl  = document.getElementById('cd-time');
  if (labelEl) labelEl.textContent = label || 'Picks lock in';

  const update = () => {
    const diff = targetMs - Date.now();
    const text = formatDiff(diff);
    if (timeEl) timeEl.textContent = text;
  };

  update();
  const id = setInterval(() => {
    update();
    if (targetMs - Date.now() <= 0) clearInterval(id);
  }, 1000);
}

async function boot() {
  const cfg = await loadCountdownSettings();
  if (!cfg || !cfg.enabled || !cfg.targetMs) return;

  ensureWidget();
  startTicker(cfg.targetMs, cfg.label);
}

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, (user) => {
    if (user) boot();
  });
});

import { db, ref, get } from './firebaseConfig.js';

export let CURRENT_WEEK = 'week1';
export let CURRENT_WEEK_LABEL = '';
export let IS_LOCKED = false;

export async function refreshCurrentWeek() {
  try {
    const wkSnap = await get(ref(db, 'settings/currentWeek'));
    if (wkSnap.exists()) CURRENT_WEEK = wkSnap.val();

    const labelSnap = await get(ref(db, 'settings/currentWeekLabel'));
    if (labelSnap.exists()) CURRENT_WEEK_LABEL = labelSnap.val();

    const lockSnap = await get(ref(db, 'settings/lockAllPicks'));
    if (lockSnap.exists()) {
      const v = lockSnap.val();
      IS_LOCKED = (v === true || v === 'true' || v === 1 || v === '1');
    } else {
      IS_LOCKED = false;
    }
  } catch (e) {
    console.warn('[settings] Unable to read settings, using fallback:', e);
  }
  console.log(`[settings] week=${CURRENT_WEEK} (${CURRENT_WEEK_LABEL || 'no label'}), locked=${IS_LOCKED}`);
}

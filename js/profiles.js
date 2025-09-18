import { db, ref, get, set, update } from './firebaseConfig.js';
import { preloadUserMeta, nameFor } from './names.js';

export async function getUsername(uid) {
  await preloadUserMeta();
  const name = nameFor(uid);
  if (name) return name;

  const snap = await get(ref(db, `users/${uid}`));
  if (!snap.exists()) return `${String(uid).slice(0, 6)}…`;
  const u = snap.val() || {};
  return String(u.displayName || u.name || u.username || `${String(uid).slice(0, 6)}…`);
}

export function saveDisplayName(uid, displayName) {
  return update(ref(db, `users/${uid}`), {
    displayName: String(displayName || '').trim(),
  });
}

export function saveProfilePic(uid, picUrl) {
  return update(ref(db, `users/${uid}`), { profilePic: picUrl });
}

export async function loadProfilePic(uid) {
  const snap = await get(ref(db, `users/${uid}/profilePic`));
  if (!snap.exists()) return;

  const picUrl = snap.val();

  const preview = document.getElementById('profilePicPreview');
  if (preview) preview.src = picUrl;

  document.querySelectorAll('.profile-pic-option img').forEach((img) => {
    const same = img.src.includes((picUrl || '').split('/').pop());
    img.parentElement?.classList.toggle('selected', same);
  });
}

export function loadUsernameColor(uid, defaultColor = '#FFD700') {
  const colorRef = ref(db, `users/${uid}/usernameColor`);
  const usernameDisplay = document.getElementById('usernameDisplay');
  const colorPicker = document.getElementById('usernameColorPicker');
  const saveButton = document.getElementById('saveColorButton');

  const applyColorToUI = (hex) => {
    if (usernameDisplay) usernameDisplay.style.color = hex;
    if (colorPicker) colorPicker.value = hex;
  };

  get(colorRef)
    .then((snapshot) => {
      const savedHex = snapshot.exists() ? String(snapshot.val()) : defaultColor;
      applyColorToUI(savedHex);
    })
    .catch((e) => {
      console.error('Error loading username color:', e);
      applyColorToUI(defaultColor);
    });

  if (saveButton && colorPicker) {
    saveButton.onclick = () => {
      const selectedColor = colorPicker.value || defaultColor;
      set(colorRef, selectedColor)
        .then(() => {
          applyColorToUI(selectedColor);
          alert('Username color saved successfully!');
        })
        .catch((e) => {
          console.error('Error saving username color:', e);
          alert('Failed to save username color. Please try again.');
        });
    };
  }
}

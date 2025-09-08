// profiles.js
import { db, ref, get, set, update } from './firebaseConfig.js';

const emailToNameMap = {
  "devonstankis3@gmail.com": "De Von",
  "kyrakafel@gmail.com": "Kyra Kafel",
  "tom.kant21@gmail.com": "Tommy Kant",
  "vickiocf@gmail.com": "Aunt Vicki",
  "erossini02@gmail.com": "Emily Rossini",
  "tony.romano222@gmail.com": "Tony Romano",
  "thomasromano19707@gmail.com": "Thomas Romano",
  "ckeegan437@gmail.com": "Charles Keegan",
  "rainhail85@gmail.com": "Ryan Sanders",
  "peachetube@gmail.com": "William Mathis",
  "angelakant007@gmail.com": "Angela Kant",
  "luke.romano2004@gmail.com": "Luke Romano",
  "Nkier27@gmail.com": "Nick Kier",
  "connor.j.moore0509@gmail.com": "Connor Moore",
  "fischy1826@gmail.com": "Mel",
  "bray.trunnell@gmail.com": "Brayden Trunnell",
};

export function getNameByEmail(email) {
  return emailToNameMap[email] || email;
}

export function saveProfilePic(userId, picUrl) {
  const userRef = ref(db, 'users/' + userId);
  return update(userRef, { profilePic: picUrl });
}

export function loadProfilePic(userId) {
  const userRef = ref(db, 'users/' + userId + '/profilePic');
  return get(userRef).then((snap) => {
    if (!snap.exists()) return;
    const picUrl = snap.val();

    const preview = document.getElementById('profilePicPreview');
    if (preview) preview.src = picUrl;

    document.querySelectorAll('.profile-pic-option img').forEach((img) => {
      const same = img.src.includes((picUrl || '').split('/').pop());
      if (img.parentElement) {
        img.parentElement.classList.toggle('selected', same);
      }
    });
  });
}

/**
 * Loads the user's saved username color and:
 * - Applies it to #usernameDisplay
 * - Sets it as the value of #usernameColorPicker (so the swatch shows the saved color)
 * - Saves updates when #saveColorButton is clicked
 */
export function loadUsernameColor(userId, defaultColor = '#FFD700') {
  const colorRef = ref(db, `users/${userId}/usernameColor`);
  const usernameDisplay = document.getElementById('usernameDisplay');
  const colorPicker = document.getElementById('usernameColorPicker');
  const saveButton = document.getElementById('saveColorButton');

  const applyColorToUI = (hex) => {
    if (usernameDisplay) usernameDisplay.style.color = hex;
    if (colorPicker) colorPicker.value = hex; // keep the swatch in sync
  };

  // Load saved color and reflect it in UI (fallback to gold if none)
  get(colorRef)
    .then((snapshot) => {
      const savedHex = snapshot.exists() ? String(snapshot.val()) : defaultColor;
      applyColorToUI(savedHex);
    })
    .catch((e) => {
      console.error('Error loading username color:', e);
      applyColorToUI(defaultColor);
    });

  // Save on click
  if (saveButton && colorPicker) {
    saveButton.onclick = () => {
      const selectedColor = colorPicker.value || defaultColor; // "#rrggbb"
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

import { db, ref, get, set, update } from './firebaseConfig.js';

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

export function loadUsernameColor(userId, defaultColor = '#FFD700') {
  const colorRef = ref(db, `users/${userId}/usernameColor`);
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

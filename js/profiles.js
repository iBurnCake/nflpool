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
  return get(userRef)
    .then((snap) => {
      if (!snap.exists()) return;
      const picUrl = snap.val();
      const preview = document.getElementById('profilePicPreview');
      if (preview) preview.src = picUrl;

      document.querySelectorAll('.profile-pic-option img').forEach((img) => {
        const same = img.src.includes((picUrl || '').split('/').pop());
        img.parentElement.classList.toggle('selected', same);
      });
    });
}

export function loadUsernameColor(userId) {
  const colorRef = ref(db, `users/${userId}/usernameColor`);
  const usernameDisplay = document.getElementById('usernameDisplay');

  get(colorRef).then((snapshot) => {
    if (snapshot.exists() && usernameDisplay) {
      usernameDisplay.style.color = snapshot.val();
    }
  });

  const saveButton = document.getElementById('saveColorButton');
  const colorPicker = document.getElementById('usernameColorPicker');

  if (saveButton && colorPicker) {
    saveButton.onclick = () => {
      const selectedColor = colorPicker.value;
      set(colorRef, selectedColor)
        .then(() => {
          if (usernameDisplay) usernameDisplay.style.color = selectedColor;
          alert('Username color saved successfully!');
        })
        .catch(() => alert('Failed to save username color. Please try again.'));
    };
  }
}

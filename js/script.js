import {auth, db, signInWithPopup, GoogleAuthProvider, ref, set, get, child, update, onAuthStateChanged} from './firebaseConfig.js';

let CURRENT_WEEK = 'week1';
let CURRENT_WEEK_LABEL = '';
let IS_LOCKED = false;

function applyLockUI() {
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
    banner.style.cssText = 'margin:10px 0;padding:10px 14px;border:2px solid #FFD700;color:#FFD700;background:#222;border-radius:10px;text-align:center;font-weight:700;';
    const container = document.getElementById('userHomeSection') || document.body;
    container.insertBefore(banner, container.firstChild);
  } else if (!IS_LOCKED && existing) {
    existing.remove();
  }
}

/* ---- Save status + toast helpers ---- */
let _savePill;
function ensureSavePill() {
  if (_savePill) return _savePill;
  _savePill = document.createElement('div');
  _savePill.className = 'save-status-pill';
  _savePill.setAttribute('aria-live', 'polite');
  _savePill.textContent = 'Saved';
  document.body.appendChild(_savePill);
  return _savePill;
}

let _saveStateTimer;
function setSaveStatus(state) {
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

let _toast, _toastTimer;
function showToast(message, { error = false } = {}) {
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

async function refreshCurrentWeek() {
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

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await refreshCurrentWeek();

      console.log('User logged in:', user.email);
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('userHomeSection').style.display = 'block';

      const displayName = getNameByEmail(user.email);
      document.getElementById('usernameDisplay').textContent = displayName;

      loadUsernameColor(user.uid);
      loadProfilePic(user.uid);

      displayGames();
      await loadUserPicks(user.uid);
      applyLockUI();
    } else {
      console.log('No user logged in');
      const loginSection = document.getElementById('loginSection');
      loginSection.style.display = 'flex';
      document.getElementById('userHomeSection').style.display = 'none';
    }
  });

  document.getElementById('googleLoginButton')?.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log('Google login successful:', result.user.email);
        handleSuccessfulLogin(result.user);
      })
      .catch((error) => {
        console.error('Google login error:', error);
        alert('Google login failed. Please try again.');
      });
  });

  document.getElementById('logoutButton')?.addEventListener('click', () => {
    auth
      .signOut()
      .then(() => {
        const loginSection = document.getElementById('loginSection');
        loginSection.style.display = 'flex';
        document.getElementById('userHomeSection').style.display = 'none';
        alert('You have been logged out.');
      })
      .catch((error) => {
        console.error('Logout error:', error.message);
        alert('Error logging out. Please try again.');
      });
  });

  document.getElementById('resetButton')?.addEventListener('click', resetPicks);
  document.getElementById('submitButton')?.addEventListener('click', submitPicks);
  document.getElementById('pastWeeksButton')?.addEventListener('click', () => {
    window.location.href = 'pastWeeks.html';
  });
});

async function handleSuccessfulLogin(user) {
  await refreshCurrentWeek();
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('userHomeSection').style.display = 'block';

  const displayName = getNameByEmail(user.email);
  document.getElementById('usernameDisplay').textContent = displayName;

  loadUsernameColor(user.uid);
  loadProfilePic(user.uid);
  displayGames();
  await loadUserPicks(user.uid);
  applyLockUI();
}

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
  "williammathis2004@gmail.com": "William Mathis",
  "angelakant007@gmail.com": "Angela Kant",
  "luke.romano2004@gmail.com": "Luke Romano",
  "Nkier27@gmail.com": "Nick Kier",
  "connor.j.moore0509@gmail.com": "Connor Moore",
};
function getNameByEmail(email) { return emailToNameMap[email] || email; }

function saveProfilePic(userId, picUrl) {
  const userRef = ref(db, 'users/' + userId);
  update(userRef, { profilePic: picUrl })
    .then(() => console.log('Profile picture saved:', picUrl))
    .catch((error) => console.error('Error saving profile picture:', error));
}

function highlightSavedProfilePic(picUrl) {
  document.querySelectorAll('.profile-pic-option img').forEach((img) => {
    if (img.src.includes(picUrl.split('/').pop())) {
      img.parentElement.classList.add('selected');
    }
  });
}

function loadProfilePic(userId) {
  const userRef = ref(db, 'users/' + userId + '/profilePic');
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const picUrl = snapshot.val();
        profilePicPreview.src = picUrl;
        highlightSavedProfilePic(picUrl);
      }
    })
    .catch((error) => console.error('Error loading profile picture:', error));
}

const teams = [
  "arizona-cardinals-logo.png","atlanta-falcons-logo.png","baltimore-ravens-logo.png","buffalo-bills-logo.png",
  "carolina-panthers-logo.png","chicago-bears-logo.png","cincinnati-bengals-logo.png","cleveland-browns-logo.png",
  "dallas-cowboys-logo.png","denver-broncos-logo.png","detroit-lions-logo.png","green-bay-packers-logo.png",
  "houston-texans-logo.png","indianapolis-colts-logo.png","jacksonville-jaguars-logo.png","kansas-city-chiefs-logo.png",
  "la-rams-logo.png","los-angeles-chargers-logo.png","los-angeles-rams-logo.png","miami-dolphins-logo.png",
  "minnesota-vikings-logo.png","new-england-patriots-logo.png","new-orleans-saints-logo.png","new-york-giants-logo.png",
  "new-york-jets-logo.png","oakland-raiders-logo.png","philadelphia-eagles-logo.png","pittsburgh-steelers-logo.png",
  "san-francisco-49ers-logo.png","seattle-seahawks-logo.png","tampa-bay-buccaneers-logo.png","tennessee-titans-logo.png",
  "washington-commanders-logo.png","washington-redskins-logo.png","xqc-logo.png"
];

const logoSelection = document.getElementById('logoSelection');
const profilePicPreview = document.getElementById('profilePicPreview');

teams.forEach((team) => {
  const div = document.createElement('div');
  div.classList.add('profile-pic-option');
  const img = document.createElement('img');
  img.src = `images/NFL LOGOS/${team}`;
  img.alt = team;
  div.appendChild(img);
  logoSelection.appendChild(div);

  div.addEventListener('click', () => {
    if (auth.currentUser) {
      profilePicPreview.src = img.src;
      saveProfilePic(auth.currentUser.uid, img.src);
      document.querySelectorAll('.profile-pic-option').forEach((opt) => opt.classList.remove('selected'));
      div.classList.add('selected');
    } else {
      alert('You must be logged in to set a profile picture.');
    }
  });
});

function loadUsernameColor(userId) {
  const colorRef = ref(db, `users/${userId}/usernameColor`);
  const usernameDisplay = document.getElementById('usernameDisplay');

  get(colorRef)
    .then((snapshot) => {
      if (snapshot.exists()) usernameDisplay.style.color = snapshot.val();
    })
    .catch((error) => console.error('Error loading username color:', error));

  const saveButton = document.getElementById('saveColorButton');
  const colorPicker = document.getElementById('usernameColorPicker');

  saveButton.addEventListener('click', () => {
    const selectedColor = colorPicker.value;
    set(colorRef, selectedColor)
      .then(() => {
        usernameDisplay.style.color = selectedColor;
        alert('Username color saved successfully!');
      })
      .catch((error) => {
        console.error('Error saving username color:', error);
        alert('Failed to save username color. Please try again.');
      });
  });
}

const games = [
  { homeTeam: 'Cowboys',    awayTeam: 'Eagles',     homeRecord: '0-0', awayRecord: '0-0' }, // Thu
  { homeTeam: 'Chiefs',     awayTeam: 'Chargers',   homeRecord: '0-0', awayRecord: '0-0' }, // Fri
  { homeTeam: 'Dolphins',   awayTeam: 'Colts',      homeRecord: '0-0', awayRecord: '0-0' }, // Sun 1:00
  { homeTeam: 'Steelers',   awayTeam: 'Jets',       homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Panthers',   awayTeam: 'Jaguars',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Cardinals',  awayTeam: 'Saints',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Giants',     awayTeam: 'Commanders', homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Buccaneers', awayTeam: 'Falcons',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Bengals',    awayTeam: 'Browns',     homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Raiders',    awayTeam: 'Patriots',   homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: '49ers',      awayTeam: 'Seahawks',   homeRecord: '0-0', awayRecord: '0-0' }, // 4:05
  { homeTeam: 'Titans',     awayTeam: 'Broncos',    homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Lions',      awayTeam: 'Packers',    homeRecord: '0-0', awayRecord: '0-0' }, // 4:25
  { homeTeam: 'Texans',     awayTeam: 'Rams',       homeRecord: '0-0', awayRecord: '0-0' },
  { homeTeam: 'Ravens',     awayTeam: 'Bills',      homeRecord: '0-0', awayRecord: '0-0' }, // SNF
  { homeTeam: 'Vikings',    awayTeam: 'Bears',      homeRecord: '0-0', awayRecord: '0-0' }  // MNF
];

let userPicks = {};
let usedPoints = new Set();

function displayGames() {
  const tableBody = document.getElementById('gamesTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  games.forEach((game, index) => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})</td>
      <td>
        <button id="home-${index}" onclick="selectPick(${index}, 'home')">${game.homeTeam}</button>
        <button id="away-${index}" onclick="selectPick(${index}, 'away')">${game.awayTeam}</button>
      </td>
      <td>
        <select id="confidence${index}" onchange="assignConfidence(${index})" required></select>
        <span id="confidenceDisplay${index}" class="confidence-display"></span>
      </td>
    `;
    updateConfidenceDropdown(index);
    
    if (IS_LOCKED) {
      const hb = document.getElementById(`home-${index}`);
      const ab = document.getElementById(`away-${index}`);
      const sel = document.getElementById(`confidence${index}`);
      if (hb) hb.disabled = true;
      if (ab) ab.disabled = true;
      if (sel) sel.disabled = true;
    }
  });
}

function updateConfidenceDropdown(gameIndex) {
  const dropdown = document.getElementById(`confidence${gameIndex}`);
  dropdown.innerHTML = '<option value="">Select</option>';
  for (let i = 1; i <= 16; i++) {
    if (!usedPoints.has(i)) {
      const option = document.createElement('option');
      option.value = i;
      option.text = i;
      dropdown.appendChild(option);
    }
  }
}

window.selectPick = function (gameIndex, team) {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }

  userPicks[gameIndex] = userPicks[gameIndex] || {};
  userPicks[gameIndex].team =
    team === 'home' ? games[gameIndex].homeTeam : games[gameIndex].awayTeam;

  const homeButton = document.getElementById(`home-${gameIndex}`);
  const awayButton = document.getElementById(`away-${gameIndex}`);
  if (team === 'home') {
    homeButton.classList.add('selected');
    awayButton.classList.remove('selected');
  } else {
    awayButton.classList.add('selected');
    homeButton.classList.remove('selected');
  }

  saveUserPicks(auth.currentUser.uid);
};

window.assignConfidence = function (gameIndex) {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }

  const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
  const points = parseInt(confidenceSelect.value);
  const confidenceDisplay = document.getElementById(`confidenceDisplay${gameIndex}`);

  if (userPicks[gameIndex]?.points) {
    usedPoints.delete(userPicks[gameIndex].points);
  }

  if (points >= 1 && points <= 16 && !usedPoints.has(points)) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].points = points;
    usedPoints.add(points);
    confidenceDisplay.textContent = points;

    saveUserPicks(auth.currentUser.uid);
    games.forEach((_, i) => updateConfidenceDropdown(i));
  } else {
    confidenceSelect.value = '';
    confidenceDisplay.textContent = '';
  }
};

function saveUserPicks(userId) {
  if (IS_LOCKED) return Promise.resolve();
  const path = `scoreboards/${CURRENT_WEEK}/${userId}`;
  console.log('[save] ->', path);
  return set(ref(db, path), userPicks)
    .then(() => console.log('Picks saved successfully!'))
    .catch((error) => console.error('Error saving picks:', error));
}

function loadUserPicks(userId) {
  const path = `scoreboards/${CURRENT_WEEK}/${userId}`;
  console.log('[load] <-', path);
  return get(child(ref(db), path))
    .then((snapshot) => {
      if (snapshot.exists()) {
        userPicks = snapshot.val();
        displayUserPicks(userPicks);
      } else {
        userPicks = {};
        usedPoints.clear();
        games.forEach((_, i) => updateConfidenceDropdown(i));
      }
    })
    .catch((error) => console.error('Error loading picks:', error));
}

function displayUserPicks(picks) {
  for (const gameIndex in picks) {
    const pick = picks[gameIndex];
    const game = games[gameIndex];
    if (!game) continue;

    if (pick.team === game.homeTeam) {
      document.getElementById(`home-${gameIndex}`).classList.add('selected');
    } else if (pick.team === game.awayTeam) {
      document.getElementById(`away-${gameIndex}`).classList.add('selected');
    }

    if (pick.points) {
      usedPoints.add(pick.points);
      document.getElementById(`confidence${gameIndex}`).value = pick.points;
      document.getElementById(`confidenceDisplay${gameIndex}`).textContent = pick.points;
    }
  }
  games.forEach((_, i) => updateConfidenceDropdown(i));
}

window.resetPicks = function () {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }
  userPicks = {};
  usedPoints.clear();
  displayGames();
  saveUserPicks(auth.currentUser.uid);
  applyLockUI();
};

window.submitPicks = async function () {
  if (IS_LOCKED) { alert('Picks are locked for this week.'); return; }
  try {
    await refreshCurrentWeek();
    if (IS_LOCKED) { applyLockUI(); alert('Picks are locked for this week.'); return; }

    await saveUserPicks(auth.currentUser.uid);
    alert('Picks submitted successfully!');
    window.location.href = 'housePicks.html';
  } catch (error) {
    console.error('Error submitting picks:', error.message);
    alert('Error submitting picks. Please try again.');
  }
};

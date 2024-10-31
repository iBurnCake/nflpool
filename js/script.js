// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set, get, remove } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEIIp_7mw1lEJi2ySy8rbYI9zIGz1d2d8",
  authDomain: "nflpool-71337.firebaseapp.com",
  projectId: "nflpool-71337",
  storageBucket: "nflpool-71337.firebasestorage.app",
  messagingSenderId: "2003523098",
  appId: "1:2003523098:web:713a9905761dabae7863a3",
  measurementId: "G-1EBF3DPND1",
  databaseURL: "https://nflpool-71337-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const adminEmail = "luke.romano2004@gmail.com"; // Admin email
let userPicks = {};
let usedPoints = new Set();
let loggedInUser = null;

// Game data for Week 9
const games = [
  { homeTeam: 'Texans', awayTeam: 'Jets', homeRecord: '6-2', awayRecord: '2-6' },
  // Add more games here as required
];

// Save picks to Firebase
function savePicksToDatabase() {
  if (loggedInUser) {
    set(ref(db, `picks/${loggedInUser.uid}`), userPicks);
  }
}

// Load picks from Firebase
function loadPicksFromDatabase() {
  if (loggedInUser) {
    get(ref(db, `picks/${loggedInUser.uid}`)).then(snapshot => {
      userPicks = snapshot.val() || {};
      usedPoints = new Set(Object.values(userPicks).map(pick => pick.points).filter(Boolean));
      displayGames();
    });
  }
}

// Display games and load saved selections
function displayGames() {
  const tableBody = document.getElementById('gamesTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = ''; // Clear existing rows

  games.forEach((game, index) => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td>${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})</td>
      <td>
        <button id="homeTeam${index}" onclick="selectPick(${index}, 'home')">${game.homeTeam}</button>
        <button id="awayTeam${index}" onclick="selectPick(${index}, 'away')">${game.awayTeam}</button>
      </td>
      <td>
        <select id="confidence${index}" onchange="assignConfidence(${index})">
          <option value="" disabled selected>Select Points</option>
          ${getAvailableOptions(index)}
        </select>
      </td>
    `;

    if (userPicks[index]) {
      const selectedButtonId = userPicks[index].team === 'home' ? `homeTeam${index}` : `awayTeam${index}`;
      document.getElementById(selectedButtonId).classList.add('selected');
      document.getElementById(`confidence${index}`).value = userPicks[index].points;
    }
  });
}

// Generate available options for the confidence dropdown
function getAvailableOptions(gameIndex) {
  const options = [];
  for (let i = 1; i <= 15; i++) {
    if (!usedPoints.has(i) || (userPicks[gameIndex] && userPicks[gameIndex].points === i)) {
      options.push(`<option value="${i}">${i}</option>`);
    }
  }
  return options.join('');
}

// Handle team selection
function selectPick(gameIndex, team) {
  const buttons = document.querySelectorAll(`#gamesTable tr:nth-child(${gameIndex + 1}) button`);
  buttons.forEach(button => button.classList.remove("selected"));

  const selectedButton = team === 'home' ? buttons[0] : buttons[1];
  selectedButton.classList.add("selected");

  userPicks[gameIndex] = { team, points: userPicks[gameIndex] ? userPicks[gameIndex].points : null };
  savePicksToDatabase();
}

// Assign confidence points and save
function assignConfidence(gameIndex) {
  const confidenceInput = document.getElementById(`confidence${gameIndex}`);
  const newPoints = parseInt(confidenceInput.value);

  if (userPicks[gameIndex] && userPicks[gameIndex].points !== null) {
    usedPoints.delete(userPicks[gameIndex].points);
  }

  if (newPoints >= 1 && newPoints <= 15) {
    usedPoints.add(newPoints);
    userPicks[gameIndex].points = newPoints;
    savePicksToDatabase();
  } else {
    confidenceInput.value = '';
  }
  displayGames();
}

// Firebase login
function login(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      loggedInUser = userCredential.user;
      loadPicksFromDatabase();
      document.getElementById('usernameDisplay').textContent = loggedInUser.email;
      document.getElementById('loginSection').style.display = 'none';
      document.getElementById('userHomeSection').style.display = 'block';

      if (loggedInUser.email === adminEmail) {
        document.getElementById('adminSection').style.display = 'block';
      }

      displayGames();
    })
    .catch(error => {
      console.error("Login error:", error);
      alert("Invalid email or password.");
    });
}

// Firebase registration
function register(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("User registered successfully.");
      showLoginForm();
    })
    .catch(error => {
      console.error("Registration error:", error);
      alert("Registration failed.");
    });
}

// Function to show registration form
function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

// Function to show login form
function showLoginForm() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

// Function to reset picks for all users (admin only)
function resetPicks() {
  if (loggedInUser && loggedInUser.email === adminEmail) {
    remove(ref(db, 'picks'))
      .then(() => {
        alert("All users' picks have been reset!");
        userPicks = {};
        usedPoints.clear();
        displayGames();
      })
      .catch(error => {
        console.error("Error resetting picks:", error);
      });
  } else {
    alert("Only the admin can reset all users' picks.");
  }
}

// Handle login form submission
document.getElementById("loginForm").onsubmit = event => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  login(email, password);
};

// Handle register form submission
document.getElementById("registerForm").onsubmit = event => {
  event.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  register(email, password);
};

// Clear session storage on page load to force re-login on refresh
window.onload = function () {
  signOut(auth);
};

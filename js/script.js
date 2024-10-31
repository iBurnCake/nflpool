// Import Firebase configuration and initialize app
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEIIp_7mw1lEJi2ySy8rbYI9zIGz1d2d8",
  authDomain: "nflpool-71337.firebaseapp.com",
  projectId: "nflpool-71337",
  storageBucket: "nflpool-71337.appspot.com",
  messagingSenderId: "2003523098",
  appId: "1:2003523098:web:713a9905761dabae7863a3",
  measurementId: "G-1EBF3DPND1"
};

// Initialize Firebase and Firebase Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const database = getDatabase(app);

// Admin Email
const adminEmail = "luke.romano2004@gmail.com";

// Track user data
let loggedInUser = null;
let userPicks = {};
let usedPoints = new Set();

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      loggedInUser = userCredential.user;
      loadPicksFromDatabase(); // Load picks from Firebase Database
      document.getElementById("usernameDisplay").textContent = email;
      document.getElementById("loginSection").style.display = "none";
      document.getElementById("userHomeSection").style.display = "block";

      // Check if the logged-in user is the admin
      if (email === adminEmail) {
        document.getElementById("adminSection").style.display = "block";
      }
      displayGames(); // Display the games after successful login
    })
    .catch((error) => {
      console.error("Error during login:", error);
      alert("Invalid email or password.");
    });
});

// Save picks to Firebase Database
function savePicksToDatabase() {
  if (loggedInUser) {
    const dbRef = ref(database, `picks/${loggedInUser.uid}`);
    set(dbRef, userPicks)
      .then(() => console.log("Picks saved successfully."))
      .catch((error) => console.error("Error saving picks:", error));
  }
}

// Load picks from Firebase Database
function loadPicksFromDatabase() {
  if (loggedInUser) {
    const dbRef = ref(database, `picks/${loggedInUser.uid}`);
    get(dbRef).then((snapshot) => {
      if (snapshot.exists()) {
        userPicks = snapshot.val();
        usedPoints = new Set(Object.values(userPicks).map((pick) => pick.points).filter(Boolean));
        displayGames(); // Display games with loaded picks
      } else {
        console.log("No picks found for this user.");
        userPicks = {};
        usedPoints.clear();
        displayGames();
      }
    });
  }
}

// Display games
function displayGames() {
  const tableBody = document.getElementById("gamesTable").getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Clear existing rows

  const games = [
    { homeTeam: "Texans", awayTeam: "Jets", homeRecord: "6-2", awayRecord: "2-6" },
    { homeTeam: "Saints", awayTeam: "Panthers", homeRecord: "2-6", awayRecord: "1-7" },
    { homeTeam: 'Commanders', awayTeam: 'Giants', homeRecord: '6-2', awayRecord: '2-6' },
    { homeTeam: 'Dolphins', awayTeam: 'Bills', homeRecord: '2-5', awayRecord: '6-2' },
    { homeTeam: 'Chargers', awayTeam: 'Browns', homeRecord: '4-3', awayRecord: '2-6' },
    { homeTeam: 'Patriots', awayTeam: 'Titans', homeRecord: '2-6', awayRecord: '1-6' },
    { homeTeam: 'Cowboys', awayTeam: 'Falcons', homeRecord: '3-4', awayRecord: '5-3' },
    { homeTeam: 'Raiders', awayTeam: 'Bengals', homeRecord: '2-6', awayRecord: '3-5' },
    { homeTeam: 'Broncos', awayTeam: 'Ravens', homeRecord: '5-3', awayRecord: '5-3' },
    { homeTeam: 'Bears', awayTeam: 'Cardinals', homeRecord: '4-3', awayRecord: '4-4' },
    { homeTeam: 'Jaguars', awayTeam: 'Eagles', homeRecord: '2-6', awayRecord: '5-2' },
    { homeTeam: 'Rams', awayTeam: 'Seahawks', homeRecord: '3-4', awayRecord: '4-4' },
    { homeTeam: 'Lions', awayTeam: 'Packers', homeRecord: '6-1', awayRecord: '6-2' },
    { homeTeam: 'Colts', awayTeam: 'Vikings', homeRecord: '4-4', awayRecord: '5-2' },
    { homeTeam: 'Buccaneers', awayTeam: 'Chiefs', homeRecord: '4-4', awayRecord: '7-0' },

  ];

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
      const selectedButtonId = userPicks[index].team === "home" ? `homeTeam${index}` : `awayTeam${index}`;
      document.getElementById(selectedButtonId).classList.add("selected");
      document.getElementById(`confidence${index}`).value = userPicks[index].points;
    }
  });
}

// Generate available options for confidence dropdown
function getAvailableOptions(gameIndex) {
  const options = [];
  for (let i = 1; i <= 15; i++) {
    if (!usedPoints.has(i) || (userPicks[gameIndex] && userPicks[gameIndex].points === i)) {
      options.push(`<option value="${i}">${i}</option>`);
    }
  }
  return options.join("");
}

// Handle team selection
function selectPick(gameIndex, team) {
  const buttons = document.querySelectorAll(`#gamesTable tr:nth-child(${gameIndex + 1}) button`);
  buttons.forEach((button) => button.classList.remove("selected"));

  const selectedButton = team === "home" ? buttons[0] : buttons[1];
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
    confidenceInput.value = "";
  }
  displayGames();
}

// Reset picks (admin-only)
function resetPicks() {
  if (loggedInUser && loggedInUser.email === adminEmail) {
    const dbRef = ref(database, "picks");
    set(dbRef, null)
      .then(() => {
        alert("All users' picks have been reset!");
        userPicks = {};
        usedPoints.clear();
        displayGames();
      })
      .catch((error) => console.error("Error resetting picks:", error));
  } else {
    alert("Only the admin can reset all users' picks.");
  }
}

// Import Firebase configuration
import { auth, db, signInWithEmailAndPassword, ref, set, get, child } from './firebaseConfig.js';

// Fixed game data for Week 9
const games = [
    { homeTeam: 'Texans', awayTeam: 'Jets', homeRecord: '6-2', awayRecord: '2-6' },
    { homeTeam: 'Saints', awayTeam: 'Panthers', homeRecord: '2-6', awayRecord: '1-7' },
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
    { homeTeam: 'Buccaneers', awayTeam: 'Chiefs', homeRecord: '4-4', awayRecord: '7-0' }
];

// Track user picks and assigned points
let userPicks = {};
let usedPoints = new Set();

// Ensure the DOM is loaded before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
        console.log("Login form found and event listener added.");
    } else {
        console.error("Login form not found.");
    }
});

// Handle login with Firebase
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            document.getElementById('usernameDisplay').textContent = user.email;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('userHomeSection').style.display = 'block';
            displayGames();
            loadUserPicks(user.uid);
        })
        .catch((error) => {
            console.error("Login error:", error);
            alert("Invalid email or password.");
        });
}

// Function to display games in the table
function displayGames() {
    const tableBody = document.getElementById('gamesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows

    games.forEach((game, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})</td>
            <td>
                <button id="home-${index}" onclick="selectPick(${index}, 'home')">${game.homeTeam}</button>
                <button id="away-${index}" onclick="selectPick(${index}, 'away')">${game.awayTeam}</button>
            </td>
            <td>
                <input type="number" id="confidence${index}" min="1" max="16" onchange="assignConfidence(${index})" required>
            </td>
        `;
    });
}

// Handle selection of a team
window.selectPick = function (gameIndex, team) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].team = team;

    // Highlight selected team and remove highlight from the other
    const homeButton = document.getElementById(`home-${gameIndex}`);
    const awayButton = document.getElementById(`away-${gameIndex}`);
    if (team === 'home') {
        homeButton.classList.add("selected");
        awayButton.classList.remove("selected");
    } else {
        awayButton.classList.add("selected");
        homeButton.classList.remove("selected");
    }

    // Save picks to Firebase
    saveUserPicks(auth.currentUser.uid);
};

// Assign confidence points
window.assignConfidence = function (gameIndex) {
    const confidenceInput = document.getElementById(`confidence${gameIndex}`);
    const points = parseInt(confidenceInput.value);

    if (usedPoints.has(points)) {
        alert("This confidence point is already used. Choose a different one.");
        confidenceInput.value = ''; // Clear duplicate entry
    } else if (points >= 1 && points <= 16) {
        usedPoints.add(points);
        userPicks[gameIndex] = userPicks[gameIndex] || {};
        userPicks[gameIndex].points = points;
        saveUserPicks(auth.currentUser.uid);
        alert(`Assigned ${points} points to game ${gameIndex + 1}`);
    } else {
        alert("Please enter a value between 1 and 16.");
    }
};

// Save user picks to Firebase
function saveUserPicks(userId) {
    set(ref(db, `scoreboards/week9/${userId}`), userPicks)
        .then(() => {
            console.log("Picks saved successfully!");
        })
        .catch((error) => {
            console.error("Error saving picks:", error);
        });
}

// Load user picks from Firebase and apply highlights
function loadUserPicks(userId) {
    get(child(ref(db), `scoreboards/week9/${userId}`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                userPicks = snapshot.val();
                displayUserPicks(userPicks);
            } else {
                console.log("No picks available for this user.");
            }
        })
        .catch((error) => {
            console.error("Error loading picks:", error);
        });
}

// Display saved picks and highlight selections
function displayUserPicks(picks) {
    for (const gameIndex in picks) {
        const pick = picks[gameIndex];

        // Highlight selected team button
        if (pick.team === 'home') {
            document.getElementById(`home-${gameIndex}`).classList.add("selected");
        } else if (pick.team === 'away') {
            document.getElementById(`away-${gameIndex}`).classList.add("selected");
        }

        // Set confidence points in input field
        if (pick.points) {
            document.getElementById(`confidence${gameIndex}`).value = pick.points;
            usedPoints.add(pick.points); // Track used points
        }
    }
}

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

let userPicks = {};
let usedPoints = new Set();

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

// Function to display games and set up confidence dropdowns
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
                <select id="confidence${index}" onchange="assignConfidence(${index})" required></select>
            </td>
        `;
        updateConfidenceDropdown(index); // Populate dropdown with available points
    });
}

// Populate dropdown with available points
function updateConfidenceDropdown(gameIndex) {
    const dropdown = document.getElementById(`confidence${gameIndex}`);
    dropdown.innerHTML = '<option value="">Select</option>';

    for (let i = 1; i <= 15; i++) {
        if (!usedPoints.has(i)) {
            const option = document.createElement("option");
            option.value = i;
            option.text = i;
            dropdown.appendChild(option);
        }
    }
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

// Assign confidence points and update dropdowns
window.assignConfidence = function (gameIndex) {
    const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
    const points = parseInt(confidenceSelect.value);

    if (userPicks[gameIndex]?.points) {
        usedPoints.delete(userPicks[gameIndex].points); // Remove previous points from set
    }

    if (points >= 1 && points <= 15 && !usedPoints.has(points)) {
        // Update user picks and add the point to the used set
        usedPoints.add(points);
        userPicks[gameIndex] = userPicks[gameIndex] || {};
        userPicks[gameIndex].points = points;

        saveUserPicks(auth.currentUser.uid);

        // Refresh all dropdowns to reflect available points
        games.forEach((_, i) => updateConfidenceDropdown(i));
    } else {
        confidenceSelect.value = ""; // Reset if point is not available
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

// Reset user picks
window.resetPicks = function () {
    userPicks = {}; // Clear picks data
    usedPoints.clear(); // Clear used points
    saveUserPicks(auth.currentUser.uid); // Save empty picks to Firebase

    displayGames(); // Refresh the UI to reflect cleared selections
};

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

        // Set confidence points and update used points
        if (pick.points) {
            usedPoints.add(pick.points);
            document.getElementById(`confidence${gameIndex}`).value = pick.points;
        }
    }

    // Refresh dropdowns to reflect used points
    games.forEach((_, i) => updateConfidenceDropdown(i));
}

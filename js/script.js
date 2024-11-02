// Import Firebase configuration
import { auth, db, signInWithEmailAndPassword, ref, set, get, child } from './firebaseConfig.js';

// Fixed game data for Week 9
const games = [
    // Add your games data here as it was previously
];

let userPicks = {};
let usedPoints = new Set();

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
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

// Display games and setup confidence dropdowns
function displayGames() {
    const tableBody = document.getElementById('gamesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows

    games.forEach((game, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})</td>
            <td>
                <button id="home-${index}" onclick="selectPick(${index}, 'home')" class="table-button">${game.homeTeam}</button>
                <button id="away-${index}" onclick="selectPick(${index}, 'away')" class="table-button">${game.awayTeam}</button>
            </td>
            <td>
                <select id="confidence${index}" onchange="assignConfidence(${index})" required></select>
                <span id="confidenceDisplay${index}" class="confidence-display"></span>
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

    const homeButton = document.getElementById(`home-${gameIndex}`);
    const awayButton = document.getElementById(`away-${gameIndex}`);

    if (team === 'home') {
        homeButton.classList.add("selected");
        awayButton.classList.remove("selected");
    } else {
        awayButton.classList.add("selected");
        homeButton.classList.remove("selected");
    }

    saveUserPicks(auth.currentUser.uid);
};

// Assign confidence points and update dropdowns
window.assignConfidence = function (gameIndex) {
    const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
    const points = parseInt(confidenceSelect.value);
    const confidenceDisplay = document.getElementById(`confidenceDisplay${gameIndex}`);

    if (userPicks[gameIndex]?.points) {
        usedPoints.delete(userPicks[gameIndex].points);
    }

    if (points >= 1 && points <= 15 && !usedPoints.has(points)) {
        userPicks[gameIndex] = userPicks[gameIndex] || {};
        userPicks[gameIndex].points = points;
        usedPoints.add(points);

        confidenceDisplay.textContent = points;

        saveUserPicks(auth.currentUser.uid);
        games.forEach((_, i) => updateConfidenceDropdown(i));
    } else {
        confidenceSelect.value = "";
        confidenceDisplay.textContent = "";
    }
};

// Reset user picks
window.resetPicks = function () {
    userPicks = {};
    usedPoints.clear();

    games.forEach((_, index) => {
        document.getElementById(`home-${index}`).classList.remove("selected");
        document.getElementById(`away-${index}`).classList.remove("selected");
        document.getElementById(`confidence${index}`).value = "";
        document.getElementById(`confidenceDisplay${index}`).textContent = "";
    });

    saveUserPicks(auth.currentUser.uid);
};

// Save user picks to Firebase
function saveUserPicks(userId) {
    set(ref(db, `scoreboards/week9/${userId}`), { picks: userPicks })
        .then(() => console.log("Picks saved successfully!"))
        .catch((error) => console.error("Error saving picks:", error));
}

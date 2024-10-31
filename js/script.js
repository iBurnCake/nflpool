// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEIIp_7mw1lEJi2ySy8rbYI9zIGz1d2d8",
  authDomain: "nflpool-71337.firebaseapp.com",
  projectId: "nflpool-71337",
  storageBucket: "nflpool-71337.firebasestorage.app",
  messagingSenderId: "2003523098",
  appId: "1:2003523098:web:713a9905761dabae7863a3",
  measurementId: "G-1EBF3DPND1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const adminEmail = "luke.romano2004@gmail.com"; // Set this as the admin email
let userPicks = {};
let usedPoints = new Set();
let loggedInUser = null;

// Game data for Week 9
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

// Save picks to Firebase
function savePicksToDatabase() {
    if (loggedInUser) {
        db.ref(`picks/${loggedInUser.uid}`).set(userPicks);
    }
}

// Load picks from Firebase
function loadPicksFromDatabase() {
    if (loggedInUser) {
        db.ref(`picks/${loggedInUser.uid}`).once('value').then(snapshot => {
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
    auth.signInWithEmailAndPassword(email, password)
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

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(email, password);
}

// Register function (if you want to allow users to register)
function register(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            alert("User registered successfully.");
        })
        .catch(error => {
            console.error("Registration error:", error);
            alert("Registration failed.");
        });
}

// Function to reset picks for all users (admin only)
function resetPicks() {
    if (loggedInUser && loggedInUser.email === adminEmail) {
        db.ref('picks').remove()
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

// Set up form to trigger handleLogin on submission
document.querySelector("form").onsubmit = handleLogin;

// Clear session storage on page load to force re-login on refresh
window.onload = function () {
    auth.signOut();
};
}
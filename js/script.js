import { auth, db, signInWithEmailAndPassword, ref, set, get, child, onAuthStateChanged } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.email);
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('userHomeSection').style.display = 'block';
            document.getElementById('usernameDisplay').textContent = user.email;
            displayGames();
            loadUserPicks(user.uid);
        } else {
            console.log("No user logged in");
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userHomeSection').style.display = 'none';
        }
    });

    document.getElementById('loginForm')?.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log("Attempting login with email:", email);

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Login successful:", userCredential.user.email);
            })
            .catch((error) => {
                console.error("Login error:", error.message);
                alert("Login failed. Please check your email and password.");
            });
    });

    document.getElementById('resetButton')?.addEventListener("click", resetPicks);
    document.getElementById('submitButton')?.addEventListener("click", submitPicks);
    document.getElementById('logoutButton')?.addEventListener("click", () => {
        auth.signOut().then(() => {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userHomeSection').style.display = 'none';
            alert("You have been logged out.");
        }).catch((error) => {
            console.error("Logout error:", error.message);
            alert("Error logging out. Please try again.");
        });
    });
});

const games = [
    { homeTeam: 'Commanders', awayTeam: 'Eagles', homeRecord: '7-3', awayRecord: '7-2' },
    { homeTeam: 'Raiders', awayTeam: 'Dolphins', homeRecord: '2-7', awayRecord: '3-6' },
    { homeTeam: 'Browns', awayTeam: 'Saints', homeRecord: '2-7', awayRecord: '3-7' },
    { homeTeam: 'Colts', awayTeam: 'Jets', homeRecord: '4-6', awayRecord: '3-7' },
    { homeTeam: 'Vikings', awayTeam: 'Titans', homeRecord: '7-2', awayRecord: '2-7' },
    { homeTeam: 'Packers', awayTeam: 'Bears', homeRecord: '6-3', awayRecord: '4-5' },
    { homeTeam: 'Jaguars', awayTeam: 'Lions', homeRecord: '2-8', awayRecord: '8-1' },
    { homeTeam: 'Rams', awayTeam: 'Patriots', homeRecord: '4-5', awayRecord: '3-7' },
    { homeTeam: 'Ravens', awayTeam: 'Steelers', homeRecord: '7-3', awayRecord: '7-2' },
    { homeTeam: 'Seahawks', awayTeam: '49ers', homeRecord: '4-5', awayRecord: '5-4' },
    { homeTeam: 'Falcons', awayTeam: 'Broncos', homeRecord: '6-4', awayRecord: '5-5' },
    { homeTeam: 'Chiefs', awayTeam: 'Bills', homeRecord: '9-0', awayRecord: '8-2' },
    { homeTeam: 'Bengals', awayTeam: 'Chargers', homeRecord: '4-6', awayRecord: '6-3' },
    { homeTeam: 'Texans', awayTeam: 'Cowboys', homeRecord: '6-4', awayRecord: '3-6' }
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
    });
}

function updateConfidenceDropdown(gameIndex) {
    const dropdown = document.getElementById(`confidence${gameIndex}`);
    dropdown.innerHTML = '<option value="">Select</option>';

    for (let i = 1; i <= 14; i++) {
        if (!usedPoints.has(i)) {
            const option = document.createElement("option");
            option.value = i;
            option.text = i;
            dropdown.appendChild(option);
        }
    }
}

window.selectPick = function (gameIndex, team) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].team = team === 'home' ? games[gameIndex].homeTeam : games[gameIndex].awayTeam;

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

window.assignConfidence = function (gameIndex) {
    const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
    const points = parseInt(confidenceSelect.value);
    const confidenceDisplay = document.getElementById(`confidenceDisplay${gameIndex}`);

    if (userPicks[gameIndex]?.points) {
        usedPoints.delete(userPicks[gameIndex].points);
    }

    if (points >= 1 && points <= 14 && !usedPoints.has(points)) {
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

function saveUserPicks(userId) {
    set(ref(db, `scoreboards/week9/${userId}`), userPicks)
        .then(() => {
            console.log("Picks saved successfully!");
        })
        .catch((error) => {
            console.error("Error saving picks:", error);
        });
}

window.resetPicks = function () {
    userPicks = {};
    usedPoints.clear();

    displayGames();
    saveUserPicks(auth.currentUser.uid);
};

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

function displayUserPicks(picks) {
    for (const gameIndex in picks) {
        const pick = picks[gameIndex];

        if (pick.team === games[gameIndex].homeTeam) {
            document.getElementById(`home-${gameIndex}`).classList.add("selected");
        } else if (pick.team === games[gameIndex].awayTeam) {
            document.getElementById(`away-${gameIndex}`).classList.add("selected");
        }

        if (pick.points) {
            usedPoints.add(pick.points);
            document.getElementById(`confidence${gameIndex}`).value = pick.points;
            document.getElementById(`confidenceDisplay${gameIndex}`).textContent = pick.points;
        }
    }

    games.forEach((_, i) => updateConfidenceDropdown(i));
}

window.submitPicks = function () {
    saveUserPicks(auth.currentUser.uid);
    alert("Picks submitted successfully!");
    window.location.href = "housePicks.html";
};

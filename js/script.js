import { auth, db, signInWithEmailAndPassword, ref, set, get, child, onAuthStateChanged } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('userHomeSection').style.display = 'block';
            document.getElementById('usernameDisplay').textContent = user.email;
            checkSubmissionStatus(user.uid); // New function to check if picks were submitted
        } else {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userHomeSection').style.display = 'none';
            auth.signOut();
        }
    });

    document.getElementById('resetButton')?.addEventListener("click", resetPicks);
    document.getElementById('submitButton')?.addEventListener("click", submitPicks);
    document.getElementById('logoutButton')?.addEventListener("click", () => {
        auth.signOut().then(() => {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userHomeSection').style.display = 'none';
            alert("You have been logged out.");
        }).catch((error) => {
            console.error("Logout error:", error);
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

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }
});

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
            checkSubmissionStatus(user.uid); // Check if picks were submitted
        })
        .catch((error) => {
            console.error("Login error:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                alert("Invalid email or password.");
            }
        });
}

function checkSubmissionStatus(userId) {
    get(child(ref(db), `scoreboards/week9/${userId}/submitted`))
        .then((snapshot) => {
            if (snapshot.exists() && snapshot.val() === true) {
                disableUserPicks(); // Disable picks table and reset button if submitted
            } else {
                displayGames();
                loadUserPicks(userId);
            }
        })
        .catch((error) => {
            console.error("Error checking submission status:", error);
        });
}

function disableUserPicks() {
    const table = document.getElementById('gamesTable');
    table.classList.add("disabled");
    document.getElementById('resetButton').disabled = true;
    document.getElementById('submitButton').disabled = true;
}

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
}

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
    const userId = auth.currentUser.uid;
    saveUserPicks(userId);
    
    // Set the submitted flag in the database to true
    set(ref(db, `scoreboards/week9/${userId}/submitted`), true)
        .then(() => {
            alert("Picks submitted successfully!");
            disableUserPicks(); // Disable after submission
        })
        .catch((error) => {
            console.error("Error submitting picks:", error);
        });
};

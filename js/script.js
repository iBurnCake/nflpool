// User profiles
const userProfiles = {
    "AngelaKant": "5353",
    "LukeRomano": "4242", // Admin Account
    "RyanSanders": "8989",
    "CharlesKeegan": "0000",
    "WilliamMathis": "2222" 
};

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
let loggedInUser = null;
const adminUsername = "LukeRomano"; 

// Function to save picks and points to localStorage
function savePicks() {
    if (loggedInUser) {
        localStorage.setItem(loggedInUser + "_picks", JSON.stringify(userPicks));
    }
}

// Function to load saved picks from localStorage
function loadPicks() {
    if (loggedInUser) {
        const savedPicks = JSON.parse(localStorage.getItem(loggedInUser + "_picks") || "{}");
        userPicks = savedPicks;
        usedPoints = new Set(Object.values(userPicks).map(pick => pick.points));
    }
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
                <button id="homeTeam${index}" onclick="selectPick(${index}, 'home')">${game.homeTeam}</button>
                <button id="awayTeam${index}" onclick="selectPick(${index}, 'away')">${game.awayTeam}</button>
            </td>
            <td>
                <input type="number" id="confidence${index}" min="1" max="15" onchange="assignConfidence(${index})" required>
            </td>
        `;

        // Load saved pick and confidence points if they exist
        if (userPicks[index]) {
            // Highlight the selected team button
            const selectedButtonId = userPicks[index].team === 'home' ? `homeTeam${index}` : `awayTeam${index}`;
            document.getElementById(selectedButtonId).classList.add('selected');

            // Set the saved confidence points
            document.getElementById(`confidence${index}`).value = userPicks[index].points;
        }
    });
}

// Handle selection of a team
function selectPick(gameIndex, team) {
    const buttons = document.querySelectorAll(`#gamesTable tr:nth-child(${gameIndex + 1}) button`);
    buttons.forEach(button => button.classList.remove("selected"));
    
    const selectedButton = team === 'home' ? buttons[0] : buttons[1];
    selectedButton.classList.add("selected");

    userPicks[gameIndex] = { team, points: userPicks[gameIndex]?.points || null };
    savePicks();
    alert(`You selected ${team} for game ${gameIndex + 1}`);
}

// Assign confidence points
function assignConfidence(gameIndex) {
    const confidenceInput = document.getElementById(`confidence${gameIndex}`);
    const points = parseInt(confidenceInput.value);

    if (usedPoints.has(points)) {
        alert("This confidence point is already used. Choose a different one.");
        confidenceInput.value = ''; // Clear duplicate entry
    } else if (points >= 1 && points <= 15) {
        usedPoints.add(points);
        userPicks[gameIndex] = { ...userPicks[gameIndex], points };
        savePicks();
        alert(`Assigned ${points} points to game ${gameIndex + 1}`);
    } else {
        alert("Please enter a value between 1 and 15.");
    }
}

// Login function
function login(username, password) {
    if (userProfiles[username] === password) {
        loggedInUser = username;
        sessionStorage.setItem("loggedInUser", username);
        loadPicks(); 
        document.getElementById('usernameDisplay').textContent = username;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('userHomeSection').style.display = 'block';

        if (username === adminUsername) {
            document.getElementById('adminSection').style.display = 'block';
        }

        displayGames();
    } else {
        alert("Invalid username or password.");
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
}

// Set up form to trigger handleLogin on submission
document.querySelector("form").onsubmit = handleLogin;

// Clear sessionStorage on page load to force re-login on refresh
window.onload = function () {
    sessionStorage.removeItem("loggedInUser");
};

// Function to reset all user picks for the current user
function resetPicks() {
    userPicks = {};          // Clear local picks
    usedPoints.clear();       // Clear used points
    savePicks();              // Save cleared picks to localStorage
    sessionStorage.removeItem("userPicks"); // Clear session storage picks
    alert("All picks have been reset!");

    displayGames();           // Refresh games table
}

import { auth } from './firebaseConfig.js';

auth.onAuthStateChanged((user) => {
    if (user) {
        // Check if the email matches the admin email
        if (user.email !== "luke.romano2004@gmail.com") {
            alert("Access denied. Admins only.");
            window.location.href = "index.html"; // Redirect to main page if not admin
        }
    } else {
        // If no user is logged in, redirect to login page
        alert("Please log in to access the admin page.");
        window.location.href = "index.html";
    }
});

import { db, ref, get } from './firebaseConfig.js';

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

let allUsersData = [];
let currentIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("nextUserButton").addEventListener("click", showNextUserPicks);
    loadAllLockedPicks();
});

function loadAllLockedPicks() {
    const picksRef = ref(db, 'scoreboards/week9');

    get(picksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                allUsersData = Object.entries(snapshot.val()).filter(([_, data]) => data.locked);
                showNextUserPicks(); // Start by showing the first user
            } else {
                console.log("No picks data available.");
            }
        })
        .catch((error) => {
            console.error("Error loading all picks:", error);
        });
}

// Function to display the next user's locked picks
function showNextUserPicks() {
    currentIndex = (currentIndex + 1) % allUsersData.length; // Cycle through users
    const [userId, userData] = allUsersData[currentIndex];
    const picks = userData.picks;

    // Update the current user display
    document.getElementById("currentUserName").textContent = userId;

    // Populate the user's picks table
    const tableBody = document.getElementById("currentUserPicksTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear any existing rows

    for (const gameIndex in picks) {
        const pick = picks[gameIndex];
        const row = tableBody.insertRow();
        
        row.innerHTML = `
            <td>${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}</td>
            <td>${pick.team}</td>
            <td>${pick.points || 'N/A'}</td>
        `;
    }
}

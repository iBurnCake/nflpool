import { db, ref, get, child } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", loadAllLockedPicks);

function loadAllLockedPicks() {
    // Reference to the path where all users' picks are stored
    const picksRef = ref(db, 'scoreboards/week9');

    // Retrieve all data from Firebase for week 9 picks
    get(picksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                displayLockedPicks(data);
            } else {
                console.log("No picks data available.");
            }
        })
        .catch((error) => {
            console.error("Error loading all picks:", error);
        });
}

// Function to display all locked picks in the table
function displayLockedPicks(data) {
    const tableBody = document.getElementById("lockedPicksTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear existing data

    for (const userId in data) {
        const userData = data[userId];
        const picks = userData.picks;
        const locked = userData.locked;

        // Skip displaying picks if they're not locked
        if (!locked) continue;

        for (const gameIndex in picks) {
            const pick = picks[gameIndex];
            const row = tableBody.insertRow();

            // Populate table rows with user data
            row.innerHTML = `
                <td>${userId}</td>
                <td>${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}</td>
                <td>${pick.team}</td>
                <td>${pick.points || 'N/A'}</td>
            `;
        }
    }
}

// Import Firebase configuration
import { db, ref, get, child } from './firebaseConfig.js';

// Function to load all house picks
document.addEventListener("DOMContentLoaded", loadHousePicks);

function loadHousePicks() {
    const housePicksRef = ref(db, 'housePicks');
    get(housePicksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                displayHousePicks(snapshot.val());
            } else {
                console.log("No picks found for the leaderboard.");
            }
        })
        .catch((error) => {
            console.error("Error fetching house picks:", error);
        });
}

// Function to display all house picks
function displayHousePicks(data) {
    const tableBody = document.getElementById("leaderboardTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear any existing rows

    for (const userId in data) {
        const picks = data[userId];

        for (const gameIndex in picks) {
            const pick = picks[gameIndex];
            const row = tableBody.insertRow();

            row.innerHTML = `
                <td>${userId}</td>
                <td>${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}</td>
                <td>${pick.team}</td>
                <td>${pick.points || 'N/A'}</td>
            `;
        }
    }
}

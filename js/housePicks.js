import { db, ref, get, child } from './firebaseConfig.js';

// Fetch and display all users' picks from "housePicks"
document.addEventListener("DOMContentLoaded", loadHousePicks);

function loadHousePicks() {
    const tableBody = document.getElementById("housePicksTable").getElementsByTagName("tbody")[0];

    get(child(ref(db), "housePicks"))
    .then(snapshot => {
        if (snapshot.exists()) {
            tableBody.innerHTML = ""; // Clear existing rows
            snapshot.forEach(userSnapshot => {
                const userId = userSnapshot.key;
                const userData = userSnapshot.val();
                const userName = userData.name;
                const picks = userData.picks;

                for (const gameIndex in picks) {
                    const pick = picks[gameIndex];
                    const row = tableBody.insertRow();

                    row.innerHTML = `
                        <td>${userName}</td>
                        <td>${pick.matchup || `${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}`}</td>
                        <td>${pick.team}</td>
                        <td>${pick.points || 'N/A'}</td>
                    `;
                }
            });
        } else {
            console.log("No picks found for the House Picks leaderboard.");
        }
    })
    .catch(error => console.error("Error loading house picks:", error));
}

import { db, ref, get, child } from './firebaseConfig.js';

// Array of games for reference
const games = [
    { homeTeam: 'Texans', awayTeam: 'Jets' },
    { homeTeam: 'Saints', awayTeam: 'Panthers' },
    { homeTeam: 'Commanders', awayTeam: 'Giants' },
    { homeTeam: 'Dolphins', awayTeam: 'Bills' },
    { homeTeam: 'Chargers', awayTeam: 'Browns' },
    { homeTeam: 'Patriots', awayTeam: 'Titans' },
    { homeTeam: 'Cowboys', awayTeam: 'Falcons' },
    { homeTeam: 'Raiders', awayTeam: 'Bengals' },
    { homeTeam: 'Broncos', awayTeam: 'Ravens' },
    { homeTeam: 'Bears', awayTeam: 'Cardinals' },
    { homeTeam: 'Jaguars', awayTeam: 'Eagles' },
    { homeTeam: 'Rams', awayTeam: 'Seahawks' },
    { homeTeam: 'Lions', awayTeam: 'Packers' },
    { homeTeam: 'Colts', awayTeam: 'Vikings' },
    { homeTeam: 'Buccaneers', awayTeam: 'Chiefs' }
];

document.addEventListener("DOMContentLoaded", () => {
    const housePicksTableBody = document.getElementById("housePicksTable").getElementsByTagName("tbody")[0];

    // Reference to house picks data in Firebase
    const housePicksRef = ref(db, "housePicks");

    get(housePicksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((userSnapshot) => {
                    const userId = userSnapshot.key;  // The user ID
                    const userPicks = userSnapshot.val();  // The picks data for this user

                    // Loop through each game and display the user's pick
                    for (const gameIndex in userPicks) {
                        const pickData = userPicks[gameIndex];
                        const row = housePicksTableBody.insertRow();

                        row.innerHTML = `
                            <td>${userId}</td>
                            <td>${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}</td>
                            <td>${pickData.team}</td>
                            <td>${pickData.points || "N/A"}</td>
                        `;
                    }
                });
            } else {
                console.log("No house picks found.");
            }
        })
        .catch((error) => {
            console.error("Error fetching house picks:", error);
        });
});

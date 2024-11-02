import { db, ref, get } from './firebaseConfig.js';

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

    if (!housePicksTableBody) {
        console.error("housePicksTable not found in the DOM.");
        return;
    }

    // Reference to house picks data in Firebase
    const housePicksRef = ref(db, "housePicks");

    // Fetch data from Firebase
    get(housePicksRef)
        .then((snapshot) => {
            console.log("Snapshot exists:", snapshot.exists());  // Check if data exists in Firebase
            if (snapshot.exists()) {
                snapshot.forEach((userSnapshot) => {
                    const userId = userSnapshot.key;  // The user ID
                    const userPicks = userSnapshot.val();  // The picks data for this user
                    console.log("User ID:", userId);  // Log user ID
                    console.log("User Picks:", userPicks);  // Log the picks data for this user

                    // Loop through each game and display the user's pick
                    for (const gameIndex in userPicks) {
                        const pickData = userPicks[gameIndex];
                        console.log(`Game Index: ${gameIndex}, Pick Data:`, pickData);  // Log each game's pick data

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
                console.log("No house picks found.");  // Log if no data is found in Firebase
            }
        })
        .catch((error) => {
            console.error("Error fetching house picks:", error);  // Log any error encountered during data retrieval
        });
});

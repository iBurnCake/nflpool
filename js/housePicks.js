import { db, ref, get, child } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", () => {
    const housePicksTableBody = document.getElementById("housePicksTable").getElementsByTagName("tbody")[0];

    const housePicksRef = ref(db, "housePicks");

    get(housePicksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach((userSnapshot) => {
                    const userId = userSnapshot.key;
                    const userPicks = userSnapshot.val();

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

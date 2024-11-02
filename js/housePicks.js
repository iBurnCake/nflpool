import { db, get, ref, child } from "./firebaseConfig.js";

document.addEventListener("DOMContentLoaded", () => {
    loadHousePicks();
});

function loadHousePicks() {
    const housePicksContainer = document.getElementById("housePicksContainer");
    housePicksContainer.innerHTML = ""; // Clear previous content

    // Fetch house picks data from Firebase
    get(child(ref(db), "housePicks")).then((snapshot) => {
        if (snapshot.exists()) {
            const picksData = snapshot.val();
            for (const userId in picksData) {
                const userPicks = picksData[userId];
                displayUserPicks(userId, userPicks);
            }
        } else {
            console.log("No house picks data available.");
        }
    }).catch((error) => {
        console.error("Error fetching house picks:", error);
    });
}

function displayUserPicks(userId, picks) {
    const housePicksContainer = document.getElementById("housePicksContainer");

    // Create container for each user's picks
    const userContainer = document.createElement("div");
    userContainer.classList.add("user-picks-container");

    // Retrieve user's email based on userId
    get(child(ref(db), `users/${userId}/email`)).then((snapshot) => {
        const userEmail = snapshot.exists() ? snapshot.val() : "Unknown User";
        const userHeader = document.createElement("h3");
        userHeader.classList.add("user-header");
        userHeader.textContent = `User: ${userEmail}`;
        userContainer.appendChild(userHeader);

        // Create table for the user's picks
        const userTable = document.createElement("table");
        userTable.classList.add("user-picks-table");

        // Table headers
        userTable.innerHTML = `
            <thead>
                <tr>
                    <th>Matchup</th>
                    <th>Pick</th>
                    <th>Confidence Points</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(picks).map((gameIndex) => {
                    const { team, points } = picks[gameIndex];
                    return `
                        <tr>
                            <td>N/A</td>
                            <td>${team || "N/A"}</td>
                            <td>${points || "N/A"}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        `;

        userContainer.appendChild(userTable);
        housePicksContainer.appendChild(userContainer);
    }).catch((error) => {
        console.error(`Error fetching email for user ${userId}:`, error);
    });
}

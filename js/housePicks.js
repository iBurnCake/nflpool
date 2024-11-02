import { db } from './firebaseConfig.js';
import { get, ref } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";

// Manually map each user ID to an email
const userEmailMap = {
    "7INNhg6p0gVa3KK5nEmJ811Z4sf1": "ckegan437@gmail.com",
    "I3RfB1et3bhADFKRQbx3EU6yIll3": "ryansanders603@hotmail.com",
    "fqG1Oo9ZozX2Sa6mipdnYZl4ntb2": "luke.romano2004@gmail.com"
    // Add more mappings as needed
};

document.addEventListener("DOMContentLoaded", () => {
    displayHousePicks();
});

async function displayHousePicks() {
    const housePicksRef = ref(db, 'housePicks');
    const snapshot = await get(housePicksRef);

    if (snapshot.exists()) {
        const container = document.createElement("div");
        container.classList.add("house-picks-container");
        
        for (const userId in snapshot.val()) {
            const userPicks = snapshot.val()[userId].picks;
            const email = userEmailMap[userId] || "Unknown User"; // Get email from map or default

            const userPicksContainer = document.createElement("div");
            userPicksContainer.classList.add("user-picks-container");

            const userHeader = document.createElement("div");
            userHeader.classList.add("user-header");
            userHeader.textContent = `User: ${email}`;

            const table = document.createElement("table");
            table.classList.add("user-picks-table");

            const thead = document.createElement("thead");
            thead.innerHTML = `
                <tr>
                    <th>Matchup</th>
                    <th>Pick</th>
                    <th>Confidence Points</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement("tbody");
            for (const gameIndex in userPicks) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>N/A</td>
                    <td>${userPicks[gameIndex].team || "N/A"}</td>
                    <td>${userPicks[gameIndex].points || "N/A"}</td>
                `;
                tbody.appendChild(row);
            }
            table.appendChild(tbody);

            userPicksContainer.appendChild(userHeader);
            userPicksContainer.appendChild(table);
            container.appendChild(userPicksContainer);
        }

        document.body.appendChild(container);
    } else {
        console.log("No house picks available.");
    }
}

import { db, auth } from './firebaseConfig.js';
import { get, ref } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-database.js";
import { getAuth, getUser } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";

// Initialize authentication if not done in firebaseConfig
const auth = getAuth();

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
            const email = await fetchUserEmail(userId); // Retrieve email by UID

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

// Helper function to fetch email by UID
async function fetchUserEmail(userId) {
    try {
        const user = await getUser(auth, userId); // Retrieve the user info by UID
        return user.email; // Return the email
    } catch (error) {
        console.error(`Failed to fetch email for user ID ${userId}:`, error);
        return "Unknown User"; // Fallback in case of error
    }
}

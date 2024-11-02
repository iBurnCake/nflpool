import { db, ref, get, child, auth } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", fetchHousePicks);

function fetchHousePicks() {
    const housePicksContainer = document.getElementById("housePicksContainer");
    housePicksContainer.innerHTML = ''; // Clear previous data

    get(child(ref(db), 'housePicks')).then(snapshot => {
        if (snapshot.exists()) {
            snapshot.forEach(userSnapshot => {
                const userId = userSnapshot.key;
                const userPicks = userSnapshot.val();

                // Create a wrapper for each user's picks
                const userDiv = document.createElement('div');
                userDiv.classList.add('user-picks-wrapper');

                // Fetch the user's email to display
                fetchUserEmail(userId).then(email => {
                    // Add the email as the title for the user’s table
                    const userTitle = document.createElement('h2');
                    userTitle.textContent = email;
                    userDiv.appendChild(userTitle);

                    // Create a mini table for each user
                    const userTable = document.createElement('table');
                    userTable.classList.add('user-picks-table');

                    // Add table headers
                    userTable.innerHTML = `
                        <thead>
                            <tr>
                                <th>Matchup</th>
                                <th>Pick</th>
                                <th>Confidence Points</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    const tableBody = userTable.querySelector('tbody');

                    // Populate table with the user's picks
                    for (const gameIndex in userPicks) {
                        const pick = userPicks[gameIndex];
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${pick.matchup || 'N/A'}</td>
                            <td>${pick.team || 'N/A'}</td>
                            <td>${pick.points || 'N/A'}</td>
                        `;
                        tableBody.appendChild(row);
                    }

                    userDiv.appendChild(userTable);
                    housePicksContainer.appendChild(userDiv);
                });
            });
        } else {
            housePicksContainer.innerHTML = "<p>No picks available.</p>";
        }
    }).catch(error => {
        console.error("Error fetching house picks:", error);
    });
}

// Helper function to fetch user email by UID
function fetchUserEmail(userId) {
    return get(child(ref(db, `users/${userId}/email`)))
        .then(snapshot => {
            return snapshot.exists() ? snapshot.val() : 'Unknown User';
        })
        .catch(error => {
            console.error("Error fetching user email:", error);
            return 'Unknown User';
        });
}

import { db, ref, get, child } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    
    // Reference to the housePicks data in Firebase
    const housePicksRef = ref(db, 'housePicks');

    // Fetch the data
    get(housePicksRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                
                // Clear existing content
                housePicksContainer.innerHTML = '';

                // Loop through each user’s data
                for (const userId in picksData) {
                    const userPicks = picksData[userId];
                    createUserPicksTable(userId, userPicks);
                }
            } else {
                housePicksContainer.innerHTML = '<p>No picks available.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading house picks:', error);
            housePicksContainer.innerHTML = '<p>Error loading picks. Please try again later.</p>';
        });
}

// Function to create a mini-table for each user
function createUserPicksTable(userId, userPicks) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    
    // Create a container div for each user
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    // Add a header with the user ID (or replace with a user-friendly name if available)
    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `User: ${userId}`;
    userContainer.appendChild(userHeader);

    // Create the user's mini-table
    const table = document.createElement('table');
    table.classList.add('user-picks-table');

    // Table headers
    table.innerHTML = `
        <thead>
            <tr>
                <th>Matchup</th>
                <th>Pick</th>
                <th>Confidence Points</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    // Populate the table with user's picks
    const tbody = table.querySelector('tbody');
    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pickData.matchup || 'N/A'}</td>
            <td>${pickData.team || 'N/A'}</td>
            <td>${pickData.points || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    }

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

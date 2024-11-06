// Import Firebase configuration and necessary functions
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHousePicks();
});

// Define the matchup map for Week 10
const matchupMap = {
    0: { home: 'Bengals', away: 'Ravens' },
    1: { home: 'Giants', away: 'Panthers' },
    2: { home: 'Patriots', away: 'Bears' },
    3: { home: '49ers', away: 'Buccaneers' },
    4: { home: 'Broncos', away: 'Chiefs' },
    5: { home: 'Bills', away: 'Colts' },
    6: { home: 'Steelers', away: 'Commanders' },
    7: { home: 'Vikings', away: 'Jaguars' },
    8: { home: 'Falcons', away: 'Saints' },
    9: { home: 'Titans', away: 'Chargers' },
    10: { home: 'Jets', away: 'Cardinals' },
    11: { home: 'Eagles', away: 'Cowboys' },
    12: { home: 'Lions', away: 'Texans' },
    13: { home: 'Dolphins', away: 'Rams' }
};

// Load House Picks for Week 10 based on users' email addresses
function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const housePicksRef = ref(db, 'housePicks/week10'); // Ensure this path is correct

    console.log("Fetching House Picks data for Week 10...");

    get(housePicksRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML = '';

                for (const userEmail in picksData) {
                    const userPicks = picksData[userEmail].picks;
                    const totalScore = picksData[userEmail].totalScore || 0;

                    console.log(`User Email: ${userEmail}, Total Score: ${totalScore}`);
                    
                    // Use email as the identifier in the display
                    createUserPicksTable(userEmail, userPicks, totalScore);
                }
            } else {
                housePicksContainer.innerHTML = '<p>No picks available.</p>';
                console.log("No picks available in database.");
            }
        })
        .catch(error => {
            console.error('Error loading house picks:', error);
            housePicksContainer.innerHTML = '<p>Error loading picks. Please try again later.</p>';
        });
}

// Create user-specific table with picks, total score, result, and points earned
function createUserPicksTable(userEmail, userPicks, totalScore) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `User: ${userEmail} - Total Score: `;

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = totalScore;

    userHeader.appendChild(scoreSpan);
    userContainer.appendChild(userHeader);

    const table = document.createElement('table');
    table.classList.add('user-picks-table');

    table.innerHTML = `
        <thead>
            <tr>
                <th>Matchup</th>
                <th>Pick</th>
                <th>Confidence Points</th>
                <th>Result</th>
                <th>Points Earned</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const matchup = `${matchupMap[gameIndex].home} vs ${matchupMap[gameIndex].away}`;
        const pickedTeam = pickData.team;
        const confidencePoints = pickData.points || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${matchup}</td>
            <td>${pickedTeam}</td>
            <td>${confidencePoints}</td>
            <td>Pending</td> <!-- Display "Pending" until results are available -->
            <td>Pending</td> <!-- Display "Pending" until points are calculated -->
        `;

        tbody.appendChild(row);
    }

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

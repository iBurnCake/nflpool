// Import Firebase configuration and necessary functions
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHousePicks();
});

// Define the matchup map for Week 10
const matchupMapWeek10 = {
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

// Load House Picks for Week 10 and display each user with their email
function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    housePicksContainer.innerHTML = ''; // Clear previous content

    // Reference to Week 10 data
    const week10Ref = ref(db, 'housePicks/week10');

    get(week10Ref)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                console.log("Fetched data:", picksData); // Debugging log to see fetched data
                housePicksContainer.innerHTML += '<h2>Week 10 Picks</h2>'; // Section header for Week 10
                
                for (const userEmail in picksData) {
                    const userPicks = picksData[userEmail].picks;
                    const totalScore = picksData[userEmail].totalScore || 0;
                    console.log(`User Email: ${userEmail}`, userPicks); // Debugging log for each user’s data
                    createUserPicksTable(userEmail, userPicks, totalScore, 'Week 10', matchupMapWeek10);
                }
            } else {
                housePicksContainer.innerHTML += '<p>No picks available for Week 10.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading Week 10 picks:', error);
        });
}

// Create user-specific table with picks, total score, result, and points earned
function createUserPicksTable(userEmail, userPicks, totalScore, weekLabel, matchupMap) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `${weekLabel} - User Email: ${userEmail} - Total Score: ${totalScore}`;

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
        // Ensure we're only iterating over numeric keys (game picks) and not totalScore
        if (!isNaN(gameIndex)) {
            const pickData = userPicks[gameIndex];
            const matchup = `${matchupMap[gameIndex].home} vs ${matchupMap[gameIndex].away}`;
            const pickedTeam = pickData.team || "N/A";
            const confidencePoints = pickData.points || 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matchup}</td>
                <td>${pickedTeam}</td>
                <td>${confidencePoints}</td>
                <td>N/A</td> <!-- Result is "N/A" since the game hasn't been played -->
                <td>N/A</td> <!-- Points Earned is "N/A" as no points have been calculated -->
            `;

            tbody.appendChild(row);
        }
    }

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

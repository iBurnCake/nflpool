// Import Firebase configuration and necessary functions
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHousePicks();
});

// Define the matchup maps for both weeks
const matchupMapWeek9 = {
    0: { home: 'Texans', away: 'Jets' },
    1: { home: 'Saints', away: 'Panthers' },
    2: { home: 'Commanders', away: 'Giants' },
    3: { home: 'Dolphins', away: 'Bills' },
    4: { home: 'Chargers', away: 'Browns' },
    5: { home: 'Patriots', away: 'Titans' },
    6: { home: 'Cowboys', away: 'Falcons' },
    7: { home: 'Raiders', away: 'Bengals' },
    8: { home: 'Broncos', away: 'Ravens' },
    9: { home: 'Bears', away: 'Cardinals' },
    10: { home: 'Jaguars', away: 'Eagles' },
    11: { home: 'Rams', away: 'Seahawks' },
    12: { home: 'Packers', away: 'Lions' },
    13: { home: 'Colts', away: 'Vikings' },
    14: { home: 'Chiefs', away: 'Buccaneers' }
};

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

// Load House Picks for both Week 9 and Week 10
function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    housePicksContainer.innerHTML = ''; // Clear previous content

    // Fetch both Week 9 and Week 10 data
    const week9Ref = ref(db, 'housePicks/week9');
    const week10Ref = ref(db, 'housePicks/week10');

    // Fetch and display data for Week 9
    get(week9Ref)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML += '<h2>Week 9 Picks</h2>'; // Section header for Week 9
                for (const userEmail in picksData) {
                    const userPicks = picksData[userEmail].picks;
                    const totalScore = picksData[userEmail].totalScore || 0;
                    createUserPicksTable(userEmail, userPicks, totalScore, 'Week 9', matchupMapWeek9);
                }
            } else {
                housePicksContainer.innerHTML += '<p>No picks available for Week 9.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading Week 9 picks:', error);
        });

    // Fetch and display data for Week 10
    get(week10Ref)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML += '<h2>Week 10 Picks</h2>'; // Section header for Week 10
                for (const userEmail in picksData) {
                    const userPicks = picksData[userEmail].picks;
                    const totalScore = picksData[userEmail].totalScore || 0;
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
    userHeader.textContent = `${weekLabel} - User: ${userEmail} - Total Score: ${totalScore}`;

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

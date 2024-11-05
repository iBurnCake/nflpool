import { db, ref, set, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    loadHousePicks();
});

// Define the matchup map
const matchupMap = {
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

// Map of winning teams for each game
const gameWinners = {
    0: 'Jets',
    1: 'Panthers',
    2: 'Commanders',
    3: 'Bills',
    4: 'Chargers',
    5: 'Titans',
    6: 'Falcons',
    7: 'Bengals',
    8: 'Ravens',
    9: 'Cardinals',
    10: 'Eagles',
    11: 'Rams',
    12: 'Lions',
    13: 'Vikings',
    14: 'Chiefs'
};

// Map user IDs to names
function getUserNameById(userId) {
    const userMap = {
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant',
        'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano',
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis'
    };
    return userMap[userId];
}

// Load each user's picks and total score
function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const housePicksRef = ref(db, 'housePicks');

    get(housePicksRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML = '';

                for (const userId in picksData) {
                    const userPicks = picksData[userId].picks;
                    const userName = getUserNameById(userId);
                    const totalScore = picksData[userId].totalScore || 0;
                    createUserPicksTable(userName, userPicks, totalScore, userId);
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

// Create user-specific table with picks, total score, result, and points earned
function createUserPicksTable(userName, userPicks, totalScore, userId) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `User: ${userName} - Total Score: `;

    const scoreSpan = document.createElement('span');
    scoreSpan.id = `totalScore-${userId}`;
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

    let userTotalScore = 0; // Calculate total score based on correct picks

    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const matchup = `${matchupMap[gameIndex].home} vs ${matchupMap[gameIndex].away}`;
        const pickedTeam = pickData.team;
        const confidencePoints = pickData.points || 0;
        const gameWinner = gameWinners[gameIndex];
        const isCorrectPick = pickedTeam === gameWinner;
        const pointsEarned = isCorrectPick ? confidencePoints : 0;

        if (isCorrectPick) {
            userTotalScore += pointsEarned;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${matchup}</td>
            <td>${pickedTeam}</td>
            <td>${confidencePoints}</td>
            <td class="${isCorrectPick ? 'correct' : 'incorrect'}">${isCorrectPick ? 'Win' : 'Loss'}</td>
            <td>${pointsEarned}</td>
        `;

        tbody.appendChild(row);
    }

    // Update the displayed total score
    scoreSpan.textContent = userTotalScore;

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}
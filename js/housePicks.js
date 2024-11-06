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

// If applicable, update the winning teams map for Week 


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
    const housePicksRef = ref(db, 'housePicks/week10');

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

import { db, ref, set, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    loadCentralGameTable();
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

// Load central game table for selecting winners
function loadCentralGameTable() {
    const centralGameTableContainer = document.getElementById('centralGameTableContainer');
    const table = document.createElement('table');
    table.classList.add('central-game-table');

    table.innerHTML = `
        <thead>
            <tr>
                <th>Matchup</th>
                <th>Winner</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    for (const gameIndex in matchupMap) {
        const matchup = matchupMap[gameIndex];

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${matchup.home} vs ${matchup.away}</td>
            <td>
                <select id="winner-${gameIndex}">
                    <option value="">Select Winner</option>
                    <option value="${matchup.home}">${matchup.home}</option>
                    <option value="${matchup.away}">${matchup.away}</option>
                </select>
            </td>
            <td>
                <button onclick="updateGameResult('${gameIndex}')">Set Winner</button>
            </td>
        `;
        tbody.appendChild(row);
    }

    centralGameTableContainer.appendChild(table);
}

// Update game result and calculate user scores
window.updateGameResult = function (gameIndex) {
    const selectedWinner = document.getElementById(`winner-${gameIndex}`).value;
    if (!selectedWinner) {
        alert("Please select a winner before setting the result.");
        return;
    }

    // Save the selected winner in Firebase
    set(ref(db, `gameResults/${gameIndex}/winner`), selectedWinner)
        .then(() => {
            alert(`Winner for game ${gameIndex} set to ${selectedWinner}.`);
            calculateUserScores();
        })
        .catch(error => {
            console.error('Error setting game winner:', error);
        });
};

// Calculate user scores based on selected winners
function calculateUserScores() {
    const housePicksRef = ref(db, 'housePicks');
    const gameResultsRef = ref(db, 'gameResults');

    get(gameResultsRef)
        .then(gameResultsSnapshot => {
            if (!gameResultsSnapshot.exists()) return;

            const gameResults = gameResultsSnapshot.val();

            get(housePicksRef).then(housePicksSnapshot => {
                if (!housePicksSnapshot.exists()) return;

                const usersData = housePicksSnapshot.val();

                for (const userId in usersData) {
                    const userPicks = usersData[userId].picks;
                    let totalScore = 0;

                    for (const gameIndex in userPicks) {
                        const pickData = userPicks[gameIndex];
                        const pickedTeam = pickData.team;
                        const confidencePoints = pickData.points;
                        const gameResult = gameResults[gameIndex]?.winner;

                        if (gameResult && pickedTeam === gameResult) {
                            totalScore += confidencePoints;
                        }
                    }

                    // Update user's score in Firebase and the UI
                    set(ref(db, `housePicks/${userId}/totalScore`), totalScore)
                        .then(() => {
                            updateUserTableScore(userId, totalScore);
                        })
                        .catch(error => {
                            console.error(`Error updating score for user ${userId}:`, error);
                        });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching game results:', error);
        });
}

// Update user table with the calculated total score
function updateUserTableScore(userId, score) {
    const userScoreElement = document.getElementById(`totalScore-${userId}`);
    if (userScoreElement) {
        userScoreElement.textContent = score;
    }
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

// Create user-specific table with picks and total score display
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
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const matchup = matchupMap[gameIndex];
        const teamName = pickData.team;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${matchup.home} vs ${matchup.away}</td>
            <td>${teamName}</td>
            <td>${pickData.points || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    }

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

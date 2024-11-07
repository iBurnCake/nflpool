import { db, ref, get, update } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

// Week 10 game data
const games = [
    { homeTeam: 'Bengals', awayTeam: 'Ravens', homeRecord: '4-5', awayRecord: '6-3' },
    { homeTeam: 'Giants', awayTeam: 'Panthers', homeRecord: '2-7', awayRecord: '2-7' },
    { homeTeam: 'Patriots', awayTeam: 'Bears', homeRecord: '2-7', awayRecord: '4-4' },
    { homeTeam: '49ers', awayTeam: 'Buccaneers', homeRecord: '4-4', awayRecord: '4-5' },
    { homeTeam: 'Broncos', awayTeam: 'Chiefs', homeRecord: '5-4', awayRecord: '8-0' },
    { homeTeam: 'Bills', awayTeam: 'Colts', homeRecord: '7-2', awayRecord: '4-5' },
    { homeTeam: 'Steelers', awayTeam: 'Commanders', homeRecord: '6-2', awayRecord: '7-2' },
    { homeTeam: 'Vikings', awayTeam: 'Jaguars', homeRecord: '6-2', awayRecord: '2-7' },
    { homeTeam: 'Falcons', awayTeam: 'Saints', homeRecord: '6-3', awayRecord: '2-7' },
    { homeTeam: 'Titans', awayTeam: 'Chargers', homeRecord: '2-6', awayRecord: '5-3' },
    { homeTeam: 'Jets', awayTeam: 'Cardinals', homeRecord: '3-6', awayRecord: '5-4' },
    { homeTeam: 'Eagles', awayTeam: 'Cowboys', homeRecord: '6-2', awayRecord: '3-5' },
    { homeTeam: 'Lions', awayTeam: 'Texans', homeRecord: '7-1', awayRecord: '6-3' },
    { homeTeam: 'Dolphins', awayTeam: 'Rams', homeRecord: '2-6', awayRecord: '4-4' }
];

function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const week10Ref = ref(db, 'scoreboards/week9');

    get(week10Ref)
        .then(snapshot => {
            console.log(snapshot.val());
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML = '';

                for (const userId in picksData) {
                    const userPicksData = picksData[userId];
                    const userName = getUserName(userId);
                    
                    createUserPicksTable(userName, userPicksData);
                }
            } else {
                housePicksContainer.innerHTML = '<p>No picks available for Week 10.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading house picks:', error);
            housePicksContainer.innerHTML = '<p>Error loading picks. Please try again later.</p>';
        });
}

function getUserName(userId) {
    const userMap = {
        'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano',
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant',
        '67khUuKYmhXxRumUjMpyoDbnq0s2': 'Thomas Romano',
        'JIdq2bYVCZgdAeC0y6P69puNQz43': 'Tony Romano',
        '9PyTK0SHv7YKv7AYw5OV29dwH5q2': 'Emily Rossini',
        'ORxFtuY13VfaUqc2ckcfw084Lxq1': 'Aunt Vicki',
        'FIKVjOy8P7UTUGqq2WvjkARZPIE2': 'Tommy Kant'
    };
    return userMap[userId] || userId;
}

function createUserPicksTable(userName, userPicks) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `${userName}`;
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
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    let totalScore = 0;
    const tbody = table.querySelector('tbody');

    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const game = games[gameIndex];
        const resultText = pickData.result || 'N/A';

        const chosenTeam = pickData.team || 'N/A';
        const confidencePoints = pickData.points || 'N/A';

        const matchup = `${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${matchup}</td>
            <td>${chosenTeam}</td>
            <td>${confidencePoints}</td>
            <td>${resultText}</td>
        `;
        tbody.appendChild(row);

        // Add points to total score if result is a win
        if (resultText === 'win') {
            totalScore += confidencePoints;
        }
    }

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="3" style="font-weight: bold; text-align: right;">Total Score:</td>
        <td>${totalScore}</td>
    `;
    tbody.appendChild(totalRow);

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

// Function to update game results in the database
function updateGameResults(gameIndex, winningTeam) {
    const week9Ref = ref(db, 'scoreboards/week9');

    get(week9Ref).then(snapshot => {
        if (snapshot.exists()) {
            const picksData = snapshot.val();

            // Iterate through each user and check if their pick matches the winning team
            for (const userId in picksData) {
                const userPicks = picksData[userId];
                const userGamePick = userPicks[gameIndex];

                // Set the result for the specific game
                if (userGamePick) {
                    const result = userGamePick.team === winningTeam ? 'win' : 'lose';
                    userGamePick.result = result;
                }
            }

            // Update all users' picks in the database with the new result data
            update(week9Ref, picksData)
                .then(() => {
                    console.log("Game results updated successfully.");
                    loadHousePicks(); // Reload data to reflect updated scores
                })
                .catch(error => {
                    console.error("Error updating game results:", error);
                });
        } else {
            console.log("No picks data available to update.");
        }
    }).catch(error => {
        console.error("Error retrieving picks data:", error);
    });
}

// Call updateGameResults with the Ravens as the winners for the first game
updateGameResults(0, 'Ravens');

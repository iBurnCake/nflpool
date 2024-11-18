import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

// Week 11 game data
const games = [
    { homeTeam: 'Commanders', awayTeam: 'Eagles', homeRecord: '7-3', awayRecord: '7-2' },
    { homeTeam: 'Raiders', awayTeam: 'Dolphins', homeRecord: '2-7', awayRecord: '3-6' },
    { homeTeam: 'Browns', awayTeam: 'Saints', homeRecord: '2-7', awayRecord: '3-7' },
    { homeTeam: 'Colts', awayTeam: 'Jets', homeRecord: '4-6', awayRecord: '3-7' },
    { homeTeam: 'Vikings', awayTeam: 'Titans', homeRecord: '7-2', awayRecord: '2-7' },
    { homeTeam: 'Packers', awayTeam: 'Bears', homeRecord: '6-3', awayRecord: '4-5' },
    { homeTeam: 'Jaguars', awayTeam: 'Lions', homeRecord: '2-8', awayRecord: '8-1' },
    { homeTeam: 'Rams', awayTeam: 'Patriots', homeRecord: '4-5', awayRecord: '3-7' },
    { homeTeam: 'Ravens', awayTeam: 'Steelers', homeRecord: '7-3', awayRecord: '7-2' },
    { homeTeam: 'Seahawks', awayTeam: '49ers', homeRecord: '4-5', awayRecord: '5-4' },
    { homeTeam: 'Falcons', awayTeam: 'Broncos', homeRecord: '6-4', awayRecord: '5-5' },
    { homeTeam: 'Chiefs', awayTeam: 'Bills', homeRecord: '9-0', awayRecord: '8-2' },
    { homeTeam: 'Bengals', awayTeam: 'Chargers', homeRecord: '4-6', awayRecord: '6-3' },
    { homeTeam: 'Texans', awayTeam: 'Cowboys', homeRecord: '6-4', awayRecord: '3-6' }
];

// No game winners decided yet
const gameWinners = {
    0: 'Eagles', 
    1: 'Dolphins', 
    2: 'Saints', 
    3: 'Colts', 
    4: 'Vikings', 
    5: 'Packers', 
    6: 'Lions', 
    7: 'Rams', 
    8: 'Steelers', 
    9: 'Seahawks', 
    10: 'Broncos', 
    11: '', 
    12: '', 
    13: '', 
};

function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const week9Ref = ref(db, 'scoreboards/week9');
    const userScores = [];

    get(week9Ref)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML = '';

                console.log("Picks data loaded:", picksData); // Debugging log

                // Collect and calculate total scores
                for (const userId in picksData) {
                    const userPicksData = picksData[userId];
                    const userName = getUserName(userId);
                    const totalScore = calculateTotalScore(userPicksData);

                    userScores.push({ userId, userName, totalScore });
                }

                // Sort by total score (highest to lowest)
                userScores.sort((a, b) => b.totalScore - a.totalScore);

                // Display the leaderboard
                createLeaderboardTable(userScores, housePicksContainer);

                // Display each user's table
                userScores.forEach(user => {
                    const userPicksData = picksData[user.userId];
                    createUserPicksTable(user.userName, userPicksData, user.totalScore);
                });
            } else {
                housePicksContainer.innerHTML = '<p>No picks available for Week 11.</p>';
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

function calculateTotalScore(userPicks) {
    let totalScore = 0;
    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        if (!pickData) continue; // Skip if pickData is missing
        const chosenTeam = pickData.team;
        const confidencePoints = pickData.points || 0;
        const gameWinner = gameWinners[gameIndex];
        if (chosenTeam === gameWinner) {
            totalScore += confidencePoints;
        }
    }
    return totalScore;
}

function createLeaderboardTable(userScores, container) {
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.classList.add('user-picks-container');

    const leaderboardHeader = document.createElement('h3');
    leaderboardHeader.classList.add('user-header');
    leaderboardHeader.textContent = 'Leaderboard';

    leaderboardContainer.appendChild(leaderboardHeader);

    const table = document.createElement('table');
    table.classList.add('user-picks-table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Total Score</th>
            </tr>
        </thead>
        <tbody>
            ${userScores.map((user, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${user.userName}</td>
                    <td>${user.totalScore}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    leaderboardContainer.appendChild(table);
    container.appendChild(leaderboardContainer);
}

function createUserPicksTable(userName, userPicks, totalScore) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `${userName} - Total Score: ${totalScore}`;
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
        const game = games[gameIndex];

        if (!game) {
            console.warn(`Missing game data for index: ${gameIndex}`);
            continue;
        }

        const matchup = `${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})`;
        const chosenTeam = pickData.team || 'N/A';
        const confidencePoints = pickData.points || 0;

        const gameWinner = gameWinners[gameIndex];
        const isCorrectPick = gameWinner && chosenTeam === gameWinner;
        const pointsEarned = isCorrectPick ? confidencePoints : 0;

        const resultText = gameWinner
            ? (isCorrectPick ? 'Win' : 'Loss')
            : 'N/A';
        const resultClass = gameWinner ? (isCorrectPick ? 'correct' : 'incorrect') : 'neutral';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${matchup}</td>
            <td>${chosenTeam}</td>
            <td>${confidencePoints}</td>
            <td class="${resultClass}">${resultText}</td>
            <td>${pointsEarned}</td>
        `;

        tbody.appendChild(row);
    }

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="3" style="font-weight: bold; text-align: right;">Total Score:</td>
        <td colspan="2">${totalScore}</td>
    `;
    tbody.appendChild(totalRow);

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

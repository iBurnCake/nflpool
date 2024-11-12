import { db, ref, get } from './firebaseConfig.js';

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

const gameWinners = {
    0: 'Ravens', 
    1: 'Panthers', 
    2: 'Patriots', 
    3: '49ers', 
    4: 'Chiefs', 
    5: 'Bills', 
    6: 'Steelers', 
    7: 'Vikings', 
    8: 'Saints', 
    9: 'Chargers', 
    10: 'Cardinals', 
    11: 'Eagles', 
    12: 'Lions', 
    13: 'Dolphins', 
};

function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const week10Ref = ref(db, 'scoreboards/week9');
    const userScores = [];

    get(week10Ref)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML = '';

                // Collect and calculate total scores
                for (const userId in picksData) {
                    const userPicksData = picksData[userId];
                    const userName = getUserName(userId);
                    const totalScore = calculateTotalScore(userPicksData);

                    userScores.push({ userId, userName, totalScore });
                }

                // Sort by total score (highest to lowest)
                userScores.sort((a, b) => b.totalScore - a.totalScore);

                // Display the leaderboards
                createLeaderboards(userScores, housePicksContainer);

                // Display each user's table
                userScores.forEach(user => {
                    const userPicksData = picksData[user.userId];
                    createUserPicksTable(user.userName, userPicksData, user.totalScore);
                });
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

function calculateTotalScore(userPicks) {
    let totalScore = 0;
    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const chosenTeam = pickData.team;
        const confidencePoints = pickData.points || 0;
        const gameWinner = gameWinners[gameIndex];
        if (chosenTeam === gameWinner) {
            totalScore += confidencePoints;
        }
    }
    return totalScore;
}

function createLeaderboards(userScores, container) {
    // Weekly Leaderboard
    const weeklyLeaderboardContainer = document.createElement('div');
    weeklyLeaderboardContainer.classList.add('user-picks-container');
    weeklyLeaderboardContainer.id = 'weeklyLeaderboardContainer';

    const weeklyHeader = document.createElement('h3');
    weeklyHeader.classList.add('user-header');
    weeklyHeader.textContent = 'Weekly Leaderboard';
    weeklyLeaderboardContainer.appendChild(weeklyHeader);

    const weeklyTable = document.createElement('table');
    weeklyTable.classList.add('user-picks-table');
    weeklyTable.innerHTML = `
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
    weeklyLeaderboardContainer.appendChild(weeklyTable);

    // Overall Leaderboard
    const overallLeaderboardContainer = document.createElement('div');
    overallLeaderboardContainer.classList.add('user-picks-container');
    overallLeaderboardContainer.id = 'overallLeaderboardContainer';

    const overallHeader = document.createElement('h3');
    overallHeader.classList.add('user-header');
    overallHeader.textContent = 'Overall Leaderboard';
    overallLeaderboardContainer.appendChild(overallHeader);

    const overallTable = document.createElement('table');
    overallTable.classList.add('user-picks-table');
    overallTable.innerHTML = `
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
    overallLeaderboardContainer.appendChild(overallTable);

    // Append both leaderboards to the main container
    container.appendChild(weeklyLeaderboardContainer);
    container.appendChild(overallLeaderboardContainer);
}

function createUserPicksTable(userName, userPicks, totalScore) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    // Add user's name and total score
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

import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

// Week 11 games
const games = [
    { homeTeam: 'Steelers', awayTeam: 'Browns', homeRecord: '8-2', awayRecord: '2-8' },
    { homeTeam: 'Titans', awayTeam: 'Texans', homeRecord: '2-8', awayRecord: '7-4' },
    { homeTeam: 'Vikings', awayTeam: 'Bears', homeRecord: '8-2', awayRecord: '4-6' },
    { homeTeam: 'Cowboys', awayTeam: 'Commanders', homeRecord: '3-7', awayRecord: '7-4' },
    { homeTeam: 'Patriots', awayTeam: 'Dolphins', homeRecord: '3-8', awayRecord: '4-6' },
    { homeTeam: 'Chiefs', awayTeam: 'Panthers', homeRecord: '9-1', awayRecord: '3-7' },
    { homeTeam: 'Buccaneers', awayTeam: 'Giants', homeRecord: '4-6', awayRecord: '2-8' },
    { homeTeam: 'Lions', awayTeam: 'Colts', homeRecord: '9-1', awayRecord: '5-6' },
    { homeTeam: 'Broncos', awayTeam: 'Raiders', homeRecord: '6-5', awayRecord: '2-8' },
    { homeTeam: 'Cardinals', awayTeam: 'Seahawks', homeRecord: '6-4', awayRecord: '5-5' },
    { homeTeam: '49ers', awayTeam: 'Packers', homeRecord: '5-5', awayRecord: '7-3' },
    { homeTeam: 'Eagles', awayTeam: 'Rams', homeRecord: '8-2', awayRecord: '5-5' },
    { homeTeam: 'Ravens', awayTeam: 'Chargers', homeRecord: '7-4', awayRecord: '7-3' },
];

const gameWinners = {
    0: '',
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
    7: '',
    8: '',
    9: '',
    10: '',
    11: '',
    12: '',
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

                console.log('Picks data loaded:', picksData); // Debugging log

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
                    createUserPicksTable(user.userId, user.userName, userPicksData, user.totalScore);
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
       'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano $',
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan $',
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders $',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant $',
        '67khUuKYmhXxRumUjMpyoDbnq0s2': 'Thomas Romano',
        'JIdq2bYVCZgdAeC0y6P69puNQz43': 'Tony Romano',
        '9PyTK0SHv7YKv7AYw5OV29dwH5q2': 'Emily Rossini',
        'ORxFtuY13VfaUqc2ckcfw084Lxq1': 'Aunt Vicki',
        'FIKVjOy8P7UTUGqq2WvjkARZPIE2': 'Tommy Kant',
        'FFIWPuZYzYRI2ibmVbVHDIq1mjj2': 'De Von',
        'i6s97ZqeN1YCM39Sjqh65VablvA3': 'Kyra Kafel'
    };
    return userMap[userId] || `User ${userId}`;
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

function createUserPicksTable(userId, userName, userPicks, totalScore) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `${userName} - Total Score: ${totalScore}`;
    userContainer.appendChild(userHeader);

    // Fetch and apply username color
    const userColorRef = ref(db, `users/${userId}/usernameColor`);
    get(userColorRef).then(snapshot => {
        if (snapshot.exists()) {
            userHeader.style.color = snapshot.val();
        }
    }).catch(error => {
        console.error('Error fetching user color:', error);
    });

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

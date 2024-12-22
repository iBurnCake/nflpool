
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

// week 15 games
const games = [
    { homeTeam: 'Chargers', awayTeam: 'Broncos', homeRecord: '8-6', awayRecord: '9-5' },
    { homeTeam: 'Chiefs', awayTeam: 'Texans', homeRecord: '13-1', awayRecord: '9-5' },
    { homeTeam: 'Ravens', awayTeam: 'Steelers', homeRecord: '9-5', awayRecord: '10-4' },
    { homeTeam: 'Falcons', awayTeam: 'Giants', homeRecord: '7-7', awayRecord: '2-12' },
    { homeTeam: 'Bears', awayTeam: 'Lions', homeRecord: '4-10', awayRecord: '12-2' },
    { homeTeam: 'Colts', awayTeam: 'Titans', homeRecord: '6-8', awayRecord: '3-11' },
    { homeTeam: 'Bengals', awayTeam: 'Browns', homeRecord: '6-8', awayRecord: '3-11' },
    { homeTeam: 'Panthers', awayTeam: 'Cardinals', homeRecord: '3-11', awayRecord: '7-7' },
    { homeTeam: 'Commanders', awayTeam: 'Eagles', homeRecord: '9-5', awayRecord: '12-2' },
    { homeTeam: 'Jets', awayTeam: 'Rams', homeRecord: '4-10', awayRecord: '8-6' },
    { homeTeam: 'Seahawks', awayTeam: 'Vikings', homeRecord: '8-6', awayRecord: '12-2' },
    { homeTeam: 'Raiders', awayTeam: 'Jaguars', homeRecord: '2-12', awayRecord: '3-11' },
    { homeTeam: 'Bills', awayTeam: 'Patriots', homeRecord: '11-3', awayRecord: '3-11' },
    { homeTeam: 'Dolphins', awayTeam: '49ers', homeRecord: '6-8', awayRecord: '6-8' },
    { homeTeam: 'Cowboys', awayTeam: 'Buccaneers', homeRecord: '6-8', awayRecord: '8-6' },
    { homeTeam: 'Packers', awayTeam: 'Saints', homeRecord: '10-4', awayRecord: '5-9' }
];


const gameWinners = {
    0: 'Chargers', // Chargers or Broncos
    1: 'Chiefs', // Cheifs or Texans
    2: 'Ravens', // Ravens or Steelers
    3: 'Falcons', // Falcons or Giants
    4: 'Lions', // Bears or Lions
    5: 'Colts', // Colts or Titans
    6: 'Bengals', // Bengals or Browns
    7: '', // Panthers or Cardinals
    8: '', // Commanders or Eagles
    9: 'Rams', // Jets or Rams
    10: '', // Seahawks or Vikings
    11: '', // Raiders or Jaguars
    12: '', // Bills or Patriots
    13: '', // Dolphins or 49ers
    14: '', // Cowboys or Buccaneers
    15: '' // Packers or Saints
};

function loadHousePicks() {
    fetchUserColors((userColors) => {
        const housePicksContainer = document.getElementById('housePicksContainer');
        const week9Ref = ref(db, 'scoreboards/week9');
        const userScores = [];

        get(week9Ref)
            .then(snapshot => {
                if (snapshot.exists()) {
                    const picksData = snapshot.val();
                    housePicksContainer.innerHTML = '';

                    console.log("Picks data loaded:", picksData);

                    for (const userId in picksData) {
                        const userPicksData = picksData[userId];
                        const userName = getUserName(userId);
                        const totalScore = calculateTotalScore(userPicksData);

                        userScores.push({ userId, userName, totalScore });
                    }

                    userScores.sort((a, b) => b.totalScore - a.totalScore);

                    createLeaderboardTable(userScores, housePicksContainer, userColors);

                    userScores.forEach(user => {
                        const userPicksData = picksData[user.userId];
                        createUserPicksTable(user.userName, userPicksData, user.totalScore, userColors[user.userId]);
                    });
                } else {
                    housePicksContainer.innerHTML = '<p>No picks submitted for Week 15.</p>';
                }
            })
            .catch(error => {
                console.error('Error loading house picks:', error);
                housePicksContainer.innerHTML = '<p>Error loading picks. Please try again later.</p>';
            });
    });
}

function fetchUserColors(callback) {
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const userColors = {};
            for (const userId in usersData) {
                if (usersData[userId].usernameColor) {
                    userColors[userId] = usersData[userId].usernameColor;
                }
            }
            callback(userColors);
        } else {
            console.warn('No users data found for username colors.');
            callback({});
        }
    }).catch((error) => {
        console.error('Error fetching user colors:', error);
        callback({});
    });
}

function getUserName(userId) {
    const userMap = {
        'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano $',
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders $',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant $',
        '67khUuKYmhXxRumUjMpyoDbnq0s2': 'Thomas Romano',
        'JIdq2bYVCZgdAeC0y6P69puNQz43': 'Tony Romano',
        '9PyTK0SHv7YKv7AYw5OV29dwH5q2': 'Emily Rossini',
        'ORxFtuY13VfaUqc2ckcfw084Lxq1': 'Aunt Vicki',
        'FIKVjOy8P7UTUGqq2WvjkARZPIE2': 'Tommy Kant',
        'FFIWPuZYzYRI2ibmVbVHDIq1mjj2': 'De Von $',
        'i6s97ZqeN1YCM39Sjqh65VablvA3': 'Kyra (bum) Kafel $',
        'ICenzfFJ8CPauw1lCK1eq3Yr4hG3': 'Raul Sanjay $'
    };
    return userMap[userId] || `User ${userId}`;
}

function calculateTotalScore(userPicks) {
    let totalScore = 0;
    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        if (!pickData) continue;
        const chosenTeam = pickData.team;
        const confidencePoints = pickData.points || 0;
        const gameWinner = gameWinners[gameIndex];
        if (chosenTeam === gameWinner) {
            totalScore += confidencePoints;
        }
    }
    return totalScore;
}

function createLeaderboardTable(userScores, container, userColors) {
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
                    <td style="color: ${userColors[user.userId] ? userColors[user.userId] : 'inherit'};">
                        ${user.userName}
                    </td>
                    <td>${user.totalScore}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    leaderboardContainer.appendChild(table);
    container.appendChild(leaderboardContainer);
}


function createUserPicksTable(userName, userPicks, totalScore, userColor) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `${userName} - Total Score: ${totalScore}`;
    userHeader.style.color = userColor || 'inherit';
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

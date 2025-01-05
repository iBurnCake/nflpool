
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    loadHousePicks();
});
// week 16 games
const games = [
    { homeTeam: 'Ravens', awayTeam: 'Browns', homeRecord: '11-5', awayRecord: '3-13' },
    { homeTeam: 'Steelers', awayTeam: 'Bengals', homeRecord: '10-6', awayRecord: '8-6' },
    { homeTeam: 'Falcons', awayTeam: 'Panthers', homeRecord: '8-8', awayRecord: '4-12' },
    { homeTeam: 'Titans', awayTeam: 'Texans', homeRecord: '3-13', awayRecord: '9-7' },
    { homeTeam: 'Eagles', awayTeam: 'Giants', homeRecord: '13-3', awayRecord: '3-13' },
    { homeTeam: 'Colts', awayTeam: 'Jaguars', homeRecord: '7-9', awayRecord: '4-12' },
    { homeTeam: 'Cowboys', awayTeam: 'Commanders', homeRecord: '7-9', awayRecord: '11-5' },
    { homeTeam: 'Packers', awayTeam: 'Bears', homeRecord: '11-5', awayRecord: '4-12' },
    { homeTeam: 'Buccaneers', awayTeam: 'Saints', homeRecord: '9-7', awayRecord: '5-11' },
    { homeTeam: 'Patriots', awayTeam: 'Bills', homeRecord: '3-13', awayRecord: '13-3' },
    { homeTeam: 'Raiders', awayTeam: 'Chargers', homeRecord: '4-12', awayRecord: '10-6' },
    { homeTeam: 'Cardinals', awayTeam: '49ers', homeRecord: '7-9', awayRecord: '6-10' },
    { homeTeam: 'Broncos', awayTeam: 'Chiefs', homeRecord: '9-7', awayRecord: '15-1' },
    { homeTeam: 'Rams', awayTeam: 'Seahawks', homeRecord: '10-6', awayRecord: '9-7' },
    { homeTeam: 'Jets', awayTeam: 'Dolphins', homeRecord: '4-12', awayRecord: '8-8' },
    { homeTeam: 'Lions', awayTeam: 'Vikings', homeRecord: '14-2', awayRecord: '14-2' }
];


const gameWinners = {
    0: 'Ravens', // Ravens or Browns
    1: 'Bengals', // Steelers or Bengals
    2: 'Panthers', // Falcons or Panthers
    3: 'Texans', // Titans or Texans
    4: 'Eagles', // Eagles or Giants
    5: 'Colts', // Colts or Jaguars
    6: 'Commanders', // Cowboys or Commanders
    7: 'Bears', // Packers or Bears
    8: 'Buccaneers', // Buccaneers or Saints
    9: 'Patriots', // Patriots or Bills
    10: '', // Raiders or Chargers
    11: '', // Cardinals or 49ers
    12: '', // Broncos or Chiefs
    13: '', // Rams or Seahawks
    14: '', // Jets or Dolphins
    15: '' // Lions or Vikings
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

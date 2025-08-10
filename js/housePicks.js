
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    loadHousePicks();
});

const games = [
    { homeTeam: 'Ravens', awayTeam: 'Colts', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Eagles', awayTeam: 'Bengals', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Seahawks', awayTeam: 'Raiders', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Falcons', awayTeam: 'Lions', homeRecord: '0-0', awayRecord: '0-1' },
    { homeTeam: 'Panthers', awayTeam: 'Browns', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Patriots', awayTeam: 'Commanders', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Bills', awayTeam: 'Giants', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Vikings', awayTeam: 'Texans', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Jaguars', awayTeam: 'Steelers', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Rams', awayTeam: 'Cowboys', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Buccaneers', awayTeam: 'Titans', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Cardinals', awayTeam: 'Chiefs', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Packers', awayTeam: 'Jets', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: '49ers', awayTeam: 'Broncos', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Bears', awayTeam: 'Dolphins', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Chargers', awayTeam: 'Saints', homeRecord: '1-0', awayRecord: '0-0' }
];


const gameWinners = {
    0: 'Ravens', // Ravens or Colts
    1: 'Eagles', // Eagles or Bengals
    2: '', // Seahawks or Raiders
    3: 'Lions', // Falcons or Lions
    4: 'Browns', // Panthers or Browns
    5: 'Patriots', // Patriots or Commanders
    6: 'Giants', // Bills or Giants
    7: 'Vikings', // Vikings or Texans
    8: '', // Jaguars or Steelers
    9: '', // Rams or Cowboys
    10: '', // Buccaneers or Titans
    11: '', // Cardinals or Chiefs
    12: '', // Packers or Jets
    13: '', // 49ers or Broncos
    14: '', // Bears or Dolphins
    15: ''  // Chargers or Saints
};

function loadHousePicks() {
    fetchUserData((userDataMap) => {
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

                        userScores.push({
                            userId,
                            userName,
                            totalScore,
                            profilePic: userDataMap[userId]?.profilePic || 'images/NFL LOGOS/nfl-logo.jpg',
                            usernameColor: userDataMap[userId]?.usernameColor || '#FFD700'
                        });
                    }

                    userScores.sort((a, b) => b.totalScore - a.totalScore);

                    createLeaderboardTable(userScores, housePicksContainer);

                    userScores.forEach(user => {
                        const userPicksData = picksData[user.userId];
                        createUserPicksTable(
                            user.userName,
                            userPicksData,
                            user.totalScore,
                            user.usernameColor,
                            user.profilePic
                        );
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

function fetchUserData(callback) {
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const userDataMap = {};
            for (const userId in usersData) {
                userDataMap[userId] = {
                    usernameColor: usersData[userId].usernameColor || '#FFD700',
                    profilePic: usersData[userId].profilePic || 'images/NFL LOGOS/nfl-logo.jpg'
                };
            }
            callback(userDataMap);
        } else {
            console.warn('No users data found.');
            callback({});
        }
    }).catch((error) => {
        console.error('Error fetching user data:', error);
        callback({});
    });
}

function getUserName(userId) {
    const userMap = {
        'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano',
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
        'zZ8DblY3KQgPP9bthG87l7DNAux2': 'Ryan Sanders',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '67khUuKYmhXxRumUjMpyoDbnq0s2': 'Thomas Romano',
        'JIdq2bYVCZgdAeC0y6P69puNQz43': 'Tony Romano',
        '9PyTK0SHv7YKv7AYw5OV29dwH5q2': 'Emily Rossini',
        'ORxFtuY13VfaUqc2ckcfw084Lxq1': 'Aunt Vicki',
        'FIKVjOy8P7UTUGqq2WvjkARZPIE2': 'Tommy Kant',
        'FFIWPuZYzYRI2ibmVbVHDIq1mjj2': 'De Von ',
        'i6s97ZqeN1YCM39Sjqh65VablvA3': 'Kyra Kafel ',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant',
        'gsQAQttBoEOSu4v1qVVqmHxAqsO2': 'Nick Kier',
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
                   <td style="color: ${user.usernameColor};">
    <div class="leaderboard-user">
        <img src="${user.profilePic}" alt="${user.userName}">
        <span class="leaderboard-username">${user.userName}</span>
    </div>
</td>
                    <td>${user.totalScore}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    leaderboardContainer.appendChild(table);
    container.appendChild(leaderboardContainer);
}


function createUserPicksTable(userName, userPicks, totalScore, userColor, profilePic) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.innerHTML = `
        <img src="${profilePic}" alt="${userName}" style="width:32px; height:32px; border-radius:50%; vertical-align:middle; margin-right:8px;">
        <span style="color: ${userColor};">${userName}</span> - Total Score: ${totalScore}
    `;
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

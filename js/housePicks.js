
import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    loadHousePicks();
});
// week 1 games
const games = [
    { homeTeam: 'Eagles', awayTeam: 'Cowboys', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Chargers', awayTeam: 'Chiefs', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Colts', awayTeam: 'Dolphins', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Jets', awayTeam: 'Steelers', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Jaguars', awayTeam: 'Panthers', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Saints', awayTeam: 'Cardinals', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Commanders', awayTeam: 'Giants', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Falcons', awayTeam: 'Buccaneers', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Browns', awayTeam: 'Bengals', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Patriots', awayTeam: 'Raiders', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Seahawks', awayTeam: '49ers', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Broncos', awayTeam: 'Titans', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Packers', awayTeam: 'Lions', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Rams', awayTeam: 'Texans', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Bills', awayTeam: 'Ravens', homeRecord: '0-0', awayRecord: '0-0' },
    { homeTeam: 'Bears', awayTeam: 'Vikings', homeRecord: '0-0', awayRecord: '0-0' }
];


const gameWinners = {
    0: '', // Eagles or Cowboys
    1: '', // Chargers or Chiefs
    2: '', // Colts or Dolphins
    3: '', // Jets or Steelers
    4: '', // Jaguars or Panthers
    5: '', // Saints or Cardinals
    6: '', // Commanders or Giants
    7: '', // Falcons or Buccaneers
    8: '', // Browns or Bengals
    9: '', // Patriots or Raiders
    10: '', // Seahawks or 49ers
    11: '', // Broncos or Titans
    12: '', // Packers or Lions
    13: '', // Rams or Texans
    14: '', // Bills or Ravens
    15: ''  // Bears or Vikings
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
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '67khUuKYmhXxRumUjMpyoDbnq0s2': 'Thomas Romano',
        'JIdq2bYVCZgdAeC0y6P69puNQz43': 'Tony Romano',
        '9PyTK0SHv7YKv7AYw5OV29dwH5q2': 'Emily Rossini',
        'ORxFtuY13VfaUqc2ckcfw084Lxq1': 'Aunt Vicki',
        'FIKVjOy8P7UTUGqq2WvjkARZPIE2': 'Tommy Kant',
        'FFIWPuZYzYRI2ibmVbVHDIq1mjj2': 'De Von ',
        'i6s97ZqeN1YCM39Sjqh65VablvA3': 'Kyra Kafel ',
        'ICenzfFJ8CPauw1lCK1eq3Yr4hG3': 'Raul Sanjay',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant'
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
                    <td style="color: ${userColors[user.userId] || 'inherit'};">
                        <div class="leaderboard-user">
                            <img src="${user.profilePic}" alt="Profile">
                            ${user.userName}
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
    userHeader.innerHTML = `<img src="${profilePic}" alt="Profile"> ${userName} - Total Score: ${totalScore}`;
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
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const game = games[gameIndex];
        if (!game) continue;

        const matchup = `${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})`;
        const chosenTeam = pickData.team || 'N/A';
        const confidencePoints = pickData.points || 0;

        const gameWinner = gameWinners[gameIndex];
        const isCorrectPick = gameWinner && chosenTeam === gameWinner;
        const pointsEarned = isCorrectPick ? confidencePoints : 0;

        const resultText = gameWinner ? (isCorrectPick ? 'Win' : 'Loss') : 'N/A';
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

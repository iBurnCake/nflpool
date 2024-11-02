import { db, ref, get, child } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

// Fixed game data for Week 9
const games = [
    { homeTeam: 'Texans', awayTeam: 'Jets', homeRecord: '6-2', awayRecord: '2-6' },
    { homeTeam: 'Saints', awayTeam: 'Panthers', homeRecord: '2-6', awayRecord: '1-7' },
    { homeTeam: 'Commanders', awayTeam: 'Giants', homeRecord: '6-2', awayRecord: '2-6' },
    { homeTeam: 'Dolphins', awayTeam: 'Bills', homeRecord: '2-5', awayRecord: '6-2' },
    { homeTeam: 'Chargers', awayTeam: 'Browns', homeRecord: '4-3', awayRecord: '2-6' },
    { homeTeam: 'Patriots', awayTeam: 'Titans', homeRecord: '2-6', awayRecord: '1-6' },
    { homeTeam: 'Cowboys', awayTeam: 'Falcons', homeRecord: '3-4', awayRecord: '5-3' },
    { homeTeam: 'Raiders', awayTeam: 'Bengals', homeRecord: '2-6', awayRecord: '3-5' },
    { homeTeam: 'Broncos', awayTeam: 'Ravens', homeRecord: '5-3', awayRecord: '5-3' },
    { homeTeam: 'Bears', awayTeam: 'Cardinals', homeRecord: '4-3', awayRecord: '4-4' },
    { homeTeam: 'Jaguars', awayTeam: 'Eagles', homeRecord: '2-6', awayRecord: '5-2' },
    { homeTeam: 'Rams', awayTeam: 'Seahawks', homeRecord: '3-4', awayRecord: '4-4' },
    { homeTeam: 'Lions', awayTeam: 'Packers', homeRecord: '6-1', awayRecord: '6-2' },
    { homeTeam: 'Colts', awayTeam: 'Vikings', homeRecord: '4-4', awayRecord: '5-2' },
    { homeTeam: 'Buccaneers', awayTeam: 'Chiefs', homeRecord: '4-4', awayRecord: '7-0' }
];

// Game results for Week 9 (use "home" or "away" to denote the winner)
const results = [
    "home", "away", "home", "away", "away", 
    "home", "home", "away", "home", "home", 
    "away", "away", "home", "away", "away"
];

function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const housePicksRef = ref(db, 'housePicks');

    get(housePicksRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();
                housePicksContainer.innerHTML = '';

                for (const userId in picksData) {
                    const userPicks = picksData[userId];
                    const userName = getUserName(userId);
                    createUserPicksTable(userName, userPicks);
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

function getUserName(userId) {
    const userMap = {
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant',
        'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano'
    };
    return userMap[userId] || userId;
}

function createUserPicksTable(userName, userPicks) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `User: ${userName}`;
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
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    let totalScore = 0;

    for (const gameIndex in userPicks) {
        const pickData = userPicks[gameIndex];
        const game = games[gameIndex];
        const result = results[gameIndex];

        let chosenTeam = 'N/A';
        let opposingTeam = 'N/A';
        let isCorrect = false;

        if (pickData.team === 'home') {
            chosenTeam = game.homeTeam;
            opposingTeam = game.awayTeam;
            isCorrect = result === 'home';
        } else if (pickData.team === 'away') {
            chosenTeam = game.awayTeam;
            opposingTeam = game.homeTeam;
            isCorrect = result === 'away';
        }

        if (isCorrect) {
            totalScore += pickData.points || 0;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${opposingTeam} vs ${chosenTeam}</td>
            <td>${chosenTeam}</td>
            <td>${pickData.points || 'N/A'}</td>
            <td>${isCorrect ? 'Correct' : 'Incorrect'}</td>
        `;
        row.classList.add(isCorrect ? 'correct' : 'incorrect');
        tbody.appendChild(row);
    }

    const scoreRow = document.createElement('tr');
    scoreRow.innerHTML = `
        <td colspan="3" style="text-align: right; font-weight: bold;">Total Score:</td>
        <td>${totalScore}</td>
    `;
    tbody.appendChild(scoreRow);

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

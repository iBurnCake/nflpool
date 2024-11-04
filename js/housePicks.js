import { db, ref, set, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

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

function getUserIdByName(userName) {
    const userMap = {
        'Angela Kant': '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2',
        'Charles Keegan': '7INNhg6p0gVa3KK5nEmJ811Z4sf1',
        'Ryan Sanders': 'I3RfB1et3bhADFKRQbx3EU6yllI3',
        'William Mathis': 'krvPcOneIcYrzc2GfIHXfsvbrD23',
        'Luke Romano': 'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2'
    };
    return userMap[userName];
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
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    if (userPicks && typeof userPicks === 'object') {
        for (const gameIndex in userPicks) {
            const pickData = userPicks[gameIndex];
            const matchup = matchupMap[gameIndex] || { home: 'N/A', away: 'N/A' };
            const teamName = pickData.team === 'home' ? matchup.home : matchup.away;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${matchup.home} vs ${matchup.away}</td>
                <td>${teamName}</td>
                <td>${pickData.points || 'N/A'}</td>
                <td id="result-${gameIndex}-${userName}">${pickData.result || 'N/A'}</td>
                <td>
                    <button onclick="manualUpdateResult('${gameIndex}', '${userName}')">Update Result</button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } else {
        console.warn(`No picks found for user: ${userName}`);
    }

    userContainer.appendChild(table);
    housePicksContainer.appendChild(userContainer);
}

window.manualUpdateResult = function (matchupIndex, userName) {
    // Get the Firebase user ID based on the name
    const userId = getUserIdByName(userName);

    // Verify if the user ID exists
    if (!userId) {
        console.warn(`No user ID found for user: ${userName}`);
        alert("Invalid user specified.");
        return;
    }

    // Log the userId to ensure we're accessing the correct Firebase path
    console.log(`Resolved userId for ${userName}: ${userId}`);

    // Get the matchup info
    const matchup = matchupMap[matchupIndex];
    const result = prompt(`Enter the winning team (${matchup.home} or ${matchup.away}):`);

    // Validate if the entered result matches the home or away team
    if (result && (result === matchup.home || result === matchup.away)) {
        // Construct the path to the user's pick in Firebase
        const userPickRef = ref(db, `housePicks/${userId}/picks/${matchupIndex}`);

        // Log the constructed path to debug
        console.log(`Attempting to access path: housePicks/${userId}/picks/${matchupIndex}`);

        // Fetch the user's pick data to determine if the result is correct
        get(userPickRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userPickData = snapshot.val();

                // Log fetched data for debugging
                console.log(`Fetched pick data for ${userName}:`, userPickData);

                // Check if user's pick matches the winning team
                const isCorrect = userPickData.team === result;
                const resultStatus = isCorrect ? 'Correct' : 'Incorrect';

                // Update Firebase with the result
                set(ref(db, `housePicks/${userId}/picks/${matchupIndex}/result`), resultStatus)
                    .then(() => {
                        alert("Result updated successfully.");
                        const resultElement = document.getElementById(`result-${matchupIndex}-${userName}`);
                        if (resultElement) {
                            resultElement.innerText = resultStatus;
                        }
                    })
                    .catch(error => {
                        console.error('Error updating result:', error);
                    });
            } else {
                console.warn(`No pick data found at the specified path: housePicks/${userId}/picks/${matchupIndex}`);
                alert("No pick data found for this user and matchup.");
            }
        }).catch(error => {
            console.error('Error fetching user pick:', error);
        });
    } else {
        alert(`Invalid input. Please enter either "${matchup.home}" or "${matchup.away}".`);
    }
};

import { db, ref, set, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadHousePicks);

function loadHousePicks() {
    const housePicksContainer = document.getElementById('housePicksContainer');
    
    // Reference to the housePicks data in Firebase
    const housePicksRef = ref(db, 'housePicks');

    // Fetch the data
    get(housePicksRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const picksData = snapshot.val();

                // Clear existing content
                housePicksContainer.innerHTML = '';

                // Loop through each user’s data
                for (const userId in picksData) {
                    const userPicks = picksData[userId].picks; // Ensure we’re accessing the `picks` object correctly
                    const userName = getUserName(userId); // Get user-friendly name if available
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

// Function to map user IDs to display names
function getUserName(userId) {
    const userMap = {
        '7INNhg6p0gVa3KK5nEmJ811Z4sf1': 'Charles Keegan',
        'I3RfB1et3bhADFKRQbx3EU6yllI3': 'Ryan Sanders',
        'krvPcOneIcYrzc2GfIHXfsvbrD23': 'William Mathis',
        '0A2Cs9yZSRSU3iwnTyNQi3MbQdq2': 'Angela Kant',
        'fqG1Oo9ZozX2Sa6mipdnYZI4ntb2': 'Luke Romano'
    };
    return userMap[userId] || userId; // Return name if found, else return userId
}

// Function to map matchup and position (home/away) to team names
function getTeamName(matchup, position) {
    const teamMap = {
        "Jets vs Texans": { home: "Jets", away: "Texans" },
        "Saints vs Panthers": { home: "Saints", away: "Panthers" },
        "Giants vs Commanders": { home: "Giants", away: "Commanders" },
        "Bills vs Dolphins": { home: "Bills", away: "Dolphins" },
        "Browns vs Chargers": { home: "Browns", away: "Chargers" },
        "Patriots vs Titans": { home: "Patriots", away: "Titans" },
        "Cowboys vs Falcons": { home: "Cowboys", away: "Falcons" },
        "Raiders vs Bengals": { home: "Raiders", away: "Bengals" },
        "Ravens vs Broncos": { home: "Ravens", away: "Broncos" },
        "Bears vs Cardinals": { home: "Bears", away: "Cardinals" },
        "Jaguars vs Eagles": { home: "Jaguars", away: "Eagles" },
        "Rams vs Seahawks": { home: "Rams", away: "Seahawks" },
        "Packers vs Lions": { home: "Packers", away: "Lions" },
        "Colts vs Vikings": { home: "Colts", away: "Vikings" },
        "Chiefs vs Buccaneers": { home: "Chiefs", away: "Buccaneers" }
    };

    return teamMap[matchup] ? teamMap[matchup][position] : position;
}

// Function to create a mini-table for each user
function createUserPicksTable(userName, userPicks) {
    const housePicksContainer = document.getElementById('housePicksContainer');
    
    // Create a container div for each user
    const userContainer = document.createElement('div');
    userContainer.classList.add('user-picks-container');

    // Add a header with the user's name or ID
    const userHeader = document.createElement('h3');
    userHeader.classList.add('user-header');
    userHeader.textContent = `User: ${userName}`;
    userContainer.appendChild(userHeader);

    // Create the user's mini-table
    const table = document.createElement('table');
    table.classList.add('user-picks-table');

    // Table headers
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

    // Populate the table with user's picks
    const tbody = table.querySelector('tbody');

    // Check if userPicks is defined and is an object
    if (userPicks && typeof userPicks === 'object') {
        for (const gameIndex in userPicks) {
            const pickData = userPicks[gameIndex];
            const teamName = getTeamName(pickData.matchup, pickData.team); // Get the correct team name
            
            // Create a safe ID for each result cell
            const matchupId = pickData.matchup ? pickData.matchup.replace(/\s+/g, '-') : 'unknown-matchup';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pickData.matchup || 'N/A'}</td>
                <td>${teamName || 'N/A'}</td>
                <td>${pickData.points || 'N/A'}</td>
                <td id="result-${matchupId}-${userName}">${pickData.result || 'N/A'}</td>
                <td>
                    <!-- Manual Update Button for each game -->
                    <button onclick="manualUpdateResult('${pickData.matchup || ''}', '${userName}')">Update Result</button>
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

// Function to manually update the result for each game
window.manualUpdateResult = function (matchup, userName) {
    const result = prompt(`Enter the winner for ${matchup} (home/away):`).toLowerCase();

    if (result === 'home' || result === 'away') {
        const matchupKey = matchup.replace(/\s+/g, '_'); // Replace spaces with underscores for Firebase keys
        const userRef = ref(db, `housePicks/${userName}/picks/${matchupKey}`);

        // Update the result in Firebase
        set(userRef, { result: result === 'home' ? 'Correct' : 'Incorrect' })
            .then(() => {
                alert(`Result updated successfully for ${matchup}.`);
                
                // Update the displayed result immediately
                const resultElement = document.getElementById(`result-${matchup.replace(/\s+/g, '-')}-${userName}`);
                if (resultElement) {
                    resultElement.innerText = result === 'home' ? 'Correct' : 'Incorrect';
                }
            })
            .catch(error => {
                console.error('Error updating result:', error);
            });
    } else {
        alert("Invalid input. Please enter 'home' or 'away'.");
    }
}

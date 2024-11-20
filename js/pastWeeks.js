import { db, ref, get } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', loadPastWeeksLeaderboard);

function loadPastWeeksLeaderboard() {
    const pastWeeksContainer = document.getElementById('pastWeeksContainer');
    const pastWeeksRef = ref(db, 'scoreboards/pastWeeks'); // Replace this path with the actual Firebase path for past weeks data
    const userScores = [];

    get(pastWeeksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const pastWeeksData = snapshot.val();
                pastWeeksContainer.innerHTML = ''; // Clear any existing content

                console.log("Past weeks data loaded:", pastWeeksData);

                for (const week in pastWeeksData) {
                    const weekData = pastWeeksData[week];
                    const weekContainer = document.createElement('div');
                    weekContainer.classList.add('week-container');

                    const weekTitle = document.createElement('h2');
                    weekTitle.textContent = `Week ${week}`;
                    weekContainer.appendChild(weekTitle);

                    const scores = [];

                    for (const userId in weekData) {
                        const userScore = weekData[userId].score;
                        const userName = getUserName(userId);
                        scores.push({ userName, score: userScore });
                    }

                    // Sort scores by descending order
                    scores.sort((a, b) => b.score - a.score);

                    // Create leaderboard for the week
                    const table = document.createElement('table');
                    table.classList.add('leaderboard-table');
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${scores.map((score, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${score.userName}</td>
                                    <td>${score.score}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    `;
                    weekContainer.appendChild(table);
                    pastWeeksContainer.appendChild(weekContainer);
                }
            } else {
                pastWeeksContainer.innerHTML = '<p>No data available for past weeks.</p>';
            }
        })
        .catch((error) => {
            console.error('Error loading past weeks data:', error);
            pastWeeksContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
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
    return userMap[userId] || userId;
}

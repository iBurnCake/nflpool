
document.addEventListener('DOMContentLoaded', loadPastWeeks);

function loadPastWeeks() {
    const pastWeeksContainer = document.getElementById('pastWeeksContainer');
    const pastWeeksData = [
          {
            week: 14,
            leaderboard: [
                { name: 'Thomas Romano', score: 79},
                { name: 'Tony Romano', score: 79},
                { name: 'Luke Romano', score: 78},
                { name: 'Angela Kant', score: 77},
                { name: 'Aunt Vicki', score: 77},
                { name: 'De Von', score: 76},
                { name: 'Ryan Sanders', score: 75},
                { name: 'Kyra Kafel', score: 74},
                { name: 'Tommy Kant', score: 71},
                { name: 'Rual Sanjay', score: 70},
                { name: 'Charles Keegan', score: 67},
            ]
        },  
        {
            week: 13,
            leaderboard: [
                { name: 'Tommy Kant', score: 136},
                { name: 'Kyra Kafel', score: 133},
                { name: 'Thomas Romano', score: 131},
                { name: 'Tony Romano', score: 131},
                { name: 'Aunt Vicki', score: 130},
                { name: 'Ryan Sanders', score: 129},
                { name: 'Charles Keegan', score: 126},
                { name: 'Emily Rossini', score: 126},
                { name: 'Rual Sanjay', score: 120},
                { name: 'Angela Kant', score: 119},
                { name: 'Luke Romano', score: 118},
            ]
        },  
        {
            week: 12,
            leaderboard: [
                { name: 'Kyra Kafel', score: 68},
                { name: 'Thomas Romano', score: 65},
                { name: 'Tony Romano', score: 61},
                { name: 'Ryan Sanders', score: 59},
                { name: 'De Von', score: 58},
                { name: 'Aunt Vicki', score: 58},
                { name: 'Charles Keegan', score: 56},
                { name: 'Tommy Kant', score: 56},
                { name: 'Angela Kant', score: 55},
                { name: 'Luke Romano', score: 53},
                { name: 'William Mathis', score: 32},
            ]
        },
        {
            week: 11,
            leaderboard: [
                { name: 'Ryan Sanders', score: 92 },
                { name: 'Aunt Vicki', score: 90 },
                { name: 'Angela Kant', score: 83 },
                { name: 'Tony Romano', score: 82 },
                { name: 'Luke Romano', score: 79 },
                { name: 'Emily Rossini', score: 79 },
                { name: 'Charles Keegan', score: 73 },
                { name: 'Tommy Kant', score: 73 },
                { name: 'Thomas Romano', score: 69 },
            ],
        },
        {
            week: 10,
            leaderboard: [
                { name: 'Tony Romano', score: 92 },
                { name: 'Luke Romano', score: 88 },
                { name: 'Emily Rossini', score: 82 },
                { name: 'Aunt Vicki', score: 81 },
                { name: 'Tommy Kant', score: 77 },
                { name: 'Ryan Sanders', score: 76 },
                { name: 'Charles Keegan', score: 76 },
                { name: 'Angela Kant', score: 72 },
                { name: 'Thomas Romano', score: 60 },
            ],
        },
        {
            week: 9,
            leaderboard: [
                { name: 'Ryan Sanders', score: 112 },
                { name: 'Luke Romano', score: 105 },
                { name: 'Charles Keegan', score: 93 },
                { name: 'William Mathis', score: 77},
                { name: 'Angela Kant', score: 71 },
            ],
        },
        {    
            week: 8,
            leaderboard: [
                { name: 'Charles Keegan', score: 111 },
                { name: 'Ryan Sanders', score: 102 },
                { name: 'William Mathis', score: 93 },
                { name: 'Angela Kant', score: 88 },
                { name: 'Luke Romano', score: 63 },
            ],
        },
        {
            week: 7,
            leaderboard: [
                { name: 'Luke Romano', score: 97 },
                { name: 'Charles Keegan', score: 96 },
                { name: 'Angela Kant', score: 91 },
                { name: 'Ryan Sanders', score: 76 },
                { name: 'Owen Doherty', score: 36 },
            ],
        },
        {
            week: 6,
            leaderboard: [
                { name: 'Luke Romano', score: 93 },
                { name: 'Ryan Sanders', score: 87 },
                { name: 'Charles Keegan', score: 85 },
                { name: 'Angela Kant', score: 71 },
            ],
        }
    ];
    
    pastWeeksData.forEach(weekData => {
        const weekSection = document.createElement('div');
        weekSection.classList.add('week-section');

        const weekHeader = document.createElement('h2');
        weekHeader.textContent = `Week ${weekData.week}`;
        weekSection.appendChild(weekHeader);

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
                ${weekData.leaderboard.map((entry, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${entry.name}</td>
                        <td>${entry.score}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        weekSection.appendChild(table);

        pastWeeksContainer.appendChild(weekSection);
    });
}

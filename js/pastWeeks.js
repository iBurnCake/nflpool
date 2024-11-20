document.addEventListener('DOMContentLoaded', loadPastWeeks);

function loadPastWeeks() {
    const pastWeeksContainer = document.getElementById('pastWeeksContainer');
    const pastWeeksData = [
    {
        week: 11,
        leaderboard: [
            { name: 'Ryan Sanders', score: 92 },
            { name: 'Aunt Vicki', score: 90 },
            { name: 'Angela Kant', score: 83 },
            { name: 'Tony Romano', score: 82 },
            { name: 'Luke Romano', score: 79 },
            { name: 'Emily Rossini', score: 79 },
            { name: 'Charles Keean', score: 73 },
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

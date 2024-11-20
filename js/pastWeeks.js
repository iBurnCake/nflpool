document.addEventListener('DOMContentLoaded', loadPastWeeks);

function loadPastWeeks() {
    const pastWeeksContainer = document.getElementById('pastWeeksContainer');
    const pastWeeksData = [
        {
            week: 9,
            leaderboard: [
                { name: 'Luke Romano', score: 120 },
                { name: 'Angela Kant', score: 110 },
                { name: 'Charles Keegan', score: 100 },
                { name: 'Ryan Sanders', score: 95 },
            ],
        },
        {
            week: 8,
            leaderboard: [
                { name: 'Angela Kant', score: 130 },
                { name: 'Ryan Sanders', score: 125 },
                { name: 'Charles Keegan', score: 115 },
                { name: 'Luke Romano', score: 110 },
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

document.addEventListener('DOMContentLoaded', loadPastWeeks);

function loadPastWeeks() {
    const pastWeeksContainer = document.getElementById('pastWeeksContainer');

    const pastWeeksData = [
        {
            week: 1,
            leaderboard: [
            ]
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
                ${weekData.leaderboard.length > 0 ? weekData.leaderboard.map((entry, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${entry.name}</td>
                        <td>${entry.score}</td>
                    </tr>
                `).join('') : `
                    <tr>
                        <td colspan="3" style="text-align:center;">No data yet</td>
                    </tr>
                `}
            </tbody>
        `;
        weekSection.appendChild(table);

        pastWeeksContainer.appendChild(weekSection);
    });
}

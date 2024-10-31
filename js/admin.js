import { db, ref, get, child } from './firebaseConfig.js';

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

document.addEventListener("DOMContentLoaded", loadAllLockedPicks);

function loadAllLockedPicks() {
    const picksRef = ref(db, 'scoreboards/week9');

    get(picksRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                displayLockedPicks(data);
            } else {
                console.log("No picks data available.");
            }
        })
        .catch((error) => {
            console.error("Error loading all picks:", error);
        });
}

function displayLockedPicks(data) {
    const tableBody = document.getElementById("lockedPicksTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // Clear existing data

    for (const userId in data) {
        const userData = data[userId];
        const picks = userData.picks;
        const locked = userData.locked;

        if (!locked) continue;

        for (const gameIndex in picks) {
            const pick = picks[gameIndex];
            const row = tableBody.insertRow();

            row.innerHTML = `
                <td>${userId}</td>
                <td>${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}</td>
                <td>${pick.team}</td>
                <td>${pick.points || 'N/A'}</td>
            `;
        }
    }
}

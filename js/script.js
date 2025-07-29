import { auth, db, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, ref, set, get, child, onAuthStateChanged } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.email);
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('userHomeSection').style.display = 'block';

            const displayName = getNameByEmail(user.email);
            document.getElementById('usernameDisplay').textContent = displayName;

            loadUsernameColor(user.uid); 
            displayGames();
            loadUserPicks(user.uid);
        } else {
            console.log("No user logged in");
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userHomeSection').style.display = 'none';
        }
    });

    const emailToNameMap = {
        "devonstankis3@gmail.com": "De Von",
        "kyrakafel@gmail.com": "Kyra Kafel",
        "tom.kant21@gmail.com": "Tommy Kant",
        "vickiocf@gmail.com": "Aunt Vicki",
        "erossini02@gmail.com": "Emily Rossini",
        "tony.romano222@gmail.com": "Tony Romano",
        "thomasromano19707@gmail.com": "Thomas Romano",
        "ckeegan437@gmail.com": "Charles Keegan",
        "ryansanders603@hotmail.com": "Ryan Sanders",
        "williammathis2004@gmail.com": "William Mathis",
        "angelakant007@gmail.com": "Angela Kant",
        "luke.romano2004@gmail.com": "Luke Romano",
        "rsanjay@udel.edu": "Raul Sanjay",
    };

    function getNameByEmail(email) {
        return emailToNameMap[email] || email; 
    }


// =======================
// GOOGLE LOGIN (with account linking)
// =======================
document.getElementById('googleLoginButton')?.addEventListener("click", () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Google login successful:", result.user.email);
            handleSuccessfulLogin(result.user);
        })
        .catch(async (error) => {
            console.error("Google login error:", error);

            if (error.code === 'auth/account-exists-with-different-credential') {
                const email = error.customData?.email;
                const pendingCred = error.credential;

                try {
                    // Get sign-in methods for this email
                    const methods = await fetchSignInMethodsForEmail(auth, email);

                    if (methods.includes('password')) {
                        // Ask user for password to link accounts
                        const password = prompt(`An account already exists for ${email}. Please enter your password to link Google login:`);
                        if (!password) {
                            alert("Linking cancelled.");
                            return;
                        }

                        // Sign in with email/password
                        const emailUser = await signInWithEmailAndPassword(auth, email, password);

                        // Link Google credential to this account
                        await linkWithCredential(emailUser.user, pendingCred);

                        console.log("Google account successfully linked to existing email/password account.");
                        handleSuccessfulLogin(emailUser.user);
                    } else {
                        alert(`Please log in using your existing method: ${methods.join(', ')}`);
                    }
                } catch (linkError) {
                    console.error("Error linking accounts:", linkError);
                    alert("Account linking failed. Please try logging in with your original method.");
                }
            } else {
                alert("Google login failed. Please try again.");
            }
        });
});

// Helper to handle showing the correct UI after login
function handleSuccessfulLogin(user) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('userHomeSection').style.display = 'block';

    const displayName = getNameByEmail(user.email);
    document.getElementById('usernameDisplay').textContent = displayName;

    loadUsernameColor(user.uid);
    displayGames();
    loadUserPicks(user.uid);
}



    document.getElementById('resetButton')?.addEventListener("click", resetPicks);
    document.getElementById('submitButton')?.addEventListener("click", submitPicks);
    document.getElementById('logoutButton')?.addEventListener("click", () => {
        auth.signOut().then(() => {
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('userHomeSection').style.display = 'none';
            alert("You have been logged out.");
        }).catch((error) => {
            console.error("Logout error:", error.message);
            alert("Error logging out. Please try again.");
        });
    });

    document.getElementById('pastWeeksButton')?.addEventListener("click", () => {
        window.location.href = 'pastWeeks.html';
    });
});

function loadUsernameColor(userId) {
    const colorRef = ref(db, `users/${userId}/usernameColor`);
    const usernameDisplay = document.getElementById("usernameDisplay");

    get(colorRef).then(snapshot => {
        if (snapshot.exists()) {
            const color = snapshot.val();
            usernameDisplay.style.color = color;
        }
    }).catch(error => {
        console.error("Error loading username color:", error);
    });

      const saveButton = document.getElementById("saveColorButton");
      const colorPicker = document.getElementById("usernameColorPicker");
  
      saveButton.addEventListener("click", () => {
          const selectedColor = colorPicker.value;
          set(colorRef, selectedColor)
              .then(() => {
                  usernameDisplay.style.color = selectedColor;
                  alert("Username color saved successfully!");
              })
              .catch(error => {
                  console.error("Error saving username color:", error);
                  alert("Failed to save username color. Please try again.");
              });
      });
  }

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

let userPicks = {};
let usedPoints = new Set();

function displayGames() {
    const tableBody = document.getElementById('gamesTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    games.forEach((game, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${game.homeTeam} (${game.homeRecord}) vs ${game.awayTeam} (${game.awayRecord})</td>
            <td>
                <button id="home-${index}" onclick="selectPick(${index}, 'home')">${game.homeTeam}</button>
                <button id="away-${index}" onclick="selectPick(${index}, 'away')">${game.awayTeam}</button>
            </td>
            <td>
                <select id="confidence${index}" onchange="assignConfidence(${index})" required></select>
                <span id="confidenceDisplay${index}" class="confidence-display"></span>
            </td>
        `;
        updateConfidenceDropdown(index);
    });
}

function updateConfidenceDropdown(gameIndex) {
    const dropdown = document.getElementById(`confidence${gameIndex}`);
    dropdown.innerHTML = '<option value="">Select</option>';

    for (let i = 1; i <= 16; i++) {
        if (!usedPoints.has(i)) {
            const option = document.createElement("option");
            option.value = i;
            option.text = i;
            dropdown.appendChild(option);
        }
    }
}

window.selectPick = function (gameIndex, team) {
    userPicks[gameIndex] = userPicks[gameIndex] || {};
    userPicks[gameIndex].team = team === 'home' ? games[gameIndex].homeTeam : games[gameIndex].awayTeam;

    const homeButton = document.getElementById(`home-${gameIndex}`);
    const awayButton = document.getElementById(`away-${gameIndex}`);
    
    if (team === 'home') {
        homeButton.classList.add("selected");
        awayButton.classList.remove("selected");
    } else {
        awayButton.classList.add("selected");
        homeButton.classList.remove("selected");
    }

    saveUserPicks(auth.currentUser.uid);
};

window.assignConfidence = function (gameIndex) {
    const confidenceSelect = document.getElementById(`confidence${gameIndex}`);
    const points = parseInt(confidenceSelect.value);
    const confidenceDisplay = document.getElementById(`confidenceDisplay${gameIndex}`);

    if (userPicks[gameIndex]?.points) {
        usedPoints.delete(userPicks[gameIndex].points);
    }

    if (points >= 1 && points <= 16 && !usedPoints.has(points)) {
        userPicks[gameIndex] = userPicks[gameIndex] || {};
        userPicks[gameIndex].points = points;
        usedPoints.add(points);

        confidenceDisplay.textContent = points;

        saveUserPicks(auth.currentUser.uid);
        games.forEach((_, i) => updateConfidenceDropdown(i));
    } else {
        confidenceSelect.value = "";
        confidenceDisplay.textContent = "";
    }
};

function saveUserPicks(userId) {
    console.log("Saving user picks for userId:", userId, userPicks);
    set(ref(db, `scoreboards/week9/${userId}`), userPicks)
        .then(() => console.log("Picks saved successfully!"))
        .catch(error => console.error("Error saving picks:", error));
}

function loadUserPicks(userId) {
    get(child(ref(db), `scoreboards/week9/${userId}`))
        .then(snapshot => {
            if (snapshot.exists()) {
                userPicks = snapshot.val();
                displayUserPicks(userPicks);
            }
        })
        .catch(error => console.error("Error loading picks:", error));
}

function displayUserPicks(picks) {
    for (const gameIndex in picks) {
        const pick = picks[gameIndex];
        const game = games[gameIndex];

        if (!game) continue;

        if (pick.team === game.homeTeam) {
            document.getElementById(`home-${gameIndex}`).classList.add("selected");
        } else if (pick.team === game.awayTeam) {
            document.getElementById(`away-${gameIndex}`).classList.add("selected");
        }

        if (pick.points) {
            usedPoints.add(pick.points);
            document.getElementById(`confidence${gameIndex}`).value = pick.points;
            document.getElementById(`confidenceDisplay${gameIndex}`).textContent = pick.points;
        }
    }

    games.forEach((_, i) => updateConfidenceDropdown(i));
}

window.resetPicks = function () {
    userPicks = {};
    usedPoints.clear();
    displayGames();
    saveUserPicks(auth.currentUser.uid);
};

window.submitPicks = function () {
    set(ref(db, `scoreboards/week9/${auth.currentUser.uid}`), userPicks)
        .then(() => {
            alert("Picks submitted successfully!");
            window.location.href = "housePicks.html";
        })
        .catch(error => {
            console.error("Error submitting picks:", error.message);
            alert("Error submitting picks. Please try again.");
        });
};


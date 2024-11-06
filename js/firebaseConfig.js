// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";


// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEIIp_7mw1lEJi2ySy8rbYI9zIGz1d2d8",
    authDomain: "nflpool-71337.firebaseapp.com",
    projectId: "nflpool-71337",
    storageBucket: "nflpool-71337.appspot.com",
    messagingSenderId: "2003523098",
    appId: "1:2003523098:web:713a9905761dabae7863a3",
    measurementId: "G-1EBF3DPND1",
    databaseURL: "https://nflpool-71337-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Export necessary items for other scripts to use
export { auth, db, onAuthStateChanged, signInWithEmailAndPassword, ref, set, get, child };

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, fetchSignInMethodsForEmail, linkWithCredential} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get, child, update, onValue, off } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, fetchSignInMethodsForEmail, linkWithCredential, ref, set, get, child, update, onValue, off };

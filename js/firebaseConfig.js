// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEIIp_7mw1lEJi2ySy8rbYI9zIGz1d2d8",
  authDomain: "nflpool-71337.firebaseapp.com",
  databaseURL: "https://nflpool-71337-default-rtdb.firebaseio.com",
  projectId: "nflpool-71337",
  storageBucket: "nflpool-71337.appspot.com",
  messagingSenderId: "2003523098",
  appId: "1:2003523098:web:713a9905761dabae7863a3",
  measurementId: "G-1EBF3DPND1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional)
const analytics = getAnalytics(app);

// Initialize Authentication and Database
export const auth = getAuth(app);
export const db = getDatabase(app);

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, ref, set } from './firebaseConfig.js';
import { auth, onAuthStateChanged } from './firebaseConfig.js'; // Assuming auth is initialized in firebaseConfig

document.addEventListener('DOMContentLoaded', () => {
    // Listen for user authentication state change
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('uploadForm').addEventListener('submit', (e) => uploadProfileImage(e, user.uid));
        } else {
            alert("You must be logged in to upload a profile image.");
            window.location.href = 'index.html'; // Redirect to login if not authenticated
        }
    });
});

async function uploadProfileImage(e, userId) {
    e.preventDefault();
    const file = document.getElementById('profileImage').files[0];

    if (file) {
        const storage = getStorage();
        const imageRef = storageRef(storage, `profileImages/${userId}`);

        try {
            // Upload the file to Firebase Storage
            await uploadBytes(imageRef, file);

            // Get the download URL and save it to the user's profile in Firebase
            const imageUrl = await getDownloadURL(imageRef);
            await set(ref(db, `users/${userId}/profileImage`), imageUrl);

            alert("Profile image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading profile image:", error);
            alert("Failed to upload profile image. Please try again.");
        }
    } else {
        alert("Please select a file to upload.");
    }
}

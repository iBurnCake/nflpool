import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, ref, set } from './firebaseConfig.js';
import { auth, onAuthStateChanged } from './firebaseConfig.js'; // Import auth functions

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('profileImage');
    const file = fileInput.files[0];

    // Check if a user is logged in and retrieve the user ID
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid; // Get logged-in user's ID

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
                    fileInput.value = ''; // Clear the input field

                    // Redirect or update the UI as needed
                    window.location.href = 'index.html'; // Redirect to home page
                } catch (error) {
                    console.error("Error uploading image:", error);
                    alert("Failed to upload image. Please try again.");
                }
            } else {
                alert("Please select a file.");
            }
        } else {
            alert("User not logged in. Please log in to upload a profile image.");
        }
    });
});

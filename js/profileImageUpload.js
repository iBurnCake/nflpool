import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { db, ref, set } from './firebaseConfig.js';
import { auth, onAuthStateChanged } from './firebaseConfig.js';

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('profileImage');
    const file = fileInput.files[0];

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid; // Get logged-in user's ID
            console.log("User ID:", userId);

            if (file) {
                console.log("File selected:", file.name);
                const storage = getStorage();
                const imageRef = storageRef(storage, `profileImages/${userId}`);

                try {
                    // Upload the file to Firebase Storage
                    console.log("Starting upload...");
                    await uploadBytes(imageRef, file);
                    console.log("Upload complete!");

                    // Get the download URL and save it to the user's profile in Firebase
                    const imageUrl = await getDownloadURL(imageRef);
                    console.log("Image URL:", imageUrl);
                    await set(ref(db, `users/${userId}/profileImage`), imageUrl);

                    alert("Profile image uploaded successfully!");
                    fileInput.value = ''; // Clear the input field

                    // Redirect to the main page
                    window.location.href = 'index.html';
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

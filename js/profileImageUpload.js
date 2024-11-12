import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, ref, set } from './firebaseConfig.js';

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('profileImage').files[0];
    const userId = 'CURRENT_USER_ID'; // Get this dynamically based on the logged-in user

    if (file) {
        const storage = getStorage();
        const imageRef = storageRef(storage, `profileImages/${userId}`);

        // Upload the file to Firebase Storage
        await uploadBytes(imageRef, file);

        // Get the download URL and save it to the user's profile in Firebase
        const imageUrl = await getDownloadURL(imageRef);
        await set(ref(db, `users/${userId}/profileImage`), imageUrl);

        alert("Profile image uploaded successfully!");
    }
});

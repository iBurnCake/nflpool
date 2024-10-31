import { auth } from './firebaseConfig.js';

document.addEventListener("DOMContentLoaded", () => {
    // Run admin-only check if we're on admin.html
    if (window.location.pathname.endsWith("admin.html")) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                if (user.email !== "your-admin-email@example.com") {
                    alert("Access denied. Admins only.");
                    window.location.href = "index.html"; // Redirect to main page if not admin
                }
            } else {
                alert("Please log in to access the admin page.");
                window.location.href = "index.html";
            }
        });
    }
});

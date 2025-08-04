import httpRequest from "./utils/HttpRequest.js";
import './components/index.js'
import {getUser} from './utils/getUser.js'

// Auth Modal Functionality
document.addEventListener("DOMContentLoaded", async function () {
    // Get DOM elements
    const authModal = document.getElementById("authModal");
    const modalClose = document.getElementById("modalClose");
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const showLoginBtn = document.getElementById("showLogin");
    const showSignupBtn = document.getElementById("showSignup");
    await getUser();
    
});

// // User Menu Dropdown Functionality
// document.addEventListener("DOMContentLoaded", function () {
//     const userAvatar = document.getElementById("userAvatar");
//     const userDropdown = document.getElementById("userDropdown");
//     const logoutBtn = document.getElementById("logoutBtn");

//     // Toggle dropdown when clicking avatar
//     userAvatar.addEventListener("click", function (e) {
//         e.stopPropagation();
//         userDropdown.classList.toggle("show");
//     });

//     // Close dropdown when clicking outside
//     document.addEventListener("click", function (e) {
//         if (
//             !userAvatar.contains(e.target) &&
//             !userDropdown.contains(e.target)
//         ) {
//             userDropdown.classList.remove("show");
//         }
//     });

//     // Close dropdown when pressing Escape
//     document.addEventListener("keydown", function (e) {
//         if (e.key === "Escape" && userDropdown.classList.contains("show")) {
//             userDropdown.classList.remove("show");
//         }
//     });

//     // Handle logout button click
//     logoutBtn.addEventListener("click", function () {
//         // Close dropdown first
//         userDropdown.classList.remove("show");

//         console.log("Logout clicked");
//         // TODO: Students will implement logout logic here
//     });
// });

// // Other functionality
// document.addEventListener("DOMContentLoaded", async () => {
// });

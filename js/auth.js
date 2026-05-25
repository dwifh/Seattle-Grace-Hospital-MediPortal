// auth.js - To edit once indexDB is implemented

// ROLE HANDLING - harcoded to display within the topbar 

const ROLE_LABELS = {
    admin: "Hospital Admin",
    doctor: "Doctor",
    nurse: "Nurse",
    receptionist: "Receptionist",
    patient: "Patient",
    guardian: "Guardian"
};
 
const ROLE_BREADCRUMBS = {
    admin: "Admin Panel · Overview",
    doctor: "Doctor Panel · Overview",
    nurse: "Nurse Panel · Overview",
    receptionist: "Reception · Overview",
    patient: "Patient Portal · Overview",
    guardian: "Guardian Portal · Overview"
};

function updateTopbar(user) {
    // for page title and breadcrumb
    document.getElementById('topbar-title').textContent = 'Dashboard';
    document.getElementById('topbar-breadcrumb').textContent = ROLE_BREADCRUMBS[user.role] || '';
 
    // for username
    document.getElementById('topbar-username').textContent = user.username;
 
    // for role label
    document.getElementById('topbar-role').textContent = ROLE_LABELS[user.role] || user.role;
}

// SESSION SAVER - Tiana don't edit this, or else users will have to login everytime the tab is refreshed
function saveSession(user) {
    //Save the current user in the session storage as a JSON string
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function getSession() {
    const data = sessionStorage.getItem('currentUser');

    //ternary operator; if data exists, convert the JSON string to a JS Object ; otherwise return null
    return data ? JSON.parse(data) : null;
}

function clearSession() {
    sessionStorage.removeItem('currentUser');
}


// DASHBOARD ROUTING
// Hides all dashboard divs, then shows the correct one when it gets the role.
// Also shows/hides the sidebar and correct nav section depending on the user that logged in.


function showDashboard(role) {
    // Hide all dashboard sections during login
    const dashboards = document.querySelectorAll('[id^="dashboard-"]');
    dashboards.forEach(function(dashboard) {
        dashboard.hidden = true;
    });

    // Hide all sidebar nav sections during login
    const navSections = document.querySelectorAll('[id^="nav-"]');
    navSections.forEach(function(nav) {
        nav.hidden = true;
    });

    // Show the correct dashboard after user logged in
    const target = document.getElementById('dashboard-' + role);
    if (target) {
        target.hidden = false;
    }

    // Show the correct sidebar nav after user logged in
    const targetNav = document.getElementById('nav-' + role);
    if (targetNav) {
        targetNav.hidden = false;
    }

    // Show sidebar (This has to change depending on the role of the user)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.hidden = false;
    }

    // Show topbar
    const topbar = document.getElementById('topbar');
    if (topbar) {
        topbar.hidden = false;
    }
 
    // Get the current session to update the topbar
    const currentUser = getSession();
    if (currentUser) {
        updateTopbar(currentUser);
    }

    if (role === 'admin') {
    loadAdminDashboard();
    }
}

// Force this as the starting page
function showLogin() {
    // Hides all dashboards
    const dashboards = document.querySelectorAll('[id^="dashboard-"]');
    dashboards.forEach(function(dashboard) {
        dashboard.hidden = true;
    });

    // Hide sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.hidden = true;
    }

    // Hide topbar
    const topbar = document.getElementById('topbar');
    if (topbar) {
        topbar.hidden = true;
    }

    // force login page
    const loginPage = document.getElementById('dashboard-login');
    if (loginPage) {
        loginPage.hidden = false;
    }
}


// LOGIN ALGORITHM
// Checks submitted credentials against USERS in dummy-data.js (Edited to handle tiana's dummy data)


function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorBox      = document.getElementById('loginError');
    const lockoutBox    = document.getElementById('loginLockout');

    //sanitise the input and remove whitespace from both ends
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Hide previous error messages
    errorBox.hidden  = true;
    lockoutBox.hidden = true;

    // -- Tiana's rate-limit check goes here --
    // if (isLockedOut()) {
    //     lockoutBox.hidden = false;
    //     return;
    // }

    // Find matching user in dummy-data.js; USERS array
    //USERS.find is looping through the USERS ARRAY
    //If the corresponding user is found, it is stored in matchedUser. If not then it is an "undefined" value.
    const matchedUser = USERS.find(function(user) {
        // This is checking whether the user's username and password matches the data they entered 
        return user.username === username && user.password === password;
    });

    //If login failed, display an error message, clear the password box, put focus back on it, and stop.
    if (!matchedUser) {
        // -- Tiana's failed attempt counter goes here --
        // recordFailedAttempt();
        errorBox.hidden = false;
        //clear the password field
        passwordInput.value = '';
        //puts cursor back so user can try again (quality of life implementation)
        passwordInput.focus();
        return;
    }

    // Valid login — save session and route to dashboard
    saveSession(matchedUser);
    showDashboard(matchedUser.role);
}

// LOGOUT LOGIC

function handleLogout() {
    //clear user from current session
    clearSession();
    //force the login page
    showLogin();
}

// INITIALISE the inputs and the buttons
// Check if a session already exists 
// If yes, go straight to the correct dashboard
// If no, show the login page

document.addEventListener('DOMContentLoaded', function() {

    // Wire up the login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Wire up the logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Check for existing session
    const existingSession = getSession();
    if (existingSession) {
        showDashboard(existingSession.role);
    } else {
        // If there are no active sessions, force login page
        showLogin();
    }

});
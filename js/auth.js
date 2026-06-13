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
    document.getElementById('topbar-title').textContent      = 'Dashboard';
    document.getElementById('topbar-breadcrumb').textContent = ROLE_BREADCRUMBS[user.role] || '';
    document.getElementById('topbar-username').textContent   = user.username;
    document.getElementById('topbar-role').textContent       = ROLE_LABELS[user.role] || user.role;
 
    // sidebar footer
    document.getElementById('sidebar-username').textContent     = user.username;
    document.getElementById('sidebar-role').textContent         = ROLE_LABELS[user.role] || user.role;
    document.getElementById('sidebar-role-label').textContent   = 'MediPortal · ' + ROLE_LABELS[user.role];
 
    // avatar initials from username e.g. 'admin.login' -> 'AL'
    const parts    = user.username.split('.');
    const initials = parts.map(function(p) { return p[0].toUpperCase(); }).join('');
    document.getElementById('sidebar-avatar').textContent = initials.slice(0, 2);
}

function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        const topbarHeight = 60;
        const y = section.getBoundingClientRect().top + window.scrollY - topbarHeight - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
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

    if (role === 'admin') { loadAdminDashboard(); }
    if (role === 'nurse') { loadNurseDashboard(); }
    if (role === 'doctor') { loadDoctorDashboard(); }
    if (role === 'patient') { loadPatientDashboard(); }
    if (role === 'guardian') { loadGuardianDashboard(); }
    if (role === 'receptionist') { loadReceptionistDashboard(); }
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

function showTab(tab) {
    const loginPanel = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
 
    if (tab === 'login') {
        loginPanel.hidden = false;
        registerPanel.hidden = true;
        tabLogin.classList.add('login_tab--active');
        tabRegister.classList.remove('login_tab--active');
    } else {
        loginPanel.hidden = true;
        registerPanel.hidden = false;
        tabRegister.classList.add('login_tab--active');
        tabLogin.classList.remove('login_tab--active');
    }
}

//TIANA SECTION
//Record how many failed attempts.
function recordFailedAttempt() {
    //Read how many attempts have been made so far
    var attempts = Number(sessionStorage.getItem("loginAttempts")) || 0;
    attempts++;
    sessionStorage.setItem("loginAttempts", attempts);

    //If 3 or more failed, save the time the lockout started
    if (attempts >= 3) {
        sessionStorage.setItem("lockoutTime", Date.now());
    }
}

//Rate-limit functions
function isLockedOut() {
    var attempts = Number(sessionStorage.getItem("loginAttempts")) || 0;

    //If there's less than 3 attempts, don't lock out.
    if (attempts < 3) {
        return false;
    }

    var lockoutTime = Number(sessionStorage.getItem("lockoutTime"));
    //Date.now() retuns 1000 milliseconds.
    var now = Date.now();

    //30 seconds = 3,0000 milliseconds.
    var thirtySeconds = 30 * 1000;

    //If now is within 30 second lockout, don't lockout
    if (now - lockoutTime < thirtySeconds) {
        return true;
    }

    //When lockout has expired, reset counters.
    sessionStorage.removeItem("loginAttempts");
    sessionStorage.removeItem("lockoutTime");
    return false;
}

//END OF TIANA SECTION

// LOGIN ALGORITHM
// IndexedDB-first: looks up the username as a key in the "users" store.
// If the store is empty or unseeded, falls back to the USERS array in dummy-data.js.

function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorBox = document.getElementById('loginError');
    const lockoutBox = document.getElementById('loginLockout');

    //sanitise the input and remove whitespace from both ends
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Hide previous error messages
    errorBox.hidden = true;
    lockoutBox.hidden = true;

    // -- Tiana's rate-limit check goes here --
    if (isLockedOut()) {
        lockoutBox.hidden = false;
        return;
    }

    //attemptLogin does the actual credential check once we have a user record.
    //It is called by both the IndexedDB path and the dummy-data fallback below.
    function attemptLogin(matchedUser) {
        //If login failed, display an error message, clear the password box, put focus back on it, and stop.
        if (!matchedUser || matchedUser.password !== password) {
            // -- Tiana's failed attempt counter goes here --
            recordFailedAttempt();
            errorBox.hidden = false;
            //clear the password field
            passwordInput.value = '';
            //puts cursor back so user can try again (quality of life implementation)
            passwordInput.focus();
            return;
        }

        // Valid login — save session and route to dashboard
        saveSession(matchedUser);
        sessionStorage.removeItem("loginAttempts");
        sessionStorage.removeItem("lockoutTime");
        showDashboard(matchedUser.role);
    }

    //Try IndexedDB first. getRecord looks up the username directly since "username" is the keyPath of the "users" store.
    openDatabase(function() {
        getRecord("users", username, function(idbUser) {
            if (idbUser) {
                //Found in IndexedDB, then use it.
                attemptLogin(idbUser);
            } else {
                //If user not found in IndexedDB, login fails.
                attemptLogin(null);
            }
        });
    });
}

// LOGOUT LOGIC

function handleLogout() {
    //clear user from current session
    clearSession();
    //force the login page
    showLogin();
}


// REGISTRATION ALGORITHM
// Creates a NEW patient account from the registration form and writes it to IndexedDB.
// Writes to the SAME stores and record shapes as seed.js, so a registered patient is
// indistinguishable from a seeded one to auth.js and the dashboards.
//
// Patient-supplied fields are collected here. Clinically-assigned fields are NOT asked of the user.
//  They default to null and are set later by an admin/clinician.

//Calculates age from a date-of-birth string, so we never store a stale age integer.
function calculateAge(dob) {
    var today = new Date();
    var birth = new Date(dob);
    var age = today.getFullYear() - birth.getFullYear();
    var m = today.getMonth() - birth.getMonth();
    //If this year's birthday hasn't happened yet, subtract one.
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

//handleRegister helps the user to create a new patient account.
function handleRegister(event) {
    event.preventDefault();

    //Grab every field from the registration form.
    var firstName = stripHtml(document.getElementById('reg_firstName').value.trim());
    var lastName  = stripHtml(document.getElementById('reg_lastName').value.trim());
    var dob       = document.getElementById('reg_dob').value;
    var nhsNumber = document.getElementById('reg_nhs').value.trim();
    var address   = stripHtml(document.getElementById('reg_address').value.trim());
    var telephone = document.getElementById('reg_telephone').value.trim();
    var email     = document.getElementById('reg_email').value.trim();
    var username  = document.getElementById('reg_username').value.trim();
    var password  = document.getElementById('reg_password').value.trim();

    //Message elements (added to the form in index.html).
    var errorBox   = document.getElementById('registerError');
    var successBox = document.getElementById('registerOk');

    //Hide any previous messages.
    if (errorBox)   errorBox.hidden = true;
    if (successBox) successBox.hidden = true;

    //Small helper to show an error message and stop.
    function fail(message) {
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.hidden = false;
        }
    }

    //----VALIDATION CHECKS----

    //1. All required fields must be filled.
    if (firstName === "" || lastName === "" || dob === "" || nhsNumber === "" ||
        address === "" || telephone === "" || email === "" || username === "" || password === "") {
        fail("Please fill in all fields.");
        return;
    }

    //2. Date of birth must be a real date in the past.
    var birthDate = new Date(dob);
    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
        fail("Please enter a valid date of birth.");
        return;
    }

    //3. NHS number format: 3 digits, 3 digits, 4 digits (spaces optional on input).
    var nhsPattern = /^\d{3}\s?\d{3}\s?\d{4}$/;
    if (!nhsPattern.test(nhsNumber)) {
        fail("NHS number must be in the format 000 000 0000.");
        return;
    }

    //4. Email must look valid (reuses isEmail from validate.js).
    if (!isEmail(email)) {
        fail("Please enter a valid email address.");
        return;
    }

    //5. Password must be strong enough (reuses isStrongPassword from validate.js — min 8 chars).
    if (!isStrongPassword(password)) {
        fail("Password must be at least 8 characters long.");
        return;
    }

    //----WRITE TO IndexedDB----
    //Open the DB first so the stores are available.
    openDatabase(function() {

        //6. Duplicate-username check: a username is the primary key of the users store, so we must not silently overwrite an existing account.
        getRecord("users", username, function(existing) {
            if (existing) {
                fail("That username is already taken. Please choose another.");
                return;
            }

            //Build a unique, collision-safe patient ID.
            var patientID = "p" + Date.now();

            //Normalise the NHS number to the stored "000 000 0000" format.
            var digits = nhsNumber.replace(/\s/g, "");
            var formattedNhs = digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6);

            //Build the patient profile. Same shape as patients.json.
            //Clinically-assigned fields default to null; allergies defaults to an empty array.
            var newPatient = {
                patientID: patientID,
                firstName: firstName,
                lastName: lastName,
                age: calculateAge(dob),
                nhsNumber: formattedNhs,
                dob: dob,
                gender: "",                 //not collected on this form; can be set in profile later
                address: address,
                telephone: telephone,
                email: email,
                registeredDoctorID: null,   //assigned by an administrator after registration
                bloodGroup: null,           //confirmed by a doctor
                allergies: [],              //empty array, not null
                guardianID: null            //adults only; minor registration is out of scope
            };

            //Build the login account. Same shape as the users seeded by seed.js.
            //NOTE: password is plaintext here.
            var newUser = {
                username: username,
                password: password,
                role: "patient",
                patientID: patientID
            };

            //Persist both records.
            putRecord("patients", newPatient);
            putRecord("users", newUser, function(saved) {
                if (!saved) {
                    fail("Could not create your account. Please try again.");
                    return;
                }

                //Success — show message, then log the new patient straight in.
                if (successBox) {
                    successBox.textContent = "Account created. Signing you in…";
                    successBox.hidden = false;
                }

                //Auto-login: save session and route to the patient dashboard.
                saveSession(newUser);
                showDashboard("patient");
            });
        });
    });
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

    // Wire up the registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
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
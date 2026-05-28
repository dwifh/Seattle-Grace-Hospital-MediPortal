//validate.js contains shared input checks used by every form across the app.
//Login form, booking form, prescription form etc. all call these functions before submitting.


//stripHtml removes any HTML tags from user input.
//which could otherwise run as real code when we put the value back on the page with innerHTML.
function stripHtml(input) {
    //If the input is empty or null, return an empty string straight away to avoid errors.
    if (!input) return "";

    //I learnt about regex from W3Schools and MDN.
    //The pattern /<[^>]*>/g means:
    //  /        - start of the regex
    //  <        - find a literal < character
    //  [^>]*    - then any number of characters that aren't a >
    //  >        - then a literal > character
    //  /g       - the g flag = global, so it strips ALL matches, not just the first one
    //So <script>, <p>, <img src="x"> etc. all get replaced with "" (empty string).
    return input.replace(/<[^>]*>/g, "");
}


//isEmail checks if a string looks like a valid email address.
//It uses a regular expression to match the pattern: something@something.something
function isEmail(input) {
    //If input is empty, it's not a valid email.
    if (!input) return false;

    //The regex breaks down as:
    //  ^[^\s@]+   - starts with one or more characters that aren't spaces or @
    //  @          - must contain an @ symbol
    //  [^\s@]+    - then one or more characters that aren't spaces or @
    //  \.         - must have a dot
    //  [^\s@]+$   - ends with one or more characters that aren't spaces or @
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    //.test returns true if the input matches the pattern, false if not.
    return emailPattern.test(input);
}


//isStrongPassword checks if a password meets the minimum requirements.
//Rule: at least 8 characters AND at least 1 number.
function isStrongPassword(input) {
    //If input is empty, it's not strong.
    if (!input) return false;

    //First check: at least 8 characters long.
    if (input.length < 8) return false;

    //Second check: must contain at least 1 number (digit 0–9).
    //The regex /\d/ matches any digit. .test returns true if a digit was found.
    var hasNumber = /\d/.test(input);
    if (!hasNumber) return false;

    //If both checks passed, the password is strong enough.
    return true;
}


//showFieldError displays an error message next to a form field.
//It expects the form to have a <p> element with id like "errorEmail", "errorPassword" etc.
function showFieldError(fieldName, message) {
    //Build the ID of the error paragraph by adding "error" in front of the field name.
    //Example: fieldName "Email" → looks for element with id "errorEmail".
    var errorBox = document.getElementById("error" + fieldName);

    //If the error box exists in the HTML, show the message inside it.
    if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false; //makes the paragraph visible
    }
}


//clearFieldError hides the error message for a specific field.
//Called after the user fixes the input so the old error message doesn't linger.
function clearFieldError(fieldName) {
    var errorBox = document.getElementById("error" + fieldName);

    if (errorBox) {
        errorBox.textContent = "";
        errorBox.hidden = true;
    }
}


//validateBookingForm checks all the fields in the appointment booking form.
//Returns true if everything is OK, false if anything failed.
function validateBookingForm(date, doctor, reason) {
    //Boolean tracker that flips to false if any check fails.
    var isValid = true;

    //Clear any previous error messages first so we start fresh.
    clearFieldError("ApptDate");
    clearFieldError("ApptDoctor");
    clearFieldError("ApptReason");

    //Check date — must not be empty.
    if (date === "") {
        showFieldError("ApptDate", "Please select a date.");
        isValid = false;
    }

    //Check doctor — must not be empty (user must pick one from the dropdown).
    if (doctor === "") {
        showFieldError("ApptDoctor", "Please choose a doctor.");
        isValid = false;
    }

    //Check reason — strip HTML first, then check it's not empty.
    var cleanReason = stripHtml(reason);
    if (cleanReason === "") {
        showFieldError("ApptReason", "Please give a reason for your visit.");
        isValid = false;
    }

    return isValid;
}


//validateLoginForm checks the login form fields.
//Returns true if everything is OK, false if anything failed.
function validateLoginForm(username, password) {
    var isValid = true;

    clearFieldError("Username");
    clearFieldError("Password");

    //Username must not be empty after stripping HTML.
    var cleanUsername = stripHtml(username);
    if (cleanUsername === "") {
        showFieldError("Username", "Please enter your username.");
        isValid = false;
    }

    //Password must not be empty.
    //We don't run isStrongPassword here because users may have existing accounts
    //that were created before the strong password rule. Strong password is only
    //checked when creating a new account.
    if (password === "") {
        showFieldError("Password", "Please enter your password.");
        isValid = false;
    }

    return isValid;
}


//validatePrescriptionForm checks the doctor's prescription form before issuing.
function validatePrescriptionForm(medicineID, dosage) {
    var isValid = true;

    clearFieldError("RxMedicine");
    clearFieldError("RxDosage");

    if (medicineID === "") {
        showFieldError("RxMedicine", "Please choose a medicine.");
        isValid = false;
    }

    var cleanDosage = stripHtml(dosage);
    if (cleanDosage === "") {
        showFieldError("RxDosage", "Please enter a dosage.");
        isValid = false;
    }

    return isValid;
}


//validateNoteForm checks the doctor's clinical note form before saving.
function validateNoteForm(title, noteText) {
    var isValid = true;

    clearFieldError("NoteTitle");
    clearFieldError("NoteText");

    //Title must not be empty after stripping HTML.
    var cleanTitle = stripHtml(title);
    if (cleanTitle === "") {
        showFieldError("NoteTitle", "Please add a title for the note.");
        isValid = false;
    }

    //Note text must not be empty.
    var cleanNote = stripHtml(noteText);
    if (cleanNote === "") {
        showFieldError("NoteText", "Please write something in the note.");
        isValid = false;
    }

    return isValid;
}
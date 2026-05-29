//Checks session storage, finds doctor ID and loops it through DOCTORS array
function getLoggedInDoctor() {
    //It returns the doctorID of the currently logged in from session storage.
    var savedID = sessionStorage.getItem("doctorID");

    for (var i = 0; i < DOCTORS.length; i++) {

        //DoctorID = session storage, then it's our legit user.
        if (DOCTORS[i].doctorID === savedID) {
            return DOCTORS[i];
        }
    }

    //Load Dr Priya Patel as demo doctor
    for (var i = 0; i < DOCTORS.length; i++) {
        if (DOCTORS[i].doctorID === "d001") {
            return DOCTORS[i];
        }
    }

    //Else return null.
    return null;
}


//loadDoctorDashboard it just calls other function to load in dashboard
function loadDoctorDashboard() {
    //Get doctor login
    var doctor = getLoggedInDoctor();

    if (!doctor) {
        console.log("No doctor found");
        return;
    }

    showDoctorName(doctor);
    showTodayDate();
    showTodayAppointments(doctor);
    showDoctorStats(doctor);
    showPatientList(doctor);
    fillMedicineDropdown();
    setupNoteForm();
    setupRxForm();
    setupCloseRecord();
    setupPatientSearch();
}


//It will show doctor name and welcome at the top of the dashboard
function showDoctorName(doctor) {
    //Finds element with ID docName and sets text with title, first and last name.
    document.getElementById("docName").textContent = doctor.title + " " + doctor.firstName + " " + doctor.lastName;
}


//It will show today's patient and date.
function showTodayDate() {
    var today = new Date();
    var formatted = today.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    document.getElementById("todayDate").textContent = formatted;
}


//It will shows the list of today's patients in the sidebar.
//For the doctor, status pill is toggleable, doctor clicks through waiting → in progress → done.
function showTodayAppointments(doctor) {
    //Get unordered list where list will go
    var list = document.getElementById("todayList");
    //Clear previous services.
    list.innerHTML = "";

    var today = new Date();
    //toISOString gives "2026-05-27T00:00:00.000Z", we slice to keep just "2026-05-27" which matches the date format used in dummy-data.js.
    var todayString = today.toISOString().slice(0, 10);

    //found is a boolean condition to track if we found at least 1 appointment for today.
    var found = false;

    for (var i = 0; i < APPOINTMENTS.length; i++) {
        var appt = APPOINTMENTS[i];

        //Skip if appointment is not for specific doctor OR not for today
        if (appt.doctorID !== doctor.doctorID || appt.date !== todayString) {
            continue;
        }

        found = true;

        //Check patients for appointment.
        var patient = null;
        for (var j = 0; j < PATIENTS.length; j++) {
            if (PATIENTS[j].patientID === appt.patientID) {
                patient = PATIENTS[j];
                break;
            }
        }

        //If patient not found, skip appointment.
        if (!patient) continue;

        //Status will check checkInStatus, ? will show value if true / false
        var status = appt.checkInStatus ? appt.checkInStatus : "pending";

        //Readable format for status pill
        var label = "";
        if (status === "pending" || status === "checked_in") {
            label = "Waiting";
        } else if (status === "in_progress") {
            label = "In Progress";
        } else if (status === "done") {
            label = "Done";
        } else {
            label = status;
        }

        //Build a neat list with patient name, time and clickable status pill all in one place
        var item = document.createElement("li");
        item.className = "today_item";
        //Store the appointment ID on the element so the click handler can find it later.
        item.setAttribute("data-appt-id", appt.appointmentID);
        item.innerHTML =
            '<div class="today_item_body">' +
                '<p class="today_item_name">' + patient.firstName + " " + patient.lastName + '</p>' +
                '<p class="today_item_time">' + appt.time + ' · ' + appt.reason + '</p>' +
            '</div>' +
            '<span class="status_pill status_' + status + '">' + label + '</span>';
        //Adds the finished list to unordered list
        list.appendChild(item);
    }
    //If appointments not found, show message.
    if (!found) {
        list.innerHTML = "<li class='today_empty'>No appointments today.</li>";
    }

    //Call function to attach click listeners.
    setupStatusPills();
}


//It makes every status pill in "Today's patient" clickable
//When clicked, it will cycle from Waiting, In Progress, Done, Waiting...
//It holds internal appointment data
function setupStatusPills() {
    //Selects all elements that have class status_pill and will return an array.
    var pills = document.querySelectorAll(".status_pill");

    for (var i = 0; i < pills.length; i++) {
        pills[i].addEventListener("click", function() {
            //Find parent list which carries appointment ID
            //E.g would be 'AP001' in dummy data
            var item = this.parentNode;
            var apptID = item.getAttribute("data-appt-id");

            //Look for appointment in APPOINTMENTS array.
            var appt = null;
            for (var j = 0; j < APPOINTMENTS.length; j++) {
                if (APPOINTMENTS[j].appointmentID === apptID) {
                    appt = APPOINTMENTS[j];
                    break;
                }
            }

            //If no matching appointment shows up, exit function.
            if (!appt) return;

            //Get the current status, else if value is false, return "pending"
            var current = appt.checkInStatus ? appt.checkInStatus : "pending";

            //Variable for internal status code(pending, in_progress, done)
            var newStatus;
            //Variable for human readable text(Waiting, In Progress, Done)
            var newLabel;
            //Cycle through Waiting, In Progress, Done
            if (current === "pending" || current === "checked_in") {
                newStatus = "in_progress";
                newLabel = "In Progress";
            } else if (current === "in_progress") {
                newStatus = "done";
                newLabel = "Done";
            } else {
                newStatus = "pending";
                newLabel = "Waiting";
            }

            //It will update appointment in APPOINTMENTS array with new status.
            appt.checkInStatus = newStatus;

            //It will update the visible pill text while cycling and dynamic colour class
            this.textContent = newLabel;
            this.className = "status_pill status_" + newStatus;

            //It will get data from current demo doctor and pills will auto update at the top of the page.
            var doctor = getLoggedInDoctor();
            showStats(doctor);
        });
    }
}


//It will display the 4 stat cards at the top of the dashboard.
function showDoctorStats(doctor) {
    var today = new Date();
    var todayString = today.toISOString().slice(0, 10);

    //Counter for each status pill.
    var totalToday = 0;
    var waiting = 0;
    var inProgress = 0;
    var done = 0;

    //Loop through array and count by status.
    for (var i = 0; i < APPOINTMENTS.length; i++) {
        var appt = APPOINTMENTS[i];

        //Skip if it's not for this doctor OR not for today.
        if (appt.doctorID !== doctor.doctorID || appt.date !== todayString) {
            continue;
        }
        //Increment total count.
        totalToday++;

        //Get current status or else will return "pending"
        var status = appt.checkInStatus ? appt.checkInStatus : "pending";

        //It will increment the appropriate counter based on status value.
        if (status === "pending" || status === "checked_in") waiting++;
        if (status === "in_progress") inProgress++;
        if (status === "done") done++;
    }

    //Display the counts in readable language.
    document.getElementById("statTodayCount").textContent = totalToday;
    //Checks if there's exactly one appointment or more than 1.
    document.getElementById("statTodaySub").textContent = totalToday === 1 ? "appointment" : "appointments";

    document.getElementById("statWaitingCount").textContent = waiting;
    document.getElementById("statWaitingSub").textContent = "Yet to start";

    document.getElementById("statInProgressCount").textContent = inProgress;
    document.getElementById("statInProgressSub").textContent = "Being seen now";

    document.getElementById("statDoneCount").textContent = done;
    document.getElementById("statDoneSub").textContent = "Finished today";
}


//It will show the list of patients assigned to this doctor.
function showPatientList(doctor) {
    var list = document.getElementById("patientList");
    list.innerHTML = "";

    //Counter to track how many patients are displayed.
    var count = 0;

    //Loop through PATIENTS array.
    for (var i = 0; i < PATIENTS.length; i++) {
        var p = PATIENTS[i];

        //Skip if patient is not registered for specific doctor.
        if (p.registeredDoctorID !== doctor.doctorID) continue;

        //Increment counter for every patient belonging to this doctor.
        count++;

        //Create a list element for patient and give it a class for styling.
        var item = document.createElement("li");
        item.className = "patient_item";
        //It will store patient unique ID and it will be used when item is clicked.
        item.setAttribute("data-patient-id", p.patientID);
        item.innerHTML =
            '<div class="patient_item_avatar">' + p.firstName[0] + p.lastName[0] + '</div>' +
            '<div class="patient_item_body">' +
                '<p class="patient_item_name">' + p.firstName + ' ' + p.lastName + '</p>' +
                '<p class="patient_item_meta">' + p.gender + ' · age ' + p.age + ' · ' + p.bloodGroup + '</p>' +
            '</div>';

        //A click event - It will read patient ID and call a function that will display the patient's full record on the right.
        item.addEventListener("click", function() {
            var patientID = this.getAttribute("data-patient-id");
            openPatientRecord(patientID);
        });
        //Add finished list to patientList.
        list.appendChild(item);
    }

    //Display how many patients the doctor has.
    document.getElementById("patientCount").textContent = count + " patient" + (count === 1 ? "" : "s");

    //However, if no patients were found for this doctor, patientList will be empty and will display a message.
    if (count === 0) {
        list.innerHTML = "<li class='patient_empty'>No patients registered to you.</li>";
    }
}


//This will open a record viewer for the patient ID.
function openPatientRecord(patientID) {
    //Look for patient in PATIENTS array.
    var patient = null;
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].patientID === patientID) {
            patient = PATIENTS[i];
            break;
        }
    }

    if (!patient) return;

    //It will save which patient is selected by storing ID on record viewer element.
    //Note form and prescription form will read the data-current-patient to know who it belongs to.
    document.getElementById("recordViewer").setAttribute("data-current-patient", patient.patientID);

    //Hidden in HTML, It will reveal main panel for patient details and history, add clinical notes and prescription.
    document.getElementById("recordViewer").hidden = false;
    document.getElementById("noteCard").hidden = false;
    document.getElementById("rxFormCard").hidden = false;

    //It will fill in patient information row.
    document.getElementById("recordPatientName").textContent = patient.firstName + " " + patient.lastName;
    document.getElementById("recordDob").textContent = patient.dob;
    document.getElementById("recordBlood").textContent = patient.bloodGroup;
    //Check if patient has any allergies, if value false = "None"
    document.getElementById("recordAllergies").textContent = patient.allergies.length > 0 ? patient.allergies.join(", ") : "None";

    //Call function that will build medical history in record viewer.
    showRecordHistory(patient);

    //Call function that will list patient's previous and current prescriptions.
    showRecordPrescriptions(patient);
}


//It will read patient ID and return patient object.
function getSelectedPatient() {
    var patientID = document.getElementById("recordViewer").getAttribute("data-current-patient");
    if (!patientID) return null;

    //Loop through PATIENTS array.
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].patientID === patientID) {
            return PATIENTS[i];
        }
    }
    return null;
}


//It will fill in medical history of the record viewer.
function showRecordHistory(patient) {
    var list = document.getElementById("recordHistory");
    list.innerHTML = "";

    //Collect patient entries.
    var entries = [];
    for (var i = 0; i < MEDICAL_HISTORY.length; i++) {
        if (MEDICAL_HISTORY[i].patientID === patient.patientID) {
            entries.push(MEDICAL_HISTORY[i]);
        }
    }

    //Sorting function (used it in patient.js for chronological medical history timeline.)
    entries.sort(function(a, b) {
        var dateA = a.date ? new Date(a.date) : new Date(0);
        var dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });

    //If no entries from patient, display message.
    if (entries.length === 0) {
        list.innerHTML = "<li>No medical history on record.</li>";
        return;
    }

    //Loop through entries.
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        //Check if entry date exists, format it, else "Unknown date".
        var dateText = entry.date ? new Date(entry.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Unknown date";
        //badge_ will allow different history entry types to have different colour badges with styling.
        var badgeClass = "badge_" + entry.type;
        var typeLabel = entry.type.replace("_", " ");

        //Create list that will store medical history details for patient.
        var item = document.createElement("li");
        item.className = "record_history_item";
        item.innerHTML =
            '<p class="record_history_date">' + dateText + '</p>' +
            '<p class="record_history_title">' + entry.title + '</p>' +
            '<p class="record_history_desc">' + entry.description + '</p>' +
            '<span class="' + badgeClass + '">' + typeLabel + '</span>';
        //Append new item to list.
        list.appendChild(item);
    }
}

//It fills in the active prescription section of the record viewer.
function showRecordPrescriptions(patient) {
    //Container element recordRx where precriptions will be listed.
    var list = document.getElementById("recordRx");
    list.innerHTML = "";

    //Track if found at least one active prescription.
    var found = false;

    for (var i = 0; i < PRESCRIPTIONS.length; i++) {
        var rx = PRESCRIPTIONS[i];

        //Skip if prescription does not belong to current patient OR prescription not active
        if (rx.patientID !== patient.patientID || rx.status !== "active") continue;

        found = true;

        //Loop through MEDICINES array to see if medicineID = prescription medicineID
        var med = null;
        for (var j = 0; j < MEDICINES.length; j++) {
            if (MEDICINES[j].medicineID === rx.medicineID) {
                med = MEDICINES[j];
                break;
            }
        }

        //Check if medicine was found, else "Unknown"
        var medName = med ? med.name + " " + med.strength : "Unknown";

        //Creating new list item and style it with class.
        var item = document.createElement("li");
        item.className = "record_rx_item";
        item.innerHTML =
            '<p class="record_rx_name">' + medName + '</p>' +
            '<p class="record_rx_dose">' + rx.dosage + ' · ' + rx.frequency + ' · ' + rx.durationDays + ' days</p>';
        //Append new item to list.
        list.appendChild(item);
    }

    //If no active prescription found, display message.
    if (!found) {
        list.innerHTML = "<li>No active prescriptions.</li>";
    }
}

//Set up close button on record viewer.
function setupCloseRecord() {
    var btn = document.getElementById("closeRecordBtn");
    //Attach click event to that button. Unhide UI elements.
    btn.addEventListener("click", function() {
        document.getElementById("recordViewer").hidden = true;
        document.getElementById("noteCard").hidden = true;
        document.getElementById("rxFormCard").hidden = true;
        //It will clear saved patientID so the forms will know that no patient has been selected.
        document.getElementById("recordViewer").removeAttribute("data-current-patient");
    });
}


//Medicine dropdown in the prescription form.
function fillMedicineDropdown() {
    var select = document.getElementById("rxMedicine");
    //Loop through MEDICINES array
    //Create option element, medicineID & set visible text of medicine details.
    for (var i = 0; i < MEDICINES.length; i++) {
        var option = document.createElement("option");
        option.value = MEDICINES[i].medicineID;
        option.textContent = MEDICINES[i].name + " " + MEDICINES[i].strength + " · " + MEDICINES[i].form;
        //Append option to select element.
        select.appendChild(option);
    }
}


//It sets up clinical note form submission
function setupNoteForm() {
    var form = document.getElementById("noteForm");
    //Add submit event to form and stops browser from sending HTTP request
    form.addEventListener("submit", function(e) {
        e.preventDefault();

        //Look for what patient has been selected.
        var patient = getSelectedPatient();
        if (patient === null) return;

        //Retrieve values from input field and strip HTML to remove unwanted tags (via validate.js)
        var title = stripHtml(document.getElementById("noteTitle").value);
        var noteText = stripHtml(document.getElementById("noteText").value);

        //Elements to display error/success messages
        var errorMsg = document.getElementById("noteError");
        var successMsg = document.getElementById("noteOk");

        errorMsg.hidden = true;
        successMsg.hidden = true;

        //Make sure fields are filled via validation check.
        if (title === "" || noteText === "") {
            errorMsg.hidden = false;
            return;
        }

        //Build a new history entry and push it to MEDICAL_HISTORY.
        var newEntry = {
            patientID: patient.patientID,
            date: new Date().toISOString().slice(0, 10),
            type: "diagnosis",
            title: title,
            description: noteText,
            recordedBy: getLoggedInDoctor().doctorID
        };

        MEDICAL_HISTORY.push(newEntry);

        //Show success message and reset form.
        successMsg.hidden = false;
        form.reset();

        //Call function to refresh medical history list and new note shows up immediately.
        showRecordHistory(patient);
    });
}


//It will setup prescription form submission.
function setupRxForm() {
    var form = document.getElementById("rxForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var patient = getSelectedPatient();
        if (patient === null) return;

        //Read form values medicineID, dosage sanitised with stripHtml() and duration.
        var medicineID = document.getElementById("rxMedicine").value;
        var dosage = stripHtml(document.getElementById("rxDosage").value);
        var duration = document.getElementById("rxDuration").value;

        var errorMsg = document.getElementById("rxError");
        var successMsg = document.getElementById("rxOk");

        errorMsg.hidden = true;
        successMsg.hidden = true;

        //If any of 3 fields is empty, show error message.
        if (medicineID === "" || dosage === "" || duration === "") {
            errorMsg.hidden = false;
            return;
        }


        //Build new prescription and push ut into PRESCRIPTIONS
        var newRx = {
            patientID: patient.patientID,
            doctorID: getLoggedInDoctor().doctorID,
            medicineID: medicineID,
            dosage: dosage,
            frequency: "as directed",
            //Number() will covert string from input into real number.
            durationDays: Number(duration),
            dateIssued: new Date().toISOString().slice(0, 10),
            instructions: "Issued by doctor during consultation.",
            status: "active"
        };

        PRESCRIPTIONS.push(newRx);

        successMsg.hidden = false;
        form.reset();

        //Call function to refresh prescription list so that new one shows up.
        showRecordPrescriptions(patient);
    });
}


//It will setup a search box that will filter patient list as doctor will type.
function setupPatientSearch() {
    var input = document.getElementById("docSearchInput");
    //Input event listener so that it gives instant filtering everytime user types or deletes.
    input.addEventListener("input", function() {
        //Makes search case-insensitive.
        var query = input.value.toLowerCase();
        //Select elements with patient_name.
        var items = document.querySelectorAll(".patient_item");

        //Loop through every patient item.
        for (var i = 0; i < items.length; i++) {
            //Read patient name out of item.
            var name = items[i].querySelector(".patient_item_name").textContent.toLowerCase();

            //indexOf returns position of match, and - 1 if not found.
            //If it's not -1, the name contains search query.
            if (name.indexOf(query) !== -1) {
                items[i].hidden = false;
            } else {
                items[i].hidden = true;
            }
        }
    });
}
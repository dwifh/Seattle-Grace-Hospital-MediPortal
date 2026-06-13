//doctor.js wired to IndexedDB.

//DDATA is the module-level cache for the doctor dashboard. It is filled once by loadDoctorData().
var DDATA = {
    doctor: null,
    doctors: [],
    patients: [],
    guardians: [],
    appointments: [],
    bookingRequests: [],
    prescriptions: [],
    medicines: [],
    history: [],
    prescriptionRequests: []
};

//loadStoreD fetches every record from one object store. If the store is empty, it hands back the dummy-data fallback array instead.
function loadStoreD(storeName, fallbackArray, callback) {
    try {
        getAllRecords(storeName, function(records) {
            if (records && records.length > 0) {
                callback(records);
            } else {
                callback(fallbackArray);
            }
        });
    } catch(e) {
        console.log("loadStoreD: store '" + storeName + "' not available yet, using fallback. (" + e.message + ")");
        callback(fallbackArray);
    }
}

//findDoctorInDummy is the fallback lookup for the logged-in doctor.
function findDoctorInDummy(doctorID) {
    for (var i = 0; i < DOCTORS.length; i++) {
        if (DOCTORS[i].doctorID === doctorID) {
            return DOCTORS[i];
        }
    }
    //Demo fallback — Dr Priya Patel (d001).
    for (var i = 0; i < DOCTORS.length; i++) {
        if (DOCTORS[i].doctorID === "d001") {
            return DOCTORS[i];
        }
    }
    return null;
}

//loadDoctorData fills DDATA from IndexedDB (with dummy-data fallback), then calls onReady.
function loadDoctorData(onReady) {
    //Work out the logged-in doctor's ID from the session object saved by auth.js.
    var session = getSession();
    var doctorID = (session && session.doctorID) ? session.doctorID : "d001";

    //Load the doctor profile — IndexedDB first, dummy-data fallback.
    getRecord("doctors", doctorID, function(record) {
        DDATA.doctor = record ? record : findDoctorInDummy(doctorID);

        //Each job is [storeName, fallbackArray, keyInDDATA].
        var jobs = [
            ["doctors",          DOCTORS,          "doctors"],
            ["patients",         PATIENTS,         "patients"],
            ["guardians",        GUARDIAN,         "guardians"],
            ["appointments",     APPOINTMENTS,     "appointments"],
            ["booking_requests", BOOKING_REQUESTS, "bookingRequests"],
            ["prescriptions",    PRESCRIPTIONS,    "prescriptions"],
            ["medicines",        MEDICINES,        "medicines"],
            ["medicalHistory",   MEDICAL_HISTORY,  "history"],
            ["prescription_requests", [],          "prescriptionRequests"]
        ];

        //Load every store in parallel and only continue once all have come back.
        var remaining = jobs.length;
        for (var i = 0; i < jobs.length; i++) {
            (function(job) {
                loadStoreD(job[0], job[1], function(records) {
                    DDATA[job[2]] = records;
                    remaining--;
                    if (remaining === 0) {
                        onReady();
                    }
                });
            })(jobs[i]);
        }
    });
}

//getLoggedInDoctor returns the cached doctor record. Used by the write handlers too.
//If the cache isn't ready, it falls back to a synchronous dummy lookup.
function getLoggedInDoctor() {
    if (DDATA.doctor) {
        return DDATA.doctor;
    }
    var session = getSession();
    var doctorID = (session && session.doctorID) ? session.doctorID : "d001";
    return findDoctorInDummy(doctorID);
}


//Guardian Notifications.
//Builds a guardian's username with the same formula seed.js uses: firstname.lastname, letters only.
function makeGuardianUsername(guardian) {
    return guardian.firstName.toLowerCase().replace(/[^a-z]/g, "")
        + "."
        + guardian.lastName.toLowerCase().replace(/[^a-z]/g, "");
}

//Creates and persists one notification for the guardian of the given patient.
//Does nothing (safely) if the patient has no guardian or the guardian can't be found.
function createNotificationForPatient(patientID, type, message) {
    //Find the patient in the cache so we can read their guardianID.
    var patient = null;
    for (var i = 0; i < DDATA.patients.length; i++) {
        if (DDATA.patients[i].patientID === patientID) {
            patient = DDATA.patients[i];
            break;
        }
    }

    //No patient, or an adult patient with no guardian → nothing to notify.
    if (!patient || !patient.guardianID) {
        return;
    }

    //Find the guardian linked to this patient.
    var guardian = null;
    for (var j = 0; j < DDATA.guardians.length; j++) {
        if (DDATA.guardians[j].guardianID === patient.guardianID) {
            guardian = DDATA.guardians[j];
            break;
        }
    }

    //Guardian record missing (e.g. not seeded) → skip safely.
    if (!guardian) {
        return;
    }

    //Build the notification matching the store schema (keyPath: notificationID).
    var notification = {
        notificationID: "nt" + Date.now(),
        recipientID: makeGuardianUsername(guardian),
        type: type,
        message: message,
        isRead: false,
        createdAt: new Date().toISOString().slice(0, 10)
    };

    //Persist to IndexedDB. The guardian dashboard will pick it up on next load.
    putRecord("notifications", notification);
}


//loadDoctorDashboard opens the DB, loads all data, then renders every section.
function loadDoctorDashboard() {
    openDatabase(function() {
        loadDoctorData(function() {
            var doctor = DDATA.doctor;

            if (!doctor) {
                console.log("No doctor found");
                return;
            }

            showDoctorName(doctor);
            showTodayDate();
            showTodayAppointments(doctor);
            showBookingNotifications(doctor);
            showPrescriptionRequests(doctor);
            showDoctorStats(doctor);
            showPatientList(doctor);
            fillMedicineDropdown();
            setupNoteForm();
            setupRxForm();
            setupCloseRecord();
            setupPatientSearch();
        });
    });
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

    for (var i = 0; i < DDATA.appointments.length; i++) {
        var appt = DDATA.appointments[i];

        //Skip if appointment is not for specific doctor OR not for today
        if (appt.doctorID !== doctor.doctorID || appt.date !== todayString) {
            continue;
        }

        found = true;

        //Check patients for appointment.
        var patient = null;
        for (var j = 0; j < DDATA.patients.length; j++) {
            if (DDATA.patients[j].patientID === appt.patientID) {
                patient = DDATA.patients[j];
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

//It will show booking notifications for this specific doctor.
function showBookingNotifications(doctor) {
    //Get list of where requests will go.
    var list = document.getElementById("bookingNotifList");
    list.innerHTML = "";

    //Counter for pending requests.
    var count = 0;

    //Loop through booking requests.
    for (var i = 0; i < DDATA.bookingRequests.length; i++) {
        var req = DDATA.bookingRequests[i];

        //Skip if the request is not for this doctor OR not still pending.
        if (req.doctorID !== doctor.doctorID || req.status !== "pending") {
            continue;
        }

        count++;

        //Find the patient who sent this request so we can show their name.
        var patient = null;
        for (var j = 0; j < DDATA.patients.length; j++) {
            if (DDATA.patients[j].patientID === req.patientID) {
                patient = DDATA.patients[j];
                break;
            }
        }

        //Check patient name for display, else "Unknown patient"
        var patientName = patient ? patient.firstName + " " + patient.lastName : "Unknown patient";

        //Format the date.
        var dateText = new Date(req.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        //Build the request row with Accept and Decline buttons.
        //The buttons carry the request ID so the click handler knows which one to update.
        var item = document.createElement("li");
        item.className = "booking_notif_item";
        item.setAttribute("data-request-id", req.requestID);
        item.innerHTML =
            '<div class="booking_notif_body">' +
                '<p class="booking_notif_name">' + patientName + '</p>' +
                '<p class="booking_notif_meta">' + dateText + ' · ' + req.time + ' · ' + req.reason + '</p>' +
            '</div>' +
            '<div class="booking_notif_actions">' +
                '<button type="button" class="btn_accept" data-request-id="' + req.requestID + '">Accept</button>' +
                '<button type="button" class="btn_decline" data-request-id="' + req.requestID + '">Decline</button>' +
            '</div>';
        //Append new list to booking_notif_item
        list.appendChild(item);
    }

    //Show the count in the header.
    document.getElementById("bookingNotifCount").textContent = count + " pending";

    //If there are no pending requests, show a friendly message.
    if (count === 0) {
        list.innerHTML = "<li class='booking_notif_empty'>No pending booking requests.</li>";
    }

    //Call to attach the click handlers to the Accept and Decline buttons we just built.
    setupBookingButtons();
}


//It attaches click handlers to every Accept and Decline button in the booking panel.
function setupBookingButtons() {
    //Accept buttons.
    var acceptBtns = document.querySelectorAll(".btn_accept");
    for (var i = 0; i < acceptBtns.length; i++) {
        acceptBtns[i].addEventListener("click", function() {
            var requestID = this.getAttribute("data-request-id");
            handleBookingDecision(requestID, "accepted");
        });
    }

    //Decline buttons.
    var declineBtns = document.querySelectorAll(".btn_decline");
    for (var i = 0; i < declineBtns.length; i++) {
        declineBtns[i].addEventListener("click", function() {
            var requestID = this.getAttribute("data-request-id");
            handleBookingDecision(requestID, "declined");
        });
    }
}


//It updates a booking request when the doctor accepts or declines it.
//WRITES: updates the booking_requests record, and on "accepted" also creates a new appointments record. 
//Both persist to IndexedDB so the patient sees the result on reload.
function handleBookingDecision(requestID, decision) {
    //Find the request in the cached booking requests.
    for (var i = 0; i < DDATA.bookingRequests.length; i++) {
        if (DDATA.bookingRequests[i].requestID === requestID) {
            //Update its status to "accepted" or "declined".
            DDATA.bookingRequests[i].status = decision;
            //Record when the decision was made (fixed key name: decidedAt, matching the schema).
            DDATA.bookingRequests[i].decidedAt = Date.now();

            //Persist the updated request to IndexedDB.
            putRecord("booking_requests", DDATA.bookingRequests[i]);

            //If doctor accepted, turn request into a real booked appointment so it shows in patient's 'Upcoming'
            if (decision === "accepted") {
                var req = DDATA.bookingRequests[i];
                var newAppt = {
                    //Unique, collision-safe appointment ID (was "ap"+length+100, which could clash).
                    appointmentID: "ap" + Date.now(),
                    patientID: req.patientID,
                    doctorID: req.doctorID,
                    date: req.date,
                    time: req.time,
                    reason: req.reason,
                    status: "booked",
                    notes: "",
                    bookedBy: req.patientID,
                    checkInStatus: "pending"
                };
                //Keep the cache in sync and persist the new appointment.
                DDATA.appointments.push(newAppt);
                putRecord("appointments", newAppt);

                //Side-effect: if this patient has a guardian, notify them of the booking.
                var apptDate = new Date(req.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                createNotificationForPatient(
                    req.patientID,
                    "appt",
                    "An appointment was booked for " + apptDate + " at " + req.time + " (" + req.reason + ")."
                );
            }

            break;
        }
    }

    //Refresh the panel so the handled request disappears and the count updates.
    var doctor = getLoggedInDoctor();
    showBookingNotifications(doctor);
    showTodayAppointments(doctor);
    showDoctorStats(doctor);
}

//It makes every status pill in "Today's patient" clickable
//When clicked, it will cycle from Waiting, In Progress, Done, Waiting...
//WRITES: persists the new checkInStatus on the appointments record.
function setupStatusPills() {
    //Selects all elements that have class status_pill and will return an array.
    var pills = document.querySelectorAll(".status_pill");

    for (var i = 0; i < pills.length; i++) {
        pills[i].addEventListener("click", function() {
            //Find parent list which carries appointment ID
            //E.g would be 'AP001' in dummy data
            var item = this.parentNode;
            var apptID = item.getAttribute("data-appt-id");

            //Look for appointment in the cached appointments.
            var appt = null;
            for (var j = 0; j < DDATA.appointments.length; j++) {
                if (DDATA.appointments[j].appointmentID === apptID) {
                    appt = DDATA.appointments[j];
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

            //It will update appointment with new status.
            appt.checkInStatus = newStatus;

            //Persist the status change to IndexedDB.
            putRecord("appointments", appt);

            //It will update the visible pill text while cycling and dynamic colour class
            this.textContent = newLabel;
            this.className = "status_pill status_" + newStatus;

            //It will get data from current doctor and stat cards auto update at the top of the page.
            var doctor = getLoggedInDoctor();
            showDoctorStats(doctor);
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

    //Loop through cached appointments and count by status.
    for (var i = 0; i < DDATA.appointments.length; i++) {
        var appt = DDATA.appointments[i];

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

    //Loop through cached patients.
    for (var i = 0; i < DDATA.patients.length; i++) {
        var p = DDATA.patients[i];

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
    //Look for patient in the cached patients.
    var patient = null;
    for (var i = 0; i < DDATA.patients.length; i++) {
        if (DDATA.patients[i].patientID === patientID) {
            patient = DDATA.patients[i];
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

    //Loop through the cached patients.
    for (var i = 0; i < DDATA.patients.length; i++) {
        if (DDATA.patients[i].patientID === patientID) {
            return DDATA.patients[i];
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
    for (var i = 0; i < DDATA.history.length; i++) {
        if (DDATA.history[i].patientID === patient.patientID) {
            entries.push(DDATA.history[i]);
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

    for (var i = 0; i < DDATA.prescriptions.length; i++) {
        var rx = DDATA.prescriptions[i];

        //Skip if prescription does not belong to current patient OR prescription not active
        if (rx.patientID !== patient.patientID || rx.status !== "active") continue;

        found = true;

        //Loop through cached medicines to see if medicineID = prescription medicineID
        var med = null;
        for (var j = 0; j < DDATA.medicines.length; j++) {
            if (DDATA.medicines[j].medicineID === rx.medicineID) {
                med = DDATA.medicines[j];
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

    while(select.options.length > 1) {
        select.remove(1)
    }
    //Loop through cached medicines
    //Create option element, medicineID & set visible text of medicine details.
    for (var i = 0; i < DDATA.medicines.length; i++) {
        var option = document.createElement("option");
        option.value = DDATA.medicines[i].medicineID;
        option.textContent = DDATA.medicines[i].name + " " + DDATA.medicines[i].strength + " · " + DDATA.medicines[i].form;
        //Append option to select element.
        select.appendChild(option);
    }
}


//It sets up clinical note form submission
//WRITES: a new medicalHistory record, persisted to IndexedDB.
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

        //Build a new history entry. historyID is the keyPath of the medicalHistory store,
        //so it MUST be set or the record cannot be stored (this was missing before).
        var newEntry = {
            historyID: "h" + Date.now(),
            patientID: patient.patientID,
            date: new Date().toISOString().slice(0, 10),
            type: "diagnosis",
            title: title,
            description: noteText,
            recordedBy: getLoggedInDoctor().doctorID
        };

        //Keep the cache in sync and persist to IndexedDB.
        DDATA.history.push(newEntry);
        putRecord("medicalHistory", newEntry);

        //Side-effect: if this patient has a guardian, notify them a new record is available.
        createNotificationForPatient(
            patient.patientID,
            "result",
            "A new medical record was added: " + title + "."
        );

        //Show success message and reset form.
        successMsg.hidden = false;
        form.reset();

        //Call function to refresh medical history list and new note shows up immediately.
        showRecordHistory(patient);
    });
}


//It will setup prescription form submission.
//WRITES: a new prescriptions record, persisted to IndexedDB.
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


        //Build new prescription. prescriptionID is the keyPath of the prescriptions store,
        //so it MUST be set or the record cannot be stored (this was missing before).
        var newRx = {
            prescriptionID: "rx" + Date.now(),
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

        //Keep the cache in sync and persist to IndexedDB.
        DDATA.prescriptions.push(newRx);
        putRecord("prescriptions", newRx);

        //Side-effect: if this patient has a guardian, notify them of the new prescription.
        //Look up the medicine name for a friendlier message (falls back to a generic line).
        var medName = "a new medicine";
        for (var m = 0; m < DDATA.medicines.length; m++) {
            if (DDATA.medicines[m].medicineID === medicineID) {
                medName = DDATA.medicines[m].name;
                break;
            }
        }
        createNotificationForPatient(
            patient.patientID,
            "rx",
            "A new prescription was issued: " + medName + " for " + Number(duration) + " days."
        );

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


//Prescription request panel.
//Shows all pending prescription requests addressed to this doctor.
//Accept: creates a real prescriptions record (same as the rx form) and notifies guardian.
//Decline: updates the request status to "declined" and notifies guardian.

//It shows prescription requests addressed to this doctor.
function showPrescriptionRequests(doctor) {
    var list = document.getElementById("rxRequestNotifList");
    if (!list) return;
 
    list.innerHTML = "";
    var count = 0;
 
    for (var i = 0; i < DDATA.prescriptionRequests.length; i++) {
        var req = DDATA.prescriptionRequests[i];
        if (req.doctorID !== doctor.doctorID || req.status !== "pending") continue;
        count++;
 
        //Look up patient.
        var patient = null;
        for (var j = 0; j < DDATA.patients.length; j++) {
            if (DDATA.patients[j].patientID === req.patientID) { patient = DDATA.patients[j]; break; }
        }
        var initials    = patient ? patient.firstName[0] + patient.lastName[0] : "?";
        var patientName = patient ? patient.firstName + " " + patient.lastName  : "Unknown patient";
 
        //Look up medicine.
        var med = null;
        for (var k = 0; k < DDATA.medicines.length; k++) {
            if (DDATA.medicines[k].medicineID === req.medicineID) { med = DDATA.medicines[k]; break; }
        }
        var medName = med ? med.name + " " + med.strength : "Unknown medicine";
 
        //Format date.
        var dateText = new Date(req.submittedAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });
 
        //Build list of patient's ACTIVE prescriptions for the review panel.
        var activeMeds = "";
        var activeCount = 0;
        for (var a = 0; a < DDATA.prescriptions.length; a++) {
            var rx = DDATA.prescriptions[a];
            if (rx.patientID !== req.patientID || rx.status !== "active") continue;
            activeCount++;
            var rxMed = null;
            for (var b = 0; b < DDATA.medicines.length; b++) {
                if (DDATA.medicines[b].medicineID === rx.medicineID) { rxMed = DDATA.medicines[b]; break; }
            }
            activeMeds += '<span class="rx_review_active_pill">' + (rxMed ? rxMed.name + " " + rxMed.strength : "Unknown") + '</span>';
        }
        if (activeCount === 0) activeMeds = '<span class="rx_review_none">None on record</span>';
 
        //Unique ID for this row's detail panel.
        var panelID = "rxReview_" + req.rxRequestID;
 
        var item = document.createElement("li");
        item.className = "rx_req_row";
        item.setAttribute("data-rxr-id", req.rxRequestID);
        item.innerHTML =
            //Compact Row;
            '<div class="rx_req_row_summary">' +
                '<div class="rx_req_avatar">' + initials + '</div>' +
                '<div class="rx_req_row_body">' +
                    '<p class="rx_req_row_name">' + patientName + '</p>' +
                    '<p class="rx_req_row_meta">' + medName + ' · ' + dateText + '</p>' +
                '</div>' +
                '<button type="button" class="btn_rx_review" data-panel="' + panelID + '">Review</button>' +
            '</div>' +
 
            //Expandable review panel;
            '<div class="rx_review_panel" id="' + panelID + '" hidden>' +
 
                //Patient context
                '<div class="rx_review_context">' +
                    '<p class="rx_review_label">Current active prescriptions</p>' +
                    '<div class="rx_review_active_list">' + activeMeds + '</div>' +
                    (req.notes
                        ? '<p class="rx_review_label" style="margin-top:8px">Patient\'s note</p>' +
                          '<p class="rx_review_note">"' + req.notes + '"</p>'
                        : "") +
                '</div>' +
 
                //Prescription detail form.
                '<div class="rx_review_form">' +
                    '<p class="rx_review_label">Prescription details</p>' +
 
                    '<div class="rx_review_fields">' +
 
                        '<div class="rx_review_field">' +
                            '<label class="rx_review_field_label">Dosage</label>' +
                            '<select class="rx_review_select" data-field="dosage" data-rxr="' + req.rxRequestID + '">' +
                                '<option value="">Select…</option>' +
                                '<option>250mg</option>' +
                                '<option>500mg</option>' +
                                '<option>1g</option>' +
                                '<option>5mg</option>' +
                                '<option>10mg</option>' +
                                '<option>20mg</option>' +
                                '<option>25mg</option>' +
                                '<option>50mg</option>' +
                                '<option>100mg</option>' +
                            '</select>' +
                        '</div>' +
 
                        '<div class="rx_review_field">' +
                            '<label class="rx_review_field_label">Frequency</label>' +
                            '<select class="rx_review_select" data-field="frequency" data-rxr="' + req.rxRequestID + '">' +
                                '<option value="">Select…</option>' +
                                '<option>Once daily</option>' +
                                '<option>Twice daily</option>' +
                                '<option>Three times daily</option>' +
                                '<option>Four times daily</option>' +
                                '<option>Every 8 hours</option>' +
                                '<option>As needed</option>' +
                            '</select>' +
                        '</div>' +
 
                        '<div class="rx_review_field">' +
                            '<label class="rx_review_field_label">Duration</label>' +
                            '<select class="rx_review_select" data-field="duration" data-rxr="' + req.rxRequestID + '">' +
                                '<option value="">Select…</option>' +
                                '<option value="3">3 days</option>' +
                                '<option value="5">5 days</option>' +
                                '<option value="7">7 days</option>' +
                                '<option value="14">14 days</option>' +
                                '<option value="28">28 days</option>' +
                                '<option value="90">3 months</option>' +
                                '<option value="180">6 months</option>' +
                                '<option value="365">Ongoing (1 year)</option>' +
                            '</select>' +
                        '</div>' +
 
                    '</div>' +
 
                    '<div class="rx_review_field" style="margin-top:8px">' +
                        '<label class="rx_review_field_label">Special instructions <span class="rx_review_optional">(optional)</span></label>' +
                        '<input class="rx_review_input" type="text" data-field="instructions" data-rxr="' + req.rxRequestID + '"' +
                            ' placeholder="e.g. Take after meals, avoid alcohol…" />' +
                    '</div>' +
 
                    '<p class="rx_review_error" id="rxErr_' + req.rxRequestID + '" hidden>Please fill in all required fields.</p>' +
 
                    '<div class="rx_review_actions">' +
                        '<button type="button" class="btn_rx_confirm" data-rxr-id="' + req.rxRequestID + '">Confirm Prescription</button>' +
                        '<button type="button" class="btn_rx_decline" data-rxr-id="' + req.rxRequestID + '">Decline</button>' +
                    '</div>' +
                '</div>' +
 
            '</div>';
 
        list.appendChild(item);
    }
 
    var countEl = document.getElementById("rxRequestNotifCount");
    if (countEl) countEl.textContent = count + " pending";
 
    if (count === 0) {
        list.innerHTML = "<li class='booking_notif_empty'>No pending prescription requests.</li>";
    }
 
    setupRxRequestButtons();
}
 
 
//It wires the Review toggle and the Confirm/Decline buttons in the prescription request panel.
function setupRxRequestButtons() {
    //Review button toggles the detail panel for that row.
    var reviewBtns = document.querySelectorAll(".btn_rx_review");
    for (var i = 0; i < reviewBtns.length; i++) {
        reviewBtns[i].addEventListener("click", function() {
            var panelID = this.getAttribute("data-panel");
            var panel   = document.getElementById(panelID);
            if (!panel) return;
            var isOpen = !panel.hidden;
            //Close all other panels first.
            var allPanels = document.querySelectorAll(".rx_review_panel");
            for (var p = 0; p < allPanels.length; p++) {
                allPanels[p].hidden = true;
            }
            var allBtns = document.querySelectorAll(".btn_rx_review");
            for (var b = 0; b < allBtns.length; b++) {
                allBtns[b].textContent = "Review";
            }
            //Toggle this one.
            panel.hidden = isOpen;
            this.textContent = isOpen ? "Review" : "Close";
        });
    }
 
    //Confirm Prescription — validates the detail form then creates the prescription.
    var confirmBtns = document.querySelectorAll(".btn_rx_confirm");
    for (var i = 0; i < confirmBtns.length; i++) {
        confirmBtns[i].addEventListener("click", function() {
            var rxrID = this.getAttribute("data-rxr-id");
            confirmRxRequest(rxrID);
        });
    }
 
    //Decline.
    var declineBtns = document.querySelectorAll(".btn_rx_decline");
    for (var i = 0; i < declineBtns.length; i++) {
        declineBtns[i].addEventListener("click", function() {
            handleRxRequestDecision(this.getAttribute("data-rxr-id"), "declined", null, null, null, null);
        });
    }
}
 
 
//It reads the detail form for a given rxRequestID, validates it, then calls handleRxRequestDecision.
function confirmRxRequest(rxRequestID) {
    //Read each field using data-field + data-rxr attributes.
    var selects = document.querySelectorAll('.rx_review_select[data-rxr="' + rxRequestID + '"]');
    var input   = document.querySelector('.rx_review_input[data-rxr="' + rxRequestID + '"]');
 
    var dosage       = "";
    var frequency    = "";
    var durationDays = 0;
 
    for (var i = 0; i < selects.length; i++) {
        var field = selects[i].getAttribute("data-field");
        var val   = selects[i].value;
        if (field === "dosage")    dosage = val;
        if (field === "frequency") frequency = val;
        if (field === "duration")  durationDays = Number(val);
    }
 
    var instructions = input ? input.value.trim() : "";
    var errorEl = document.getElementById("rxErr_" + rxRequestID);
 
    //Validate — all three dropdowns required.
    if (!dosage || !frequency || !durationDays) {
        if (errorEl) errorEl.hidden = false;
        return;
    }
    if (errorEl) errorEl.hidden = true;
 
    handleRxRequestDecision(rxRequestID, "accepted", dosage, frequency, durationDays, instructions);
}
 
 
//It processes the doctor's decision on a prescription request.
//UPDATES: the prescription_requests record (status + decidedAt).
//On accept: ADDS a new prescriptions record with the doctor-chosen clinical values.
//Side-effect: notifies guardian if patient is a child.
function handleRxRequestDecision(rxRequestID, decision, dosage, frequency, durationDays, instructions) {
    for (var i = 0; i < DDATA.prescriptionRequests.length; i++) {
        var req = DDATA.prescriptionRequests[i];
        if (req.rxRequestID !== rxRequestID) continue;
 
        //UPDATE the request record.
        req.status    = decision;
        req.decidedAt = Date.now();
        putRecord("prescription_requests", req);
 
        //Look up medicine name for the notification message.
        var med = null;
        for (var k = 0; k < DDATA.medicines.length; k++) {
            if (DDATA.medicines[k].medicineID === req.medicineID) { med = DDATA.medicines[k]; break; }
        }
        var medName = med ? med.name : "a medicine";
 
        if (decision === "accepted") {
            //ADD a real prescription with the doctor-supplied clinical values.
            var newRx = {
                prescriptionID: "rx" + Date.now(),
                patientID:      req.patientID,
                doctorID:       req.doctorID,
                medicineID:     req.medicineID,
                dosage:         dosage,
                frequency:      frequency,
                durationDays:   durationDays,
                dateIssued:     new Date().toISOString().slice(0, 10),
                instructions:   instructions || "",
                status:         "active"
            };
            DDATA.prescriptions.push(newRx);
            putRecord("prescriptions", newRx);
 
            createNotificationForPatient(
                req.patientID, "rx",
                "Your prescription request for " + medName + " has been accepted."
            );
        } else {
            createNotificationForPatient(
                req.patientID, "rx",
                "Your prescription request for " + medName + " was declined. Please book an appointment."
            );
        }
 
        break;
    }
 
    //Refresh the panel.
    showPrescriptionRequests(getLoggedInDoctor());
}
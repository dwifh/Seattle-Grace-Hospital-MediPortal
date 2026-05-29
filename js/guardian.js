//CONSENT_ITEMS & NOTIFICATIONS are hardcoded for Phase 1.

//List of items that guardian is authorised to see for patient.
var CONSENT_ITEMS = [
    { label: "Medical history", granted: true },
    { label: "Active prescriptions", granted: true },
    { label: "Appointments", granted: true },
    { label: "Allergies and blood group", granted: true },
    { label: "Lab test results", granted: true },
    { label: "Mental health records", granted: false },
    { label: "Genetic test results", granted: false }
];

//Alert notifs about ward, newer notifications come first then a backlog of old notifs.
var NOTIFICATIONS = [
    { type: "result", title: "New test result available", message: "Liam's spirometry test result has been uploaded by Dr Khan.", date: "2026-05-26" },
    { type: "appt", title: "Appointment rescheduled", message: "Liam's asthma review has been moved to 25 May 12:00.", date: "2026-05-20" },
    { type: "rx", title: "Prescription renewed", message: "Salbutamol inhaler prescription has been renewed for 90 days.", date: "2026-04-02" },
    { type: "appt", title: "New appointment booked", message: "Asthma review booked for 25 May 2026 at 10:15.", date: "2026-03-15" }
];


//It will check session storage, find guardianID.
function getLoggedInGuardian() {

    var savedID = sessionStorage.getItem("guardianID");

    //Loop through GUARDIAN array.
    for (var i = 0; i < GUARDIAN.length; i++) {

        //If it matches from session storage, it's our user.
        if (GUARDIAN[i].guardianID === savedID) {
            return GUARDIAN[i];
        }
    }
    //Sinead O'Connor is our demo guardian.
    for (var i = 0; i < GUARDIAN.length; i++) {
        if (GUARDIAN[i].guardianID === "g001") {
            return GUARDIAN[i];
        }
    }
    //If no matches, return null.
    return null;
}

//It will find patient that is linked to guardian.
function getWardForGuardian(guardian) {
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].patientID === guardian.linkedPatientID) {
            return PATIENTS[i];
        }
    }
    return null;
}

//It will call other functions that will fill the dashboard.
function loadGuardianDashboard() {
    //Get guardian login.
    var guardian = getLoggedInGuardian();

    //If guardian not found, show "No guardian found" and will exit function.
    if (!guardian) {
        console.log("No guardian found");
        return;
    }

    //Find patient that guardian is linked to view them.
    var ward = getWardForGuardian(guardian);

    //If no ward is linked, stop.
    if (!ward) {
        console.log("No linked patient found for this guardian");
        return;
    }

    showGuardianName(guardian);
    showWardBanner(guardian, ward);
    showWardStats(ward);
    showConsentLog();
    showNotifications();
    showWardHistory(ward);
    showWardPrescriptions(ward);
}

//It will display guardian name in welcome message on top of dashboard.
function showGuardianName(guardian) {
    document.getElementById("guardianName").textContent = guardian.firstName + " " + guardian.lastName;
}

//It will display banner details of the ward.
function showWardBanner(guardian, ward) {
    //Ward initials.
    document.getElementById("wardInitials").textContent = ward.firstName[0] + ward.lastName[0];
    //Full name of ward.
    document.getElementById("wardName").textContent = ward.firstName + " " + ward.lastName;
    //Relationship of guardian and ward.
    document.getElementById("wardRelationship").textContent = "Your " + guardian.relationship;
    //Consent status, whether it's pending or active.
    document.getElementById("consentStatus").textContent = guardian.consentGranted ? "Active" : "Pending";
    document.getElementById("consentDate").textContent = "Granted on " + guardian.consentDate;
}


//It will show summary stat cards of the ward.
function showWardStats(ward) {
    //APPOINTMENTS SECTION
    var nextAppointment = null;

    //Loop through APPOINTMENTS array.
    for (var i = 0; i < APPOINTMENTS.length; i++) {

        var appt = APPOINTMENTS[i];
        //Skip if appointment not for ward OR status not booked.
        if (appt.patientID !== ward.patientID || appt.status !== "booked") {
            continue;
        }
        //If the appointment is in the future and is sooner than any previously found upcoming appointment, it becomes the new nextAppointment.
        if (nextAppointment === null || appt.date < nextAppointment.date) {
            nextAppointment = appt;
        }
    }
    //It displays the date and time of the next appointment on the dashboard.
    //However, if there are no upcoming appointments, it can display a message
    if (nextAppointment !== null) {
        var apptDate = new Date(nextAppointment.date);
        var dateText = apptDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

        //Find the doctor for this appointment by looping through DOCTORS array and matching doctorID.
        var apptDoctor = null;
        for (var i = 0; i < DOCTORS.length; i++) {
            if (DOCTORS[i].doctorID === nextAppointment.doctorID) {
                apptDoctor = DOCTORS[i];
                break;
            }
        }
        //Display the date of the next appointment and the time + doctor details in the stats section of the dashboard.
        document.getElementById("g_statNextAppt").textContent = dateText;
        document.getElementById("g_statNextApptMeta").textContent = nextAppointment.time + " · Dr " + apptDoctor.lastName;
    } else {
        //If no upcoming appointments, display "-" for the date and a message in the meta text. 
        document.getElementById("g_statNextAppt").textContent = "-";
        document.getElementById("g_statNextApptMeta").textContent = "No upcoming appointments";
    }

    //PRESCRIPTION SECTION
    var rxCount = 0;
    var firstMedName = "";

    for (var i = 0; i < PRESCRIPTIONS.length; i++) {
        ////If the prescription is not for this patient OR if the prescription status is not "active", skip it.
        if (PRESCRIPTIONS[i].patientID !== ward.patientID || PRESCRIPTIONS[i].status !== "active") continue;

        //Increment the prescription counter till active prescription.
        rxCount++;

        //If it's the first active prescription found, find the medicine name by matching medicineID.
        if (rxCount === 1) {
            for (var j = 0; j < MEDICINES.length; j++) {
                //If medicineID matches, store the medicine name and duration in a variable, then break the loop.
                if (MEDICINES[j].medicineID === PRESCRIPTIONS[i].medicineID) {
                    firstMedName = MEDICINES[j].name + " · " + PRESCRIPTIONS[i].durationDays + " days";
                    break;
                }
            }
        }
    }

    //Display the prescription count and the name of the first active prescription.
    //'?' condition = shows value if true & value if false.
    document.getElementById("g_statRxCount").textContent = rxCount;
    document.getElementById("g_statRxSub").textContent = rxCount > 0 ? firstMedName : "No active prescriptions";

    //BLOOD GROUP SECTION
    document.getElementById("g_statBloodGroup").textContent = ward.bloodGroup;

    //VITALS SECTION
    var vitalsRecord = null;
    //Loop through VITALS array to find the vitals record for this patient by matching patientID.
    for (var i = 0; i < VITALS.length; i++) {
        if (VITALS[i].patientID === ward.patientID) {
            vitalsRecord = VITALS[i];
            break;
        }
    }

    //If vitals record is found, display the date of the last vitals record. 
    //If not found, display a message like "No vitals recorded".
    if (vitalsRecord) {
        var vitalsDate = new Date(vitalsRecord.lastUpdated);
        document.getElementById("g_statVitalsDate").textContent = vitalsDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    } else {
        document.getElementById("g_statVitalsDate").textContent = "No vitals recorded";
    }

    //ALLERGIES SECTION
    var allergies = ward.allergies;
    //Display the number of allergies and a preview of the first allergy. If no allergies, show "No allergies".
    document.getElementById("g_statAllergiesCount").textContent = allergies.length;
    document.getElementById("g_statAllergiesList").textContent = allergies.length > 0 ? allergies.join(", ") : "None";
}


//It shows the consent log and what the guardian is allowed to see.
function showConsentLog() {
    var list = document.getElementById("consentList");
    list.innerHTML = "";

    //Loop through CONSENT_ITEMS and build a list of item for each.
    for (var i = 0; i < CONSENT_ITEMS.length; i++) {
        var c = CONSENT_ITEMS[i];

        //Icon and class for different status of consent.
        var icon = c.granted ? "✓" : "✗";
        var statusClass = c.granted ? "consent_granted" : "consent_denied";
        var statusLabel = c.granted ? "Granted" : "Not granted";

        //Create new HTML element & css class.
        var item = document.createElement("li");
        item.className = "consent_item";
        item.innerHTML =
            '<span class="consent_icon ' + statusClass + '">' + icon + '</span>' +
            '<p class="consent_label">' + c.label + '</p>' +
            '<span class="consent_status ' + statusClass + '">' + statusLabel + '</span>';
        //Append new list to item.
        list.appendChild(item);
    }
}


//It will show notification panel using NOTIFICATIONS array.
function showNotifications() {
    //Create ordered list for notification list.
    var list = document.getElementById("notifList");
    list.innerHTML = "";

    //Update count badge in header.
    document.getElementById("notifCount").textContent = NOTIFICATIONS.length + " new";

    for (var i = 0; i < NOTIFICATIONS.length; i++) {
        var n = NOTIFICATIONS[i];

        //Use icons to facilitate notification type.
        var icon = "🔔";
        if (n.type === "result") icon = "🧪";
        if (n.type === "appt") icon = "📅";
        if (n.type === "rx") icon = "💊";

        //Format date.
        var dateText = new Date(n.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        var item = document.createElement("li");
        item.className = "notif_item";
        item.innerHTML =
            '<div class="notif_icon">' + icon + '</div>' +
            '<div class="notif_body">' +
                '<p class="notif_title">' + n.title + '</p>' +
                '<p class="notif_message">' + n.message + '</p>' +
                '<p class="notif_date">' + dateText + '</p>' +
            '</div>';
        //Append new list in notif_item.
        list.appendChild(item);
    }
}


//It shows medical history of ward but in read-only.
function showWardHistory(ward) {
    //Get ordered list for medical history.
    var timeline = document.getElementById("g_historyTimeline");
    timeline.innerHTML = "";

    //Select specific ward history and push into their own array.
    var entries = [];
    for (var i = 0; i < MEDICAL_HISTORY.length; i++) {
        if (MEDICAL_HISTORY[i].patientID === ward.patientID) {
            entries.push(MEDICAL_HISTORY[i]);
        }
    }

    //Sort newest medical history timeline using sort() function(used in doctor and patient js)
    entries.sort(function(a, b) {
        var dateA = a.date ? new Date(a.date) : new Date(0);
        var dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });

    //If 0 entries, display message.
    if (entries.length === 0) {
        timeline.innerHTML = "<li>No medical history on record.</li>";
        return;
    }

    //Build card list for each entry
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        //format date if exists
        var dateText = entry.date ? new Date(entry.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric"}) : "Unknown date";
        var badgeClass = "badge_" + entry.type;
        var typeLabel = entry.type.replace("_", " ");

        //Create ordered list for timeline.
        var item = document.createElement("li");
        item.className = "timeline_item";
        item.setAttribute("data-type", entry.type);
        item.innerHTML =
            '<div class="timeline_item_dot"></div>' +
            '<div class="timeline_item_body">' +
                '<p class="timeline_item_date">' + dateText + '</p>' +
                '<p class="timeline_item_title">' + entry.title + '</p>' +
                '<p class="timeline_item_desc">' + entry.description + '</p>' +
                '<span class="' + badgeClass + '">' + typeLabel + '</span>' +
            '</div>';
        //Append new list to timeline_item.
        timeline.appendChild(item);
    }
}


//It shows ward's prescription but read only.
function showWardPrescriptions(ward) {
    //Get the unordered list where the items will go
    var list = document.getElementById("g_rxGrid");
    list.innerHTML = "";
    //Boolean condition to track if found at least 1 prescription
    var found = false;

    for (var i = 0; i < PRESCRIPTIONS.length; i++) {
        var rx = PRESCRIPTIONS[i];
        //Skip prescriptions that belongs to other patients
        if (rx.patientID !== ward.patientID) continue;
        //Prescription has been found
        found = true;

        //Look up MEDICINES details using medicineID stored in PRESCRIPTIONS
        var med = null;
        for (var j = 0; j < MEDICINES.length; j++) {
            if (MEDICINES[j].medicineID === rx.medicineID) {
                med = MEDICINES[j];
                break;
            }
        }
        //Combine name and strength, if medicine not found, display "Unknown"
        var medName = med ? med.name + " " + med.strength : "Unknown";

        var item = document.createElement("li");
        item.className = "rx_item";
        item.innerHTML =
            '<div class="rx_item_pill">💊</div>' +
            '<div class="rx_item_body">' +
                '<p class="rx_item_name">' + medName + '</p>' +
                '<p class="rx_item_dose">' + rx.dosage + ' · ' + rx.frequency + ' · ' + rx.durationDays + ' days</p>' +
                '<p class="rx_item_note">' + rx.instructions + '</p>' +
            '</div>' +
            '<span class="badge_active">Active</span>';
        //Append new list to rx_item.
        list.appendChild(item);
    }

    //if the loop finished without finding any prescriptions, show a message.
    if (!found) {
        list.innerHTML = "<li>No prescriptions found.</li>";
    }
}
//guardian.js wired to IndexedDB.

//CONSENT_ITEMS is intentionally kept in code, not in a store: the schema models consent as a single guardian.consentGranted flag, not per-category
var CONSENT_ITEMS = [
    { label: "Medical history",          grantable: true  },
    { label: "Active prescriptions",     grantable: true  },
    { label: "Appointments",             grantable: true  },
    { label: "Allergies and blood group",grantable: true  },
    { label: "Lab test results",         grantable: true  },
    { label: "Mental health records",    grantable: false },
    { label: "Genetic test results",     grantable: false }
];

//Hardcoded notifications kept ONLY as the dummy-data fallback for the guardian dashboard,
//Used if the notifications store is empty/unseeded.
var NOTIFICATIONS = [
    { type: "result", message: "Liam's spirometry test result has been uploaded by Dr Khan.", createdAt: "2026-05-26", recipientID: "sinead.oconnor" },
    { type: "appt",   message: "Liam's asthma review has been moved to 25 May 2026 at 12:00.", createdAt: "2026-05-20", recipientID: "sinead.oconnor" },
    { type: "rx",     message: "Salbutamol inhaler prescription has been renewed for 90 days.", createdAt: "2026-04-02", recipientID: "sinead.oconnor" },
    { type: "appt",   message: "Asthma review booked for 25 May 2026 at 10:15.", createdAt: "2026-03-15", recipientID: "sinead.oconnor" }
];


//GDATA is the module-level cache for the guardian dashboard, filled once by loadGuardianData()
var GDATA = {
    guardian: null,
    ward: null,
    doctors: [],
    appointments: [],
    prescriptions: [],
    medicines: [],
    history: [],
    vitals: [],
    notifications: []
};


//loadStoreG fetches every record from one store, or returns the dummy-data fallback if empty.
function loadStoreG(storeName, fallbackArray, callback) {
    getAllRecords(storeName, function(records) {
        if (records && records.length > 0) {
            callback(records);
        } else {
            callback(fallbackArray);
        }
    });
}

//Fallback lookup for the logged-in guardian from the dummy-data GUARDIAN array.
function findGuardianInDummy(guardianID) {
    for (var i = 0; i < GUARDIAN.length; i++) {
        if (GUARDIAN[i].guardianID === guardianID) {
            return GUARDIAN[i];
        }
    }
    //Demo fallback — Sinead O'Connor (g001).
    for (var i = 0; i < GUARDIAN.length; i++) {
        if (GUARDIAN[i].guardianID === "g001") {
            return GUARDIAN[i];
        }
    }
    return null;
}

//It will check the session, find guardianID, and return the cached guardian record.
//If the cache isn't ready, falls back to a synchronous dummy lookup.
function getLoggedInGuardian() {
    if (GDATA.guardian) {
        return GDATA.guardian;
    }
    var session = getSession();
    var guardianID = (session && session.guardianID) ? session.guardianID : "g001";
    return findGuardianInDummy(guardianID);
}

//It will find the patient (ward) that is linked to the guardian, from the cached patients.
function getWardForGuardian(guardian) {
    for (var i = 0; i < GDATA.patients.length; i++) {
        if (GDATA.patients[i].patientID === guardian.linkedPatientID) {
            return GDATA.patients[i];
        }
    }
    return null;
}

//loadGuardianData fills GDATA from IndexedDB (with dummy-data fallback), resolves the guardian
//and their ward, then calls onReady.
function loadGuardianData(onReady) {
    var session = getSession();
    var guardianID = (session && session.guardianID) ? session.guardianID : "g001";

    //Load the guardian profile — IndexedDB first, dummy-data fallback.
    getRecord("guardians", guardianID, function(record) {
        GDATA.guardian = record ? record : findGuardianInDummy(guardianID);

        var jobs = [
            ["patients",       PATIENTS,        "patients"],
            ["doctors",        DOCTORS,         "doctors"],
            ["appointments",   APPOINTMENTS,    "appointments"],
            ["prescriptions",  PRESCRIPTIONS,   "prescriptions"],
            ["medicines",      MEDICINES,       "medicines"],
            ["medicalHistory", MEDICAL_HISTORY, "history"],
            ["vitals",         VITALS,          "vitals"],
            ["notifications",  NOTIFICATIONS,   "notifications"]
        ];

        var remaining = jobs.length;
        for (var i = 0; i < jobs.length; i++) {
            (function(job) {
                loadStoreG(job[0], job[1], function(records) {
                    GDATA[job[2]] = records;
                    remaining--;
                    if (remaining === 0) {
                        //Resolve the ward now that patients are loaded.
                        GDATA.ward = getWardForGuardian(GDATA.guardian);
                        onReady();
                    }
                });
            })(jobs[i]);
        }
    });
}


//Reads need GDATA.patients loaded first (for getWardForGuardian), so it's done inside loadGuardianData.
//It opens the DB, loads all data, resolves guardian + ward, then renders.
function loadGuardianDashboard() {
    openDatabase(function() {
        loadGuardianData(function() {
            var guardian = GDATA.guardian;

            //If guardian not found, show "No guardian found" and exit.
            if (!guardian) {
                console.log("No guardian found");
                return;
            }

            var ward = GDATA.ward;

            //If no ward is linked, stop.
            if (!ward) {
                console.log("No linked patient found for this guardian");
                return;
            }

            showGuardianName(guardian);
            showWardBanner(guardian, ward);
            showWardStats(ward);
            showConsentLog(guardian);
            showNotifications(guardian);
            showWardHistory(ward);
            showWardPrescriptions(ward);
        });
    });
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

    //Loop through cached appointments.
    for (var i = 0; i < GDATA.appointments.length; i++) {

        var appt = GDATA.appointments[i];
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

        //Find the doctor for this appointment by looping through cached doctors and matching doctorID.
        var apptDoctor = null;
        for (var i = 0; i < GDATA.doctors.length; i++) {
            if (GDATA.doctors[i].doctorID === nextAppointment.doctorID) {
                apptDoctor = GDATA.doctors[i];
                break;
            }
        }
        //Display the date of the next appointment and the time + doctor details in the stats section of the dashboard.
        document.getElementById("g_statNextAppt").textContent = dateText;
        document.getElementById("g_statNextApptMeta").textContent = nextAppointment.time + " · Dr " + (apptDoctor ? apptDoctor.lastName : "");
    } else {
        //If no upcoming appointments, display "-" for the date and a message in the meta text.
        document.getElementById("g_statNextAppt").textContent = "-";
        document.getElementById("g_statNextApptMeta").textContent = "No upcoming appointments";
    }

    //PRESCRIPTION SECTION
    var rxCount = 0;
    var firstMedName = "";

    for (var i = 0; i < GDATA.prescriptions.length; i++) {
        ////If the prescription is not for this patient OR if the prescription status is not "active", skip it.
        if (GDATA.prescriptions[i].patientID !== ward.patientID || GDATA.prescriptions[i].status !== "active") continue;

        //Increment the prescription counter till active prescription.
        rxCount++;

        //If it's the first active prescription found, find the medicine name by matching medicineID.
        if (rxCount === 1) {
            for (var j = 0; j < GDATA.medicines.length; j++) {
                //If medicineID matches, store the medicine name and duration in a variable, then break the loop.
                if (GDATA.medicines[j].medicineID === GDATA.prescriptions[i].medicineID) {
                    firstMedName = GDATA.medicines[j].name + " · " + GDATA.prescriptions[i].durationDays + " days";
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
    //Loop through cached vitals to find the vitals record for this patient by matching patientID.
    for (var i = 0; i < GDATA.vitals.length; i++) {
        if (GDATA.vitals[i].patientID === ward.patientID) {
            vitalsRecord = GDATA.vitals[i];
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
    //Display the number of allergies and a preview of the first allergy. If no allergies, show "None".
    document.getElementById("g_statAllergiesCount").textContent = allergies.length;
    document.getElementById("g_statAllergiesList").textContent = allergies.length > 0 ? allergies.join(", ") : "None";
}


//It shows the consent log and what the guardian is allowed to see.
//Grantable rows reflect the real guardian.consentGranted flag; if consent is withdrawn, they flip to "Not granted". Non-grantable rows are fixed future-scope placeholders.
function showConsentLog(guardian) {
    var list = document.getElementById("consentList");
    list.innerHTML = "";

    //Loop through CONSENT_ITEMS and build a list item for each.
    for (var i = 0; i < CONSENT_ITEMS.length; i++) {
        var c = CONSENT_ITEMS[i];

        //A row is "granted" only if it is grantable AND the guardian actually has consent.
        var isGranted = c.grantable && guardian.consentGranted;

        //Icon and class for different status of consent.
        var icon = isGranted ? "✓" : "✗";
        var statusClass = isGranted ? "consent_granted" : "consent_denied";
        var statusLabel = isGranted ? "Granted" : "Not granted";

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


//It will show the notification panel for this guardian, read from the notifications store.
//Notifications are addressed by recipientID = the guardian's USERS.username (firstname.lastname).
function showNotifications(guardian) {
    //Create ordered list for notification list.
    var list = document.getElementById("notifList");
    list.innerHTML = "";

    //Work out this guardian's username so we only show notifications addressed to them.
    //Built with the same formula seed.js uses: firstname.lastname, letters only.
    var username = guardian.firstName.toLowerCase().replace(/[^a-z]/g, "")
                 + "."
                 + guardian.lastName.toLowerCase().replace(/[^a-z]/g, "");

    //Filter the loaded notifications down to this guardian's.
    var mine = [];
    for (var i = 0; i < GDATA.notifications.length; i++) {
        if (GDATA.notifications[i].recipientID === username) {
            mine.push(GDATA.notifications[i]);
        }
    }

    //Sort newest first. Records use createdAt; the old hardcoded fallback used date, so accept either.
    mine.sort(function(a, b) {
        var dateA = new Date(a.createdAt || a.date || 0);
        var dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
    });

    //Update count badge in header.
    document.getElementById("notifCount").textContent = mine.length + " new";

    for (var i = 0; i < mine.length; i++) {
        var n = mine[i];

        //Use icons to facilitate notification type.
        var icon = "🔔";
        if (n.type === "result") icon = "🧪";
        if (n.type === "appt") icon = "📅";
        if (n.type === "rx") icon = "💊";

        //Format date (createdAt, with date as fallback for old hardcoded entries).
        var stamp = n.createdAt || n.date;
        var dateText = stamp ? new Date(stamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

        //The store has no title field; derive a short heading from the type so the UI still has one.
        var title = "Update";
        if (n.type === "result") title = "New test result available";
        if (n.type === "appt") title = "Appointment update";
        if (n.type === "rx") title = "Prescription update";

        var item = document.createElement("li");
        item.className = "notif_item";
        item.innerHTML =
            '<div class="notif_icon">' + icon + '</div>' +
            '<div class="notif_body">' +
                '<p class="notif_title">' + title + '</p>' +
                '<p class="notif_message">' + n.message + '</p>' +
                '<p class="notif_date">' + dateText + '</p>' +
            '</div>';
        //Append new list in notif_item.
        list.appendChild(item);
    }

    //If there are no notifications for this guardian, show a friendly message.
    if (mine.length === 0) {
        list.innerHTML = "<li class='notif_empty'>No notifications.</li>";
    }
}


//It shows medical history of ward but in read-only.
function showWardHistory(ward) {
    //Get ordered list for medical history.
    var timeline = document.getElementById("g_historyTimeline");
    timeline.innerHTML = "";

    //Select specific ward history and push into their own array.
    var entries = [];
    for (var i = 0; i < GDATA.history.length; i++) {
        if (GDATA.history[i].patientID === ward.patientID) {
            entries.push(GDATA.history[i]);
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

    for (var i = 0; i < GDATA.prescriptions.length; i++) {
        var rx = GDATA.prescriptions[i];
        //Skip prescriptions that belongs to other patients
        if (rx.patientID !== ward.patientID) continue;
        //Prescription has been found
        found = true;

        //Look up medicine details using medicineID stored in the prescription
        var med = null;
        for (var j = 0; j < GDATA.medicines.length; j++) {
            if (GDATA.medicines[j].medicineID === rx.medicineID) {
                med = GDATA.medicines[j];
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
//guardian.js wired to IndexedDB.

//CONSENT_ITEMS is intentionally kept in code, not in a store:
//The schema models consent as a single guardian.consentGranted flag, not per-category.
var CONSENT_ITEMS = [
    { label: "Medical history",          grantable: true  },
    { label: "Active prescriptions",     grantable: true  },
    { label: "Appointments",             grantable: true  },
    { label: "Allergies and blood group",grantable: true  },
    { label: "Lab test results",         grantable: true  },
    { label: "Mental health records",    grantable: false },
    { label: "Genetic test results",     grantable: false }
];

//GDATA is the module-level cache for the guardian dashboard, filled once by loadGuardianData().
var GDATA = {
    guardian: null,
    ward: null,
    patients: [],
    doctors: [],
    appointments: [],
    prescriptions: [],
    medicines: [],
    history: [],
    vitals: [],
    notifications: []
};


//Loads all required stores from IndexedDB in parallel, then calls onReady once all are done.
function loadGuardianData(onReady) {
    var session    = getSession();
    var guardianID = (session && session.guardianID) ? session.guardianID : "g001";

    //Load the guardian profile from IndexedDB.
    getRecord("guardians", guardianID, function(record) {
        if (!record) {
            console.log("Guardian not found in IndexedDB for ID: " + guardianID);
            onReady();
            return;
        }
        GDATA.guardian = record;

        var jobs = [
            ["patients",       "patients"],
            ["doctors",        "doctors"],
            ["appointments",   "appointments"],
            ["prescriptions",  "prescriptions"],
            ["medicines",      "medicines"],
            ["medicalHistory", "history"],
            ["vitals",         "vitals"],
            ["notifications",  "notifications"]
        ];

        var remaining = jobs.length;
        for (var i = 0; i < jobs.length; i++) {
            (function(job) {
                getAllRecords(job[0], function(records) {
                    GDATA[job[1]] = records || [];
                    remaining--;
                    if (remaining === 0) {
                        //Resolve the ward now that patients are loaded.
                        GDATA.ward = findWard(GDATA.guardian.linkedPatientID);
                        onReady();
                    }
                });
            })(jobs[i]);
        }
    });
}

//Finds the ward (linked patient) from the loaded patients cache.
function findWard(patientID) {
    for (var i = 0; i < GDATA.patients.length; i++) {
        if (GDATA.patients[i].patientID === patientID) {
            return GDATA.patients[i];
        }
    }
    return null;
}

//Returns the cached guardian.
function getLoggedInGuardian() {
    return GDATA.guardian;
}

//Opens the DB, loads all data, resolves guardian + ward, then renders every section.
function loadGuardianDashboard() {
    openDatabase(function() {
        loadGuardianData(function() {
            var guardian = GDATA.guardian;
            //If guardian not found, show "No guardian record found — check IndexedDB is seeded." and exit.
            if (!guardian) {
                console.log("No guardian record found — check IndexedDB is seeded.");
                return;
            }
            //If no ward is linked, show "No linked patient found for guardian:" and exit.
            var ward = GDATA.ward;
            if (!ward) {
                console.log("No linked patient found for guardian: " + guardian.guardianID);
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

function showWardBanner(guardian, ward) {
    document.getElementById("wardInitials").textContent    = ward.firstName[0] + ward.lastName[0];
    document.getElementById("wardName").textContent        = ward.firstName + " " + ward.lastName;
    document.getElementById("wardRelationship").textContent = "Your " + guardian.relationship;
    //Consent status, whether it's pending or active.
    document.getElementById("consentStatus").textContent   = guardian.consentGranted ? "Active" : "Pending";
    document.getElementById("consentDate").textContent     = "Granted on " + guardian.consentDate;
}

//It will show summary stat cards of the ward.
function showWardStats(ward) {
    //NEXT APPOINTMENT
    var nextAppt = null;
    for (var i = 0; i < GDATA.appointments.length; i++) {
        var appt = GDATA.appointments[i];
        if (appt.patientID !== ward.patientID || appt.status !== "booked") continue;
        //If the appointment is in the future and is sooner than any previously found upcoming appointment, it becomes the new nextAppointment.
        if (nextAppt === null || appt.date < nextAppt.date) {
            nextAppt = appt;
        }
    }

    if (nextAppt) {
        var dateText = new Date(nextAppt.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
        var doc = null;
        for (var i = 0; i < GDATA.doctors.length; i++) {
            if (GDATA.doctors[i].doctorID === nextAppt.doctorID) { doc = GDATA.doctors[i]; break; }
        }
        document.getElementById("g_statNextAppt").textContent     = dateText;
        document.getElementById("g_statNextApptMeta").textContent = nextAppt.time + " · Dr " + (doc ? doc.lastName : "");
    } else {
        document.getElementById("g_statNextAppt").textContent     = "-";
        document.getElementById("g_statNextApptMeta").textContent = "No upcoming appointments";
    }

    //ACTIVE PRESCRIPTIONS
    var rxCount = 0;
    var firstMedName = "";
    for (var i = 0; i < GDATA.prescriptions.length; i++) {
        var rx = GDATA.prescriptions[i];
        if (rx.patientID !== ward.patientID || rx.status !== "active") continue;
        rxCount++;
        if (rxCount === 1) {
            for (var j = 0; j < GDATA.medicines.length; j++) {
                if (GDATA.medicines[j].medicineID === rx.medicineID) {
                    firstMedName = GDATA.medicines[j].name + " · " + rx.durationDays + " days";
                    break;
                }
            }
        }
    }
    document.getElementById("g_statRxCount").textContent = rxCount;
    document.getElementById("g_statRxSub").textContent   = rxCount > 0 ? firstMedName : "No active prescriptions";

    //BLOOD GROUP
    document.getElementById("g_statBloodGroup").textContent = ward.bloodGroup || "Not recorded";

    //VITALS
    var vitalsRecord = null;
    for (var i = 0; i < GDATA.vitals.length; i++) {
        if (GDATA.vitals[i].patientID === ward.patientID) { vitalsRecord = GDATA.vitals[i]; break; }
    }
    document.getElementById("g_statVitalsDate").textContent = vitalsRecord
        ? new Date(vitalsRecord.lastUpdated).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
        : "No vitals recorded";

    //ALLERGIES
    var allergies = ward.allergies || [];
    document.getElementById("g_statAllergiesCount").textContent = allergies.length;
    document.getElementById("g_statAllergiesList").textContent  = allergies.length > 0 ? allergies.join(", ") : "None";
}

//It shows the consent log and what the guardian is allowed to see.
//Grantable rows reflect the real guardian.consentGranted flag; if consent is withdrawn they flip to "Not granted".
function showConsentLog(guardian) {
    var list = document.getElementById("consentList");
    list.innerHTML = "";

    for (var i = 0; i < CONSENT_ITEMS.length; i++) {
        var c = CONSENT_ITEMS[i];
        var isGranted = c.grantable && guardian.consentGranted;
        var statusClass = isGranted ? "consent_granted" : "consent_denied";

        var item = document.createElement("li");
        item.className = "consent_item";
        item.innerHTML =
            '<span class="consent_icon ' + statusClass + '">' + (isGranted ? "✓" : "✗") + '</span>' +
            '<p class="consent_label">' + c.label + '</p>' +
            '<span class="consent_status ' + statusClass + '">' + (isGranted ? "Granted" : "Not granted") + '</span>';
        list.appendChild(item);
    }
}

//Notifications are addressed by recipientID = guardian's username (firstname.lastname).
function showNotifications(guardian) {
    var list = document.getElementById("notifList");
    list.innerHTML = "";

    var username = guardian.firstName.toLowerCase().replace(/[^a-z]/g, "")
                 + "."
                 + guardian.lastName.toLowerCase().replace(/[^a-z]/g, "");

    var mine = GDATA.notifications.filter(function(n) {
        return n.recipientID === username;
    });

    mine.sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    document.getElementById("notifCount").textContent = mine.length + " new";

    if (mine.length === 0) {
        list.innerHTML = "<li class='notif_empty'>No notifications.</li>";
        return;
    }

    for (var i = 0; i < mine.length; i++) {
        var n = mine[i];

        var icon  = "🔔";
        var title = "Update";
        if (n.type === "result") { icon = "🧪"; title = "New test result available"; }
        if (n.type === "appt")   { icon = "📅"; title = "Appointment update"; }
        if (n.type === "rx")     { icon = "💊"; title = "Prescription update"; }

        var dateText = n.createdAt
            ? new Date(n.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "";

        var item = document.createElement("li");
        item.className = "notif_item";
        item.innerHTML =
            '<div class="notif_icon">' + icon + '</div>' +
            '<div class="notif_body">' +
                '<p class="notif_title">'   + title        + '</p>' +
                '<p class="notif_message">' + n.message    + '</p>' +
                '<p class="notif_date">'    + dateText     + '</p>' +
            '</div>';
        list.appendChild(item);
    }
}

//It shows medical history of ward but in read-only.
function showWardHistory(ward) {
    var timeline = document.getElementById("g_historyTimeline");
    timeline.innerHTML = "";

    var entries = GDATA.history.filter(function(h) {
        return h.patientID === ward.patientID;
    });

    entries.sort(function(a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });

    if (entries.length === 0) {
        timeline.innerHTML = "<li>No medical history on record.</li>";
        return;
    }

    for (var i = 0; i < entries.length; i++) {
        var entry     = entries[i];
        var dateText  = entry.date
            ? new Date(entry.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "Unknown date";
        var typeLabel = entry.type.replace("_", " ");

        var item = document.createElement("li");
        item.className = "timeline_item";
        item.setAttribute("data-type", entry.type);
        item.innerHTML =
            '<div class="timeline_item_dot"></div>' +
            '<div class="timeline_item_body">' +
                '<p class="timeline_item_date">'  + dateText  + '</p>' +
                '<p class="timeline_item_title">' + entry.title + '</p>' +
                '<p class="timeline_item_desc">'  + entry.description + '</p>' +
                '<span class="badge_' + entry.type + '">' + typeLabel + '</span>' +
            '</div>';
        timeline.appendChild(item);
    }
}

////It shows ward's prescription but read only.
function showWardPrescriptions(ward) {
    var list  = document.getElementById("g_rxGrid");
    list.innerHTML = "";
    var found = false;

    for (var i = 0; i < GDATA.prescriptions.length; i++) {
        var rx = GDATA.prescriptions[i];
        if (rx.patientID !== ward.patientID) continue;
        found = true;

        var med = null;
        for (var j = 0; j < GDATA.medicines.length; j++) {
            if (GDATA.medicines[j].medicineID === rx.medicineID) { med = GDATA.medicines[j]; break; }
        }
        var medName = med ? med.name + " " + med.strength : "Unknown";
        var durationText = rx.durationDays ? rx.durationDays + " days" : "—";
        var issuedText = rx.dateIssued
            ? new Date(rx.dateIssued).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            : "";

        var item = document.createElement("li");
        item.className = "rx_item";
        item.innerHTML =
            '<div class="rx_item_icon">💊</div>' +
            '<div class="rx_item_body">' +
                '<div class="rx_item_header">' +
                    '<p class="rx_item_name">' + medName + '</p>' +
                    '<span class="badge_active">Active</span>' +
                '</div>' +
                '<div class="rx_item_grid">' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Dosage</span>' +
                        '<span class="rx_item_detail_value">' + (rx.dosage || "—") + '</span>' +
                    '</div>' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Frequency</span>' +
                        '<span class="rx_item_detail_value">' + (rx.frequency || "—") + '</span>' +
                    '</div>' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Duration</span>' +
                        '<span class="rx_item_detail_value">' + durationText + '</span>' +
                    '</div>' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Issued</span>' +
                        '<span class="rx_item_detail_value">' + issuedText + '</span>' +
                    '</div>' +
                '</div>' +
                (rx.instructions ? '<p class="rx_item_instructions">' + rx.instructions + '</p>' : "") +
            '</div>';
        list.appendChild(item);
    }

    if (!found) {
        list.innerHTML = "<li>No prescriptions found.</li>";
    }
}
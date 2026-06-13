//patient.js wired to IndexedDB
//PDATA is a module-level cache that holds the logged-in patient plus every list the dashboard needs. 
//It is filled once by loadPatientData().
var PDATA = {
    patient: null,
    doctors: [],
    appointments: [],
    prescriptions: [],
    medicines: [],
    history: [],
    vitals: [],
    bookingRequests: [],
    prescriptionRequests: []
};

//loadStore fetches every record from one object store. If the store is empty, it hands back the dummy-data fallback array instead.
function loadStore(storeName, fallbackArray, callback) {
    try {
        getAllRecords(storeName, function(records) {
            if (records && records.length > 0) {
                callback(records);
            } else {
                callback(fallbackArray);
            }
        });
    } catch(e) {
        //Store doesn't exist in this DB version yet — use the fallback silently.
        console.log("loadStore: store '" + storeName + "' not available yet, using fallback. (" + e.message + ")");
        callback(fallbackArray);
    }
}

//findPatientInDummy is the fallback lookup for the logged-in patient: it searches the
//PATIENTS array from dummy-data.js when the record isn't in IndexedDB.
function findPatientInDummy(patientID) {
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].patientID === patientID) {
            return PATIENTS[i];
        }
    }
    //Demo fallback — Aanya Sharma — if the requested ID isn't found at all.
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].patientID === "p001") {
            return PATIENTS[i];
        }
    }
    return null;
}

//loadPatientData fills PDATA from IndexedDB (with dummy-data fallback), then calls onReady.
function loadPatientData(onReady) {
    //Work out the logged-in patient's ID from the session object saved by auth.js.
    //getSession() returns the whole currentUser; we read patientID off it (answer: option A).
    var session = getSession();
    var patientID = (session && session.patientID) ? session.patientID : "p001";

    //Load the patient profile — IndexedDB first, dummy-data fallback.
    getRecord("patients", patientID, function(record) {
        PDATA.patient = record ? record : findPatientInDummy(patientID);

        //Each job is [storeName, fallbackArray, keyInPDATA].
        var jobs = [
            ["doctors",          DOCTORS,          "doctors"],
            ["appointments",     APPOINTMENTS,     "appointments"],
            ["prescriptions",    PRESCRIPTIONS,    "prescriptions"],
            ["medicines",        MEDICINES,        "medicines"],
            ["medicalHistory",   MEDICAL_HISTORY,  "history"],
            ["vitals",           VITALS,           "vitals"],
            ["booking_requests", BOOKING_REQUESTS, "bookingRequests"],
            ["prescription_requests", [],          "prescriptionRequests"]
        ];

        //Load every store in parallel and only continue once all have come back.
        var remaining = jobs.length;
        for (var i = 0; i < jobs.length; i++) {
            //IIFE captures the current job so the async callback uses the right one.
            (function(job) {
                loadStore(job[0], job[1], function(records) {
                    PDATA[job[2]] = records;
                    remaining--;
                    if (remaining === 0) {
                        onReady();
                    }
                });
            })(jobs[i]);
        }
    });
}


//getLoggedInPatient returns the cached patient record. It is also used by the booking form.
//If the cache isn't ready yet, it falls back to a synchronous dummy lookup.
function getLoggedInPatient() {
    if (PDATA.patient) {
        return PDATA.patient;
    }
    var session = getSession();
    var patientID = (session && session.patientID) ? session.patientID : "p001";
    return findPatientInDummy(patientID);
}

//loadPatientDashboard opens the DB, loads all data, then renders every section.
//openDatabase is called here so the dashboard works even if seeding is still in progress.
function loadPatientDashboard() {
    openDatabase(function() {
        loadPatientData(function() {
            var patient = PDATA.patient;

            //If no patient could be resolved at all, stop here.
            if (!patient) {
                console.log("No patient found");
                return;
            }

            showPatientName(patient);
            showDoctorCard(patient);
            showPatientStats(patient);
            showPatientPrescriptions(patient);
            showPatientHistory(patient);
            showWeekStrip(patient);
            showBookingStatus(patient);
            fillDoctorDropdown();
            setupFilterButtons();
            setupBookingForm();
            fillRxRequestDropdown();
            setupRxRequestForm();
            showRxRequestStatus(patient);
        });
    });
}

//This function will show the patient's name in the welcome message at the top of the dashboard.
function showPatientName(patient) {
    //It finds the element with id="patientName" in HTML and sets the visible text to be the patient's first and last name.
    document.getElementById("patientName").textContent = patient.firstName + " " + patient.lastName;
}

//This function will show the doctor card on the dashboard and its details.
function showDoctorCard(patient) {
    var doctor = null;

    //Loop through the loaded doctors. If found, store the doctor in a variable and break the loop.
    for (var i = 0; i < PDATA.doctors.length; i++) {
        if (PDATA.doctors[i].doctorID === patient.registeredDoctorID) {
            doctor =  PDATA.doctors[i];
            break;
        }
    }

    //Else, if doctor not found, exit function.
    if (!doctor) return;

    //Doctor details; first name and last name, speciality, and GMC number are shown in the doctor card on the dashboard.
    document.getElementById("doctorName").textContent = doctor.title + " " + doctor.firstName + " " + doctor.lastName;
    document.getElementById("doctorSpecialty").textContent = doctor.specialty;
    document.getElementById("doctorGmc").textContent = doctor.gmcNumber.replace("GMC", "");
    document.getElementById("doctorEmail").textContent = doctor.email;
    document.getElementById("doctorInfo").textContent = doctor.information;
}

function showPatientStats(patient) {
    //APPOINTMENTS SECTION
    var nextAppointment = null;

    //It loops through the loaded appointments.
    for (var i = 0; i < PDATA.appointments.length; i++) {
        var appt = PDATA.appointments[i];

        //Skip if the appointment is not for this patient OR if the appointment status is "booked"
        if (appt.patientID !== patient.patientID || appt.status !== "booked") {
            continue;
        }

        //It shows the next upcoming appointment by comparing the date of each appointment to the current date and time.
        //If the appointment is in the future and is sooner than any previously found upcoming appointment, it becomes the new nextAppointment.
        if (nextAppointment === null || appt.date < nextAppointment.date) {
            nextAppointment = appt;
        }
    }

    //It displays the date and time of the next appointment on the dashboard.
    //However, if there are no upcoming appointments, it can display a message
    if (nextAppointment !== null) {

        //Convert the appointment date string to a Date object, then format it to a more readable form (e.g. "26 May 2026").
        var apptDate = new Date(nextAppointment.date);
        var dateText = apptDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        //Find the doctor for this appointment by looping through the loaded doctors and matching doctorID.
        var apptDoctor = null;
        for (var i = 0; i < PDATA.doctors.length; i++) {
            if (PDATA.doctors[i].doctorID === nextAppointment.doctorID) {
                apptDoctor = PDATA.doctors[i];
                break;
            }
        }
        //Display the date of the next appointment and the time + doctor details in the stats section of the dashboard.
        document.getElementById("statNextAppt").textContent = dateText;
        document.getElementById("statNextApptMeta").textContent = nextAppointment.time + " · Dr " + apptDoctor.lastName;

    } else {
        //If no upcoming appointments, display "-" for the date and a message in the meta text.
        document.getElementById("statNextAppt").textContent = "-";
        document.getElementById("statNextApptMeta").textContent = "No upcoming appointments";
    }

    //PRESCRIPTIONS SECTION
    //Medicine name preview and counter for active prescriptions.
    var firstMedName = null;
    var rxCount = 0;

    for (var i = 0; i < PDATA.prescriptions.length; i++) {
          //If the prescription is not for this patient OR if the prescription status is not "active", skip it.
          if (PDATA.prescriptions[i].patientID !== patient.patientID || PDATA.prescriptions[i].status !== "active") {
            continue;
          }
          //Increment the prescription counter till active prescription.
          rxCount++;

          //If it's the first active prescription found, find the medicine name by matching medicineID.
          if (rxCount === 1) {
            //Loop through the loaded medicines to find the medicine name for this prescription.
            for (var j = 0; j < PDATA.medicines.length; j++) {
                //If medicineID matches, store the medicine name and duration in a variable, then break the loop.
                if (PDATA.medicines[j].medicineID === PDATA.prescriptions[i].medicineID) {
                    firstMedName = PDATA.medicines[j].name + " · " + PDATA.prescriptions[i].durationDays + " days";
                    break;
                }
            }
          }
    }

    //Display the prescription count and the name of the first active prescription.
    //'?' condition = shows value if true & value if false.
    document.getElementById("statRxCount").textContent = rxCount;
    document.getElementById("statRxSub").textContent = rxCount > 0 ? firstMedName : "No active prescriptions";


    //BLOOD GROUP SECTION
    document.getElementById("statBloodGroup").textContent = patient.bloodGroup;

    //VITALS SECTION
    var vitalsRecord = null;

    //Loop through the loaded vitals to find the vitals record for this patient by matching patientID.
    for (var i = 0; i < PDATA.vitals.length; i++) {
        if (PDATA.vitals[i].patientID === patient.patientID) {
            vitalsRecord = PDATA.vitals[i];
            break;
        }
    }

    //If vitals record is found, display the date of the last vitals record.
    //If not found, display a message like "No vitals recorded".
    if (vitalsRecord) {
        var vitalsDate = new Date(vitalsRecord.lastUpdated);
        document.getElementById("statVitalsDate").textContent = vitalsDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } else {
        document.getElementById("statVitalsDate").textContent = "No vitals recorded";
    }

    //ALLERGIES SECTION
    var allergies = patient.allergies;

    //Display the number of allergies and a preview of the first allergy. If no allergies, show "No allergies".
    document.getElementById("statAllergiesCount").textContent = allergies.length;
    document.getElementById("statAllergiesList").textContent = allergies.length > 0 ? allergies.join(", ") : "No allergies";
}

//It handles the prescription list table
function showPatientPrescriptions(patient) {
      //Get the unordered list where the items will go
      var list = document.getElementById("rxGrid")
      //Clear anything that was present
      list.innerHTML = "";
 
      //Boolean condition to track if found at least 1 prescription
      var found = false;
 
      //Loop through the loaded prescriptions
      for (var i = 0; i < PDATA.prescriptions.length; i++) {
        var rx = PDATA.prescriptions[i]
        //Skip prescriptions that belongs to other patients
        if (rx.patientID !== patient.patientID) continue;
        //Prescription has been found
        found = true
 
        //Look up medicine details using medicineID stored in the prescription
        var med = null;
        for (var j = 0; j < PDATA.medicines.length; j++) {
            if (PDATA.medicines[j].medicineID === rx.medicineID) {
                med = PDATA.medicines[j];
                break;
            }
        }
 
        //Combine name and strength, if medicine not found, display "Unknown"
        var medName = med ? med.name + " " + med.strength : "Unknown";
 
        //Create new HTML element & css class
        //Convert durationDays number to a human-readable string.
        var durationText = rx.durationDays ? rx.durationDays + " days" : "—";
        //Format the issue date nicely.
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
                '</div>' +
                '<div class="rx_item_grid">' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Dosage: </span>' +
                        '<span class="rx_item_detail_value">' + (rx.dosage || "—") + '</span>' +
                    '</div>' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Frequency: </span>' +
                        '<span class="rx_item_detail_value">' + (rx.frequency || "—") + '</span>' +
                    '</div>' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Duration: </span>' +
                        '<span class="rx_item_detail_value">' + durationText + '</span>' +
                    '</div>' +
                    '<div class="rx_item_detail">' +
                        '<span class="rx_item_detail_label">Issued: </span>' +
                        '<span class="rx_item_detail_value">' + issuedText + '</span>' +
                    '</div>' +
                '</div>' +
                (rx.instructions
                    ? '<p class="rx_item_instructions">' + rx.instructions + '</p>'
                    : "") +
            '</div>' +
            '<span class="badge_active">Active</span>';

 
        //appendChild adds the finished <li> element to the end of the <ul>.
        list.appendChild(item);
    }
 
    //if the loop finished without finding any prescriptions, show a message.
    if (!found) {
        list.innerHTML = "<li>No prescriptions found.</li>";
    }
}

//It handles medical history
function showPatientHistory(patient) {
    //Get ordered list for medical history
    var timeline = document.getElementById("historyTimeline");
    timeline.innerHTML = "";

    //Design for animated timeline. 'ALL' is the default selected filter.
    timeline.classList.add("timeline_all_active");

    //Collect medical history entries for specific patients in their own personal array
    var entries = []
    //Loop through the loaded medical history and push items at the end of array
    for (var i = 0; i < PDATA.history.length; i++) {
        if (PDATA.history[i].patientID === patient.patientID) {
            entries.push(PDATA.history[i]);
        }
    }

    //sort() rearranges array using a comparison function
    //If B - A, positive; B goes first, if negative; A goes first
    entries.sort(function(a, b) {
        var dateA = a.date ? new Date(a.date) : new Date(0);
        var dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA
    });

    //Build card list for each entry
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        //format date if exists
        var dateText = entry.date ? new Date(entry.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric"}) : "Unknown date";
        //badge class is built from the type
        var badgeClass = "badge_" + entry.type;

        //"test_result" to "test result" for the label text
        var typeLabel = entry.type.replace("_", " ");

        //create list item
        var item = document.createElement("li");
        item.className = "timeline_item";
        //It is used by filter buttons
        item.setAttribute("data-type", entry.type);
        //build innerHTML for timeline entry
        item.innerHTML =
            '<div class="timeline_item_dot"></div>' +
            '<div class="timeline_item_body">' +
                '<p class="timeline_item_date">' + dateText + '</p>' +
                '<p class="timeline_item_title">' + entry.title + '</p>' +
                '<p class="timeline_item_desc">' + entry.description + '</p>' +
                '<span class="' + badgeClass + '">' + typeLabel + '</span>' +
            '</div>';
        //Add finished item to ordered list.
        timeline.appendChild(item);
    }
}

function setupFilterButtons() {

    //querySelectorAll scans and returns all elements that match filter_pill
    //It grabs every button with class="filter_pill"
    var buttons = document.querySelectorAll(".filter_pill");

    //Loop through each button to attach a click listener to each button
    for (var i = 0; i < buttons.length; i++) {

        buttons[i].addEventListener("click", function() {

            //First remove the active highlight from all filter buttons
            var allBtns = document.querySelectorAll(".filter_pill");
            for (var j = 0; j < allBtns.length; j++) {
                //classList.remove removes a class from an element without touching others
                allBtns[j].classList.remove("filter_pill_active");
            }

            //Add the active highlight to only the button that was clicked
            //this. refers to the button that was just clicked
            this.classList.add("filter_pill_active");

            //Read which filter this button represents from its data-filter attribute
            var filter = this.getAttribute("data-filter");

            //Animated design for timeline should only show when filter is on 'ALL'
             var timeline = document.getElementById("historyTimeline");
            if (filter === "all") {
                timeline.classList.add("timeline_all_active");
            } else {
                timeline.classList.remove("timeline_all_active");
            }

            //Get all timeline items so we can show or hide them
            var items = document.querySelectorAll(".timeline_item");
            //Loop through every history entry
            for (var k = 0; k < items.length; k++) {

                //Read this item's type from its data-type attribute
                var itemType = items[k].getAttribute("data-type");

                //If "all" is selected, show everything
                //Otherwise only show items whose type matches the filter
                if (filter === "all" || itemType === filter) {
                    items[k].hidden = false; //Makes the element visible
                } else {
                    items[k].hidden = true;  //Hides the element
                }
            }
        });
    }
}

//It handles date shown for upcoming appointment when booking
function showWeekStrip(patient) {
    //Get the container where we'll put the day pills
    var container = document.getElementById("bookingWeek");
    //Clear previous services
    container.innerHTML = "";
    //new Date() with no arguments gives today's date and time
    var today = new Date();

    //Array of short day names — getDay() returns 0–6, so we use this to look up the name
    var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    //Build 7 day pills starting from today
    for (var i = 0; i < 7; i++) {

        //Create a new Date object for each day
        //We start fresh each time so we don't accidentally change the today variable
        var day = new Date();
        //.setDate moves the date forward by i days
        day.setDate(today.getDate() + i);

        var pill = document.createElement("div");

        // if today (i === 0), it gets main highlight, as the rest will have their default highlight
        pill.className = i === 0 ? "day_pill day_pill_active" : "day_pill";

        //.toISOString() gives a string like "2026-06-04T00:00:00.000Z"
        //.slice(0, 10) cuts it down to just "2026-06-04"
        //We store this on the element so other code can read which date was selected
        pill.setAttribute("data-date", day.toISOString().slice(0, 10));

        //day.getDay() gives 0–6 which we use to look up the day name from our array
        //day.getDate() gives the day number in the month e.g. 4
        pill.innerHTML = "<span>" + dayNames[day.getDay()] + "</span><b>" + day.getDate() + "</b>";

        //When a pill is clicked, highlight it and remove highlight from the others
        //Grabs all 7 pills, loops through them
        pill.addEventListener("click", function() {
            var allPills = document.querySelectorAll(".day_pill");
            for (var j = 0; j < allPills.length; j++) {
                allPills[j].classList.remove("day_pill_active");
            }
            //Highlight the one that was clicked
            this.classList.add("day_pill_active");
        });
        //Add pill to page
        container.appendChild(pill);
    }

    //Show the current month and year above the strip e.g. "June 2026"
    document.getElementById("currentMonthYear").textContent = today.toLocaleDateString("en-GB", { month: "long", year: "numeric" });


    //Upcoming appointments which appears below day pills
    var detailBox = document.getElementById("weekStripDetail");
    var nextAppt = null;

    //Loop through every loaded appointment that belongs to patient
    for (var i = 0; i < PDATA.appointments.length; i++) {
        if (PDATA.appointments[i].patientID === patient.patientID && PDATA.appointments[i].status === "booked") {
            if (nextAppt === null || PDATA.appointments[i].date < nextAppt.date) {
                nextAppt = PDATA.appointments[i];
            }
        }
    }
    //If appointment found
    if (nextAppt) {

        //Find the doctor for this appointment
        var doc = null;
        for (var i = 0; i < PDATA.doctors.length; i++) {
            if (PDATA.doctors[i].doctorID === nextAppt.doctorID) {
                doc = PDATA.doctors[i];
                break;
            }
        }

        //Format the date with the weekday included e.g. "Wed, 04 Jun"
        var formattedDate = new Date(nextAppt.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short"});

        //Build appointment summary card for upcoming appt, reason and date, time and doctor.
        detailBox.innerHTML =
            '<div>' +
                '<p class="week_strip_label">Upcoming</p>' +
                '<p class="week_strip_title">' + nextAppt.reason + '</p>' +
                '<p class="week_strip_meta">' + formattedDate + ' · ' + nextAppt.time + ' · Dr ' + (doc ? doc.lastName : "") + '</p>' +
            '</div>' +
            '<button type="button">View all</button>';

    } else {
        detailBox.innerHTML = "<p>No upcoming appointments.</p>";
    }
}


//It handles choosing doctor
function fillDoctorDropdown() {

    //Get the <select> element in the booking form
    var select = document.getElementById("apptDoctor");

    //It clears any existing options if there's a re-login so doctors don't stack up and appear twice.
    while(select.options.length > 1) {
        select.remove(1)
    }


    //Add one <option> for each doctor in the loaded doctors list
    for (var i = 0; i < PDATA.doctors.length; i++) {

        //createElement creates an <option> element in memory
        var option = document.createElement("option");

        //value is what gets submitted or read by JavaScript
        option.value = PDATA.doctors[i].doctorID;

        //textContent is what the user actually sees in the dropdown
        option.textContent = PDATA.doctors[i].title + " " + PDATA.doctors[i].firstName + " " + PDATA.doctors[i].lastName + " · " + PDATA.doctors[i].specialty;

        //append this option to the select — it appears below the default "Choose a doctor..." option
        select.appendChild(option);
    }
}

//It handles booking status bar
function showBookingStatus(patient) {
    //Get the table body where the rows will go.
    var tableBody = document.getElementById("bookingStatusBody");

    //If the bar isn't on the page for some reason, stop safely.
    if (!tableBody) return;

    tableBody.innerHTML = "";

    //Time constants in milliseconds.
    var oneDay = 24 * 60 * 60 * 1000;
    var sevenDays = 7 * oneDay;
    var now = Date.now();

    //Counter so we can show an empty message if nothing is visible.
    var shown = 0;

    //Loop through the loaded booking requests and show the ones that belong to this patient.
    for (var i = 0; i < PDATA.bookingRequests.length; i++) {
        var req = PDATA.bookingRequests[i];

        //Skip requests that aren't this patient's.
        if (req.patientID !== patient.patientID) continue;

        //Work out how long ago this request was submitted or decided on.
        var stamp = req.decidedAt ? req.decidedAt : (req.submittedAt ? req.submittedAt : now);
        var age = now - stamp;

        //Apply the clearing rules based on status.
        if (req.status === "pending" && age > sevenDays) continue;
        if (req.status === "accepted" && age > oneDay) continue;
        if (req.status === "declined" && age > oneDay) continue;

        //Find the doctor for this request so we can show their name.
        var doc = null;
        for (var j = 0; j < PDATA.doctors.length; j++) {
            if (PDATA.doctors[j].doctorID === req.doctorID) {
                doc = PDATA.doctors[j];
                break;
            }
        }
        var docName = doc ? "Dr " + doc.lastName : "Unknown";

        //Format the date nicely e.g. "15 Jun 2026".
        var dateText = new Date(req.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        //Pick the colour class for the status pill.
        var statusClass = "status_bar_pending";
        if (req.status === "accepted") statusClass = "status_bar_accepted";
        if (req.status === "declined") statusClass = "status_bar_declined";

        //A cancel button is only shown on pending requests — once a doctor has
        //accepted or declined, the decision belongs to them, not the patient.
        var cancelCell = req.status === "pending"
            ? '<td><button type="button" class="status_bar_cancel" data-request-id="' + req.requestID + '">Cancel</button></td>'
            : '<td></td>';

        //Build the row: Booking column (reason, date, time, doctor) + Status column + Cancel column.
        var row = document.createElement("tr");
        row.innerHTML =
            '<td>' +
                '<p class="status_bar_reason">' + req.reason + '</p>' +
                '<p class="status_bar_meta">' + dateText + ' · ' + req.time + ' · ' + docName + '</p>' +
            '</td>' +
            '<td><span class="status_bar_pill ' + statusClass + '">' + req.status + '</span></td>' +
            cancelCell;

        tableBody.appendChild(row);
        shown++;
    }

    //If nothing is visible, show a friendly empty row spanning both columns.
    if (shown === 0) {
        tableBody.innerHTML = "<tr><td colspan='3' class='status_bar_empty'>No booking requests yet.</td></tr>";
    }

    //Attach cancel listeners via delegation on the table body so they are always
    //fresh after each re-render — no risk of double-binding from repeated calls.
    tableBody.addEventListener("click", function(e) {
        //Check if the clicked element is a cancel button.
        if (e.target && e.target.classList.contains("status_bar_cancel")) {
            var requestID = e.target.getAttribute("data-request-id");
            cancelBookingRequest(requestID, patient);
        }
    });
}


//It cancels a pending booking request by deleting it from IndexedDB.
//DELETES: the booking_requests record.
function cancelBookingRequest(requestID, patient) {
    //Remove from IndexedDB first.
    deleteRecord("booking_requests", requestID, function() {
        //Keep the in-memory cache in sync so the table refreshes without a reload.
        //filter() returns a new array that excludes the cancelled request.
        PDATA.bookingRequests = PDATA.bookingRequests.filter(function(r) {
            return r.requestID !== requestID;
        });

        //Rebuild the status bar — the cancelled row is now gone from both the
        //cache and the store, so it won't appear on the next load either.
        showBookingStatus(patient);
    });
}


//It handles submit function when booking
function setupBookingForm() {

    var form = document.getElementById("bookingForm");

    //"submit" fires when the user clicks the submit button or presses Enter in the form
    form.addEventListener("submit", function(e) {

        // e is the event object — it represents the submit action that just happened
        // e.preventDefault() cancels the browser's default behaviour which would refresh the whole page
        e.preventDefault();

        //Read the current value from each form field
        var date   = document.getElementById("apptDate").value;
        var time = document.getElementById("apptTime").value;
        var doctor = document.getElementById("apptDoctor").value;
        var reason = document.getElementById("apptReason").value;

        //Get references to the message paragraphs
        var errorMsg   = document.getElementById("bookingError");
        var successMsg = document.getElementById("bookingOk");

        //Always hide both messages before checking, so old messages don't linger
        errorMsg.hidden   = true;
        successMsg.hidden = true;

        //Validation check: check none of the fields are empty
        //An empty input has value "" which is a falsy value in JavaScript
        if (date === "" || time === "" || doctor === "" || reason === "") {
            //Show the red error paragraph
            errorMsg.hidden = false;
            return;
        }

        var patient = getLoggedInPatient();
        var newRequest = {
            //Unique key for the booking_requests store. Date.now() guarantees no clash with seeded IDs or with other new requests.
            requestID: "br" + Date.now(),
            patientID: patient.patientID,
            doctorID: doctor,
            date: date,
            time: time,
            reason: reason,
            status: "pending",
            //submittedAt lets the Status Bar know when to clear the request.
            submittedAt: Date.now()
        };

        //WRITE the new request into IndexedDB so it survives a page reload.
        putRecord("booking_requests", newRequest, function(saved) {
            if (!saved) {
                console.log("Could not save booking request to IndexedDB.");
            }
        });

        //Keep the in-memory cache in sync so the Status Bar refresh shows it immediately.
        PDATA.bookingRequests.push(newRequest);

        //Show the green success message.
        successMsg.hidden = false;

        //.reset() clears all the form fields back to their default empty state
        form.reset();

        //Refresh our own Booking Status Bar so the new pending request appears.
        showBookingStatus(patient);
    });
}

//Patients can request a prescription from their registered doctor.
//The doctor sees these in a new panel and can accept (which creates a real prescription) or decline.

//It populates the medicine dropdown in the prescription request form.
function fillRxRequestDropdown() {
    var select = document.getElementById("rxRequestMedicine");
    if (!select) return;

    //Clear any options left from a previous login.
    while (select.options.length > 1) {
        select.remove(1);
    }

    //Add one option per medicine in the loaded cache.
    for (var i = 0; i < PDATA.medicines.length; i++) {
        var option = document.createElement("option");
        option.value = PDATA.medicines[i].medicineID;
        option.textContent = PDATA.medicines[i].name + " " + PDATA.medicines[i].strength;
        select.appendChild(option);
    }
}


//It handles submitting a prescription request.
//WRITES: a new prescription_requests record into IndexedDB (Add operation).
function setupRxRequestForm() {
    var form = document.getElementById("rxRequestForm");
    if (!form) return;

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        var medicineID = document.getElementById("rxRequestMedicine").value;
        var notes      = document.getElementById("rxRequestNotes").value.trim();

        var errorMsg   = document.getElementById("rxRequestError");
        var successMsg = document.getElementById("rxRequestOk");

        errorMsg.hidden   = true;
        successMsg.hidden = true;

        //Validate: a medicine must be selected.
        if (!medicineID) {
            errorMsg.hidden = false;
            errorMsg.textContent = "Please select a medicine.";
            return;
        }

        var patient = getLoggedInPatient();

        //Build the prescription request record.
        var newRequest = {
            rxRequestID:  "rxr" + Date.now(),
            patientID:    patient.patientID,
            doctorID:     patient.registeredDoctorID,
            medicineID:   medicineID,
            notes:        notes,
            status:       "pending",
            submittedAt:  Date.now(),
            decidedAt:    null
        };

        //Persist to IndexedDB.
        putRecord("prescription_requests", newRequest, function(saved) {
            if (!saved) {
                errorMsg.textContent = "Could not submit request. Please try again.";
                errorMsg.hidden = false;
                return;
            }

            //Keep cache in sync and refresh the status list immediately.
            PDATA.prescriptionRequests.push(newRequest);

            successMsg.hidden = false;
            form.reset();

            showRxRequestStatus(patient);
        });
    });
}


//It shows the patient's prescription request history below the request form.
//Shows status of each request (pending, accepted, declined).
//Pending requests have a Cancel button (deleteRecord).
function showRxRequestStatus(patient) {
    var list = document.getElementById("rxRequestStatusList");
    if (!list) return;

    list.innerHTML = "";
    var shown = 0;

    for (var i = 0; i < PDATA.prescriptionRequests.length; i++) {
        var req = PDATA.prescriptionRequests[i];

        //Only show this patient's requests.
        if (req.patientID !== patient.patientID) continue;

        shown++;

        //Look up medicine name for display.
        var med = null;
        for (var j = 0; j < PDATA.medicines.length; j++) {
            if (PDATA.medicines[j].medicineID === req.medicineID) {
                med = PDATA.medicines[j];
                break;
            }
        }
        var medName = med ? med.name + " " + med.strength : "Unknown medicine";

        //Format submission date.
        var dateText = new Date(req.submittedAt).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        });

        //Status pill class and label.
        var pillClass = "rx_req_pending";
        if (req.status === "accepted") pillClass = "rx_req_accepted";
        if (req.status === "declined") pillClass = "rx_req_declined";

        //Cancel button only on pending requests — accepted/declined are final.
        var cancelBtn = req.status === "pending"
            ? '<button type="button" class="status_bar_cancel rx_req_cancel" data-rxr-id="' + req.rxRequestID + '">Cancel</button>'
            : "";

        var item = document.createElement("li");
        item.className = "rx_req_item";
        item.innerHTML =
            '<div class="rx_req_body">' +
                '<p class="rx_req_name">' + medName + '</p>' +
                '<p class="rx_req_meta">Requested ' + dateText +
                    (req.notes ? ' · "' + req.notes + '"' : "") + '</p>' +
            '</div>' +
            '<div class="rx_req_right">' +
                '<span class="rx_req_pill ' + pillClass + '">' + req.status + '</span>' +
                cancelBtn +
            '</div>';

        list.appendChild(item);
    }

    if (shown === 0) {
        list.innerHTML = "<li class='rx_req_empty'>No prescription requests yet.</li>";
    }

    //Event delegation for cancel buttons.
    list.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("rx_req_cancel")) {
            var rxrID = e.target.getAttribute("data-rxr-id");
            cancelRxRequest(rxrID, patient);
        }
    });
}


//It cancels a pending prescription request.
//DELETES: the prescription_requests record (reuses deleteRecord from db.js).
function cancelRxRequest(rxRequestID, patient) {
    deleteRecord("prescription_requests", rxRequestID, function() {
        //Remove from cache.
        PDATA.prescriptionRequests = PDATA.prescriptionRequests.filter(function(r) {
            return r.rxRequestID !== rxRequestID;
        });
        //Refresh the status list.
        showRxRequestStatus(patient);
    });
}
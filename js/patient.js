//getLoggedInPatient checks session storage, finds the patientID, and then loops through the PATIENTS array.
function getLoggedInPatient() {
    //It retuns the patientID of the currently logged in from session storage.
    var savedID = sessionStorage.getItem("patientID");

    //It loops through PATIENTS array from dummy-data.js.
    for (var i = 0; i < PATIENTS.length; i++) {

        //If patientID matches from session storage, it's our user.
        if (PATIENTS[i].patientID === savedID) {
            return PATIENTS[i];
        }
    }

    //Load Aanya sharma as demo patient
    for (var i = 0; i < PATIENTS.length; i++) {
        if (PATIENTS[i].patientID === "p001") {
            return PATIENTS[i];
        }
    }

    //However, if no matches were found, return null.
    return null;
}

//loadPatientDashboard just calls other functions that populate the different sections of the patient dashboard.
function loadPatientDashboard() {
    //Obtain patient login first.
    var patient = getLoggedInPatient();

    //If patient is not found, console.log will show "No patient found" and the function will stop executing.
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
    fillDoctorDropdown();
    setupFilterButtons();
    setupBookingForm();

}

//This function will show the patient's name in the welcome message at the top of the dashboard.
function showPatientName(patient) {
    //It finds the element with id="patientName" in HTML and sets the visible text to be the patient's first and last name.
    document.getElementById("patientName").textContent = patient.firstName + " " + patient.lastName;
}

//This function will show the doctor card on the dashboard and its details.
function showDoctorCard(patient) {
    var doctor = null;

    //Loop through DOCTORS array. If found, store the doctor in a variable and break the loop.
    for (var i = 0; i < DOCTORS.length; i++) {
        if (DOCTORS[i].doctorID === patient.registeredDoctorID) {
            doctor =  DOCTORS[i];
            break;
        }
    }

    //Else, if doctor not found, exit function.
    if (!doctor) return;
    
    //Doctor details; first name and last name, speciality, and GMC number are shown in the doctor card on the dashboard.
    document.getElementById("doctorName").textContent = doctor.title + " " + doctor.firstName + " " + doctor.lastName;
    document.getElementById("doctorSpecialty").textContent = doctor.specialty;
    document.getElementById("doctorGmc").textContent = doctor.gmcNumber.replace("GMC", "");
}

function showPatientStats(patient) {
    //APPOINTMENTS SECTION
    var nextAppointment = null;

    //It loops through APPOINTMENTS array.
    for (var i = 0; i < APPOINTMENTS.length; i++) {
        var appt = APPOINTMENTS[i];

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

        //Find the doctor for this appointment by looping through DOCTORS array and matching doctorID.
        var apptDoctor = null;
        for (var i = 0; i < DOCTORS.length; i++) {
            if (DOCTORS[i].doctorID === nextAppointment.doctorID) {
                apptDoctor = DOCTORS[i];
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

    for (var i = 0; i < PRESCRIPTIONS.length; i++) {
          //If the prescription is not for this patient OR if the prescription status is not "active", skip it.
          if (PRESCRIPTIONS[i].patientID !== patient.patientID || PRESCRIPTIONS[i].status !== "active") {
            continue;
          }
          //Increment the prescription counter till active prescription.
          rxCount++;

          //If it's the first active prescription found, find the medicine name by matching medicineID.
          if (rxCount === 1) {
            //Loop through MEDICINES array to find the medicine name for this prescription.
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
    document.getElementById("statRxCount").textContent = rxCount;
    document.getElementById("statRxSub").textContent = rxCount > 0 ? firstMedName : "No active prescriptions";

    
    //BLOOD GROUP SECTION
    document.getElementById("statBloodGroup").textContent = patient.bloodGroup;

    //VITALS SECTION
    var vitalsRecord = null;

    //Loop through VITALS array to find the vitals record for this patient by matching patientID.
    for (var i = 0; i < VITALS.length; i++) {
        if (VITALS[i].patientID === patient.patientID) {
            vitalsRecord = VITALS[i];
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

      //Loop through PRESCRIPTIONS ARRAY
      for (var i = 0; i < PRESCRIPTIONS.length; i++) {
        var rx = PRESCRIPTIONS[i]
        //Skip prescriptions that belongs to other patients
        if (rx.patientID !== patient.patientID) continue;
        //Prescription has been found
        found = true

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

        //Create new HTML element & css class
        var item = document.createElement("li");
        item.className = "rx_item";

        //innerHTML helps us create tags inside the list element
        item.innerHTML =
            '<div class="rx_item_pill">💊</div>' +
            '<div class="rx_item_body">' +
                '<p class="rx_item_name">' + medName + '</p>' +
                '<p class="rx_item_dose">' + rx.dosage + ' · ' + rx.frequency + ' · ' + rx.durationDays + ' days</p>' +
                '<p class="rx_item_note">' + rx.instructions + '</p>' +
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
    //Loop through MEDICAL_HISTORY array and push items at the end of array
    for (var i = 0; i < MEDICAL_HISTORY.length; i++) {
        if (MEDICAL_HISTORY[i].patientID === patient.patientID) {
            entries.push(MEDICAL_HISTORY[i]);
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
 
    //Loop through every APPOINTMENTS that belongs to patient
    for (var i = 0; i < APPOINTMENTS.length; i++) {
        if (APPOINTMENTS[i].patientID === patient.patientID && APPOINTMENTS[i].status === "booked") {
            if (nextAppt === null || APPOINTMENTS[i].date < nextAppt.date) {
                nextAppt = APPOINTMENTS[i];
            }
        }
    }
    //If appointment found
    if (nextAppt) {
 
        //Find the doctor for this appointment
        var doc = null;
        for (var i = 0; i < DOCTORS.length; i++) {
            if (DOCTORS[i].doctorID === nextAppt.doctorID) {
                doc = DOCTORS[i];
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
        select.remove(1);
    }

    //Add one <option> for each doctor in the DOCTORS array
    for (var i = 0; i < DOCTORS.length; i++) {
 
        //createElement creates an <option> element in memory
        var option = document.createElement("option");
 
        //value is what gets submitted or read by JavaScript
        option.value = DOCTORS[i].doctorID;
 
        //textContent is what the user actually sees in the dropdown
        option.textContent = DOCTORS[i].title + " " + DOCTORS[i].firstName + " " + DOCTORS[i].lastName + " · " + DOCTORS[i].specialty;
 
        //append this option to the select — it appears below the default "Choose a doctor..." option
        select.appendChild(option);
    }
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
        if (date === "" || doctor === "" || reason === "") {
            //Show the red error paragraph
            errorMsg.hidden = false; 
            return;
        }
 
        //All fields are filled that show the green success message
        successMsg.hidden = false;
 
        //.reset() clears all the form fields back to their default empty state
        form.reset();
    });
}
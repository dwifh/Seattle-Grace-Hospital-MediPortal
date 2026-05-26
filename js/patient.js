//DOMContentLoaded ensures that the html file has been read, then runs the function.
document.addEventListener("DOMContentLoaded", function() {
    loadPatientDashboard();
});

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
    showStats(patient);
}

//This function will show the patient's name in the welcome message at the top of the dashboard.
function showPatientName(patient) {
    //It finds the element with id="patientName" in HTML and sets the visible text to be the patient's first and last name.
    document.getElementById("patientName").textContent = patient.FirstName + " " + patient.LastName;
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
    document.getElementById("doctorName").textContent = doctor.title + " " + doctor.FirstName + " " + doctor.LastName;
    document.getElementById("doctorSpeciality").textContent = doctor.speciality;
    document.getElementById("doctorGMC").textContent = doctor.gmcNumber.replace("GMC", " ");
}

function showStats(patient) {
    //APPOINTMENTS SECTION
    var nextAppointment = null;

    //It loops through APPOINTMENTS array.
    for (var i = 0; i < APPOINTMENTS.length; i++) {
        var appt = APPOINTMENTS[i];

        //Skip if the appointment is not for this patient OR if the appointment status is "booked"
        if (appt.patientID === patient.patientID || appt.status === "booked") {
            continue;
        }

        //It shows the next upcoming appointment by comparing the date of each appointment to the current date and time. 
        //If the appointment is in the future and is sooner than any previously found upcoming appointment, it becomes the new nextAppointment.
        if (nextAppointment === null || appt.Date < nextAppointment.date) {
            nextAppointment = appt;
        }
    }

    //It displays the date and time of the next appointment on the dashboard.
    //However, if there are no upcoming appointments, it can display a message like "No upcoming appointments".
    if (nextAppointment !== null) {

        //Convert the appointment date string to a Date object, then format it to a more readable form (e.g. "26 May 2026").
        var apptDate = new Date(nextAppointment.Date);
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
        document.getElementById("statsNextAppt").textContent = dateText;
        document.getElementById("statsNextApptMeta").textContent = nextAppointment.time + " Dr. " + apptDoctor.LastName;

    } else {
        //If no upcoming appointments, display "-" for the date and a message in the meta text.
        document.getElementById("statsNextAppt").textContent = "-";
        document.getElementById("statsNextApptMeta").textContent = "No upcoming appointments";
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
                    firstMedName = MEDICINES[j].name + "·" + PRESCRIPTIONS[i].durationDays + " days";
                    break;
                }
            }
          }
    }

    //Display the prescription count and the name of the first active prescription.
    //'?' condition = shows value if true & value if false.
    document.getElementById("statRxCount").textContent = rxCount;
    document.getElementById("statFirstMed").textContent = rxCount > 0 ? firstMedName : "No active prescriptions";

    
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
        var vitalsRecord = new Date(vitalsRecord.lastUpdated);
        document.getElementById("statVitalsDate").textContent = vitalsRecord.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } else {
        document.getElementById("statVitalsDate").textContent = "No vitals recorded";
    }

    //ALLERGIES SECTION
    var allergies = patient.allergies;

    //Display the number of allergies and a preview of the first allergy. If no allergies, show "No allergies".
    document.getElementById("statAllergiesCount").textContent = allergies.length;
    document.getElementById("statFirstAllergy").textContent = allergies.length > 0 ? allergies.join(", ") : "No allergies";
}

function showPrescriptions(patient) {
      
}



// nurse.js — OWNED BY AYUSH

function loadNurseDashboard() {
    const session = getSession();
    const nurseRecord = NURSES.find(function(nurse) {
        return nurse.nurseID === session.nurseID;
    });

    if (!nurseRecord) {
        console.error('Nurse record not found for session:', session);
        return;
    }

    const assignedPatientIDs = nurseRecord.registeredPatient;

    loadNurseStats(assignedPatientIDs);
    loadNursePatientsTable(assignedPatientIDs);
    loadNurseVitalsTable(assignedPatientIDs);
    loadNurseAppointmentsTable(assignedPatientIDs);
    loadNursePrescriptionsTable(assignedPatientIDs);
    loadNurseHistoryTable(assignedPatientIDs);
}

// STATS 

function loadNurseStats(assignedPatientIDs) {
    document.getElementById('nurseAssignedCount').textContent = assignedPatientIDs.length;

    const upcomingCount = APPOINTMENTS.filter(function(assignedPatient) {
        return assignedPatientIDs.includes(assignedPatient.patientID) && assignedPatient.status === 'booked';
    }).length;
    document.getElementById('nurseUpcomingAppointments').textContent = upcomingCount;

    const activePrescriptionsCount = PRESCRIPTIONS.filter(function(prescription) {
        return assignedPatientIDs.includes(prescription.patientID) && prescription.status === 'active';
    }).length;
    document.getElementById('nurseActivePrescriptions').textContent = activePrescriptionsCount;
}

// ASSIGNED PATIENTS TABLE 

function loadNursePatientsTable(assignedPatientIDs) {
    const tbody = document.getElementById('nursePatientsTbody');
    tbody.innerHTML = '';

    const assignedPatients = PATIENTS.filter(function(patient) {
        return assignedPatientIDs.includes(patient.patientID);
    });

    assignedPatients.forEach(function(patient) {
        const doctor = DOCTORS.find(function(doctor) {
            return doctor.doctorID === patient.registeredDoctorID;
        });

        // ternary operator used to check for any allergies (if so, create a string and seperate each allergy by a ", " by using the "join" function)
        const allergies = patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None';

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + patient.patientID + '</td>' +
            '<td>' + patient.firstName + ' ' + patient.lastName + '</td>' +
            '<td>' + patient.dob + '</td>' +
            '<td>' + patient.bloodGroup + '</td>' +
            '<td>' + allergies + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName : 'Unknown') + '</td>';

        tbody.appendChild(row);
    });
}

// VITALS TABLE

function loadNurseVitalsTable(assignedPatientIDs) {
    const tbody = document.getElementById('nurseVitalsTbody');
    tbody.innerHTML = '';

    const assignedVitals = VITALS.filter(function(vitals) {
        return assignedPatientIDs.includes(vitals.patientID);
    });

    assignedVitals.forEach(function(vital) {
        const patient = PATIENTS.find(function(patient) {
            return patient.patientID === vital.patientID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + (patient ? patient.firstName + ' ' + patient.lastName : vital.patientID) + '</td>' +
            '<td>' + vital.heightCm + '</td>' +
            '<td>' + vital.weightKg + '</td>' +
            '<td>' + vital.bloodPressure + '</td>' +
            '<td>' + vital.heartRate + ' bpm</td>' +
            '<td>' + vital.lastUpdated + '</td>';

        tbody.appendChild(row);
    });
}

// APPOINTMENTS TABLE 

function loadNurseAppointmentsTable(assignedPatientIDs) {
    const tbody = document.getElementById('nurseAppointmentsTbody');
    tbody.innerHTML = '';

    const assignedAppointments = APPOINTMENTS.filter(function(appointment) {
        return assignedPatientIDs.includes(appointment.patientID);
    });

    assignedAppointments.forEach(function(appointment) {
        const patient = PATIENTS.find(function(patient) {
            return patient.patientID === appointment.patientID;
        });

        const doctor = DOCTORS.find(function(doctor) {
            return doctor.doctorID === appointment.doctorID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + appointment.appointmentID + '</td>' +
            '<td>' + (patient ? patient.firstName + ' ' + patient.lastName : appointment.patientID) + '</td>' +
            '<td>' + (doctor  ? doctor.title + ' ' + doctor.lastName : appointment.doctorID) + '</td>' +
            '<td>' + appointment.date + '</td>' +
            '<td>' + appointment.time + '</td>' +
            '<td>' + appointment.reason + '</td>' +
            '<td><span class="badge badge--' + appointment.status + '">' + appointment.status + '</span></td>' +
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>';

        tbody.appendChild(row);
    });
}

// PRESCRIPTIONS TABLE 

function loadNursePrescriptionsTable(assignedPatientIDs) {
    const tbody = document.getElementById('nursePrescriptionsTbody');
    tbody.innerHTML = '';

    const assignedPrescriptions = PRESCRIPTIONS.filter(function(prescription) {
        return assignedPatientIDs.includes(prescription.patientID) && prescription.status === 'active';
    });

    assignedPrescriptions.forEach(function(prescription) {
        const patient = PATIENTS.find(function(patient) { return patient.patientID  === prescription.patientID; });
        const medicine = MEDICINES.find(function(medicine) { return medicine.medicineID === prescription.medicineID; });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + prescription.prescriptionID + '</td>' +
            '<td>' + (patient  ? patient.firstName + ' ' + patient.lastName : prescription.patientID) + '</td>' +
            '<td>' + (medicine ? medicine.name : prescription.medicineID) + '</td>' +
            '<td>' + prescription.dosage + '</td>' +
            '<td>' + prescription.frequency + '</td>' +
            '<td>' + prescription.instructions + '</td>' +
            '<td><span class="badge badge--' + prescription.status + '">' + prescription.status + '</span></td>';

        tbody.appendChild(row);
    });
}

// MEDICAL HISTORY TABLE 

function loadNurseHistoryTable(assignedPatientIDs) {
    const tbody = document.getElementById('nurseHistoryTbody');
    tbody.innerHTML = '';

    const assignedHistory = MEDICAL_HISTORY.filter(function(history) {
        return assignedPatientIDs.includes(history.patientID);
    });

    assignedHistory.forEach(function(entry) {
        const patient = PATIENTS.find(function(patient) {
            return patient.patientID === entry.patientID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + entry.historyID + '</td>' +
            '<td>' + (patient ? patient.firstName + ' ' + patient.lastName : entry.patientID) + '</td>' +
            '<td>' + (entry.date || 'N/A') + '</td>' +
            '<td>' + (entry.type || 'N/A') + '</td>' +
            '<td>' + entry.title + '</td>' +
            '<td>' + entry.description + '</td>';

        tbody.appendChild(row);
    });
}
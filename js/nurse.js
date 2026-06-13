// nurse.js — OWNED BY AYUSH

function loadNurseDashboard() {
    var session = getSession();
    var nurseID = session.nurseID;

    openDatabase(function() {
        // Fetch the nurse's own record first to get assigned patient IDs
        getRecord('nurses', nurseID, function(idbNurse) {
            var nurseRecord = idbNurse || NURSES.find(function(n) { return n.nurseID === nurseID; });

            if (!nurseRecord) {
                console.error('Nurse record not found:', nurseID);
                return;
            }

            var assignedPatientIDs = nurseRecord.registeredPatient;

            // Load all required stores in sequence, fall back to dummy-data if empty
            getAllRecords('patients', function(idbPatients) {
            getAllRecords('doctors', function(idbDoctors) {
            getAllRecords('appointments', function(idbAppointments) {
            getAllRecords('prescriptions', function(idbPrescriptions) {
            getAllRecords('medicines', function(idbMedicines) {
            getAllRecords('medicalHistory', function(idbHistory) {
            getAllRecords('vitals', function(idbVitals) {

                var patients      = idbPatients.length      ? idbPatients      : PATIENTS;
                var doctors       = idbDoctors.length       ? idbDoctors       : DOCTORS;
                var appointments  = idbAppointments.length  ? idbAppointments  : APPOINTMENTS;
                var prescriptions = idbPrescriptions.length ? idbPrescriptions : PRESCRIPTIONS;
                var medicines     = idbMedicines.length     ? idbMedicines     : MEDICINES;
                var history       = idbHistory.length       ? idbHistory       : MEDICAL_HISTORY;
                var vitals        = idbVitals.length        ? idbVitals        : VITALS;

                loadNurseStats(assignedPatientIDs, appointments, prescriptions);
                loadNursePatientsTable(assignedPatientIDs, patients, doctors);
                loadNurseVitalsTable(assignedPatientIDs, vitals, patients);
                loadNurseAppointmentsTable(assignedPatientIDs, appointments, patients, doctors);
                loadNursePrescriptionsTable(assignedPatientIDs, prescriptions, patients, medicines);
                loadNurseHistoryTable(assignedPatientIDs, history, patients);

            });
            });
            });
            });
            });
            });
            });
        });
    });
}

// STATS

function loadNurseStats(assignedPatientIDs, appointments, prescriptions) {
    document.getElementById('nurseAssignedCount').textContent = assignedPatientIDs.length;

    var upcomingCount = appointments.filter(function(a) {
        return assignedPatientIDs.includes(a.patientID) && a.status === 'booked';
    }).length;
    document.getElementById('nurseUpcomingAppointments').textContent = upcomingCount;

    var activePrescriptionsCount = prescriptions.filter(function(p) {
        return assignedPatientIDs.includes(p.patientID) && p.status === 'active';
    }).length;
    document.getElementById('nurseActivePrescriptions').textContent = activePrescriptionsCount;
}

// ASSIGNED PATIENTS TABLE

function loadNursePatientsTable(assignedPatientIDs, patients, doctors) {
    var tbody = document.getElementById('nursePatientsTbody');
    tbody.innerHTML = '';

    var assignedPatients = patients.filter(function(p) {
        return assignedPatientIDs.includes(p.patientID);
    });

    assignedPatients.forEach(function(patient) {
        var doctor = doctors.find(function(d) {
            return d.doctorID === patient.registeredDoctorID;
        });

        // ternary operator used to check for any allergies (if so, create a string and separate each allergy by ", ")
        var allergies = patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None';

        var row = document.createElement('tr');
        row.innerHTML =
            '<td>' + patient.patientID + '</td>' +
            '<td>' + patient.firstName + ' ' + patient.lastName + '</td>' +
            '<td>' + patient.dob + '</td>' +
            '<td>' + (patient.bloodGroup || 'Unknown') + '</td>' +
            '<td>' + allergies + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName : 'Unknown') + '</td>';

        tbody.appendChild(row);
    });
}

// VITALS TABLE

function loadNurseVitalsTable(assignedPatientIDs, vitals, patients) {
    var tbody = document.getElementById('nurseVitalsTbody');
    tbody.innerHTML = '';

    var assignedVitals = vitals.filter(function(v) {
        return assignedPatientIDs.includes(v.patientID);
    });

    assignedVitals.forEach(function(vital) {
        var patient = patients.find(function(p) {
            return p.patientID === vital.patientID;
        });

        var row = document.createElement('tr');
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

function loadNurseAppointmentsTable(assignedPatientIDs, appointments, patients, doctors) {
    var tbody = document.getElementById('nurseAppointmentsTbody');
    tbody.innerHTML = '';

    var assignedAppointments = appointments.filter(function(a) {
        return assignedPatientIDs.includes(a.patientID);
    });

    assignedAppointments.forEach(function(appointment) {
        var patient = patients.find(function(p) {
            return p.patientID === appointment.patientID;
        });

        var doctor = doctors.find(function(d) {
            return d.doctorID === appointment.doctorID;
        });

        var row = document.createElement('tr');
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

function loadNursePrescriptionsTable(assignedPatientIDs, prescriptions, patients, medicines) {
    var tbody = document.getElementById('nursePrescriptionsTbody');
    tbody.innerHTML = '';

    var assignedPrescriptions = prescriptions.filter(function(p) {
        return assignedPatientIDs.includes(p.patientID) && p.status === 'active';
    });

    assignedPrescriptions.forEach(function(prescription) {
        var patient  = patients.find(function(p) { return p.patientID   === prescription.patientID; });
        var medicine = medicines.find(function(m) { return m.medicineID === prescription.medicineID; });

        var row = document.createElement('tr');
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

function loadNurseHistoryTable(assignedPatientIDs, history, patients) {
    var tbody = document.getElementById('nurseHistoryTbody');
    tbody.innerHTML = '';

    var assignedHistory = history.filter(function(h) {
        return assignedPatientIDs.includes(h.patientID);
    });

    assignedHistory.forEach(function(entry) {
        var patient = patients.find(function(p) {
            return p.patientID === entry.patientID;
        });

        var row = document.createElement('tr');
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

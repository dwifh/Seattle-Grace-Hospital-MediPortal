// nurse.js — OWNED BY AYUSH

// Module-level cache so vitals modal functions can read/update data without re-fetching IndexedDB
var _nurseAssignedPatientIDs = [];
var _nurseVitals = [];
var _nursePatients = [];

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

                var patients = idbPatients.length ? idbPatients : PATIENTS;
                var doctors = idbDoctors.length ? idbDoctors : DOCTORS;
                var appointments = idbAppointments.length ? idbAppointments : APPOINTMENTS;
                var prescriptions = idbPrescriptions.length ? idbPrescriptions : PRESCRIPTIONS;
                var medicines = idbMedicines.length ? idbMedicines : MEDICINES;
                var history = idbHistory.length ? idbHistory : MEDICAL_HISTORY;
                var vitals = idbVitals.length ? idbVitals : VITALS;

                _nurseAssignedPatientIDs = assignedPatientIDs;
                _nurseVitals = vitals;
                _nursePatients = patients;

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
            '<td>' + vital.lastUpdated + '</td>' +
            '<td><button class="adminEditBtn" onclick="openUpdateVitalsModal(\'' + vital.vitalID + '\')">Update</button></td>';

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

// MODAL CORE

function openNurseModal(title, bodyHtml, footerHtml) {
    document.getElementById('nurseModalTitle').textContent = title;
    document.getElementById('nurseModalBody').innerHTML = bodyHtml;
    document.getElementById('nurseModalFooter').innerHTML = footerHtml;
    document.getElementById('nurseModalOverlay').removeAttribute('hidden');
}

function closeNurseModal() {
    document.getElementById('nurseModalOverlay').setAttribute('hidden', '');
}

document.addEventListener('click', function(e) {
    var overlay = document.getElementById('nurseModalOverlay');
    if (overlay && !overlay.hasAttribute('hidden') && e.target === overlay) {
        closeNurseModal();
    }
});

// UPDATE VITALS MODAL

function openUpdateVitalsModal(vitalId) {
    var vital = _nurseVitals.find(function(v) { return v.vitalID === vitalId; });
    if (!vital) return;
    var patient = _nursePatients.find(function(p) { return p.patientID === vital.patientID; });
    var patientName = patient ? patient.firstName + ' ' + patient.lastName : vital.patientID;

    var bodyHtml =
        '<div class="adminModal-grid">' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="nf_heightCm">Height (cm)</label>' +
                '<input class="adminModal-input" type="number" id="nf_heightCm" value="' + vital.heightCm + '" />' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="nf_weightKg">Weight (kg)</label>' +
                '<input class="adminModal-input" type="number" id="nf_weightKg" value="' + vital.weightKg + '" />' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="nf_bloodPressure">Blood Pressure</label>' +
                '<input class="adminModal-input" type="text" id="nf_bloodPressure" value="' + vital.bloodPressure + '" />' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="nf_heartRate">Heart Rate (bpm)</label>' +
                '<input class="adminModal-input" type="number" id="nf_heartRate" value="' + vital.heartRate + '" />' +
            '</div>' +
        '</div>';
    var footerHtml =
        '<button class="adminModal-saveBtn" onclick="saveVitalsUpdate(\'' + vitalId + '\')">Save</button>' +
        '<button class="adminModal-cancelBtn" onclick="closeNurseModal()">Cancel</button>';

    openNurseModal('Update Vitals — ' + patientName, bodyHtml, footerHtml);
}

function saveVitalsUpdate(vitalId) {
    var vital = _nurseVitals.find(function(v) { return v.vitalID === vitalId; });
    if (!vital) return;

    vital.heightCm      = parseFloat(document.getElementById('nf_heightCm').value)    || vital.heightCm;
    vital.weightKg      = parseFloat(document.getElementById('nf_weightKg').value)    || vital.weightKg;
    vital.bloodPressure = document.getElementById('nf_bloodPressure').value.trim()    || vital.bloodPressure;
    vital.heartRate     = parseInt(document.getElementById('nf_heartRate').value, 10) || vital.heartRate;
    vital.lastUpdated   = new Date().toISOString().slice(0, 10);

    putRecord('vitals', vital, function() {
        loadNurseVitalsTable(_nurseAssignedPatientIDs, _nurseVitals, _nursePatients);
        closeNurseModal();
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

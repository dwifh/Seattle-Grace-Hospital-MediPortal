// admin.js — OWNED BY AYUSH

function loadAdminDashboard() {
    getAllRecords("patients", function(patients) {
    getAllRecords("doctors", function(doctors) {
    getAllRecords("nurses", function(nurses) {
    getAllRecords("receptionists", function(receptionists) {
    getAllRecords("guardians", function(guardians) {
    getAllRecords("appointments", function(appointments) {
    renderAdminDashboard(patients, doctors, nurses, receptionists, guardians, appointments);
    });
    });
    });
    });
    });
    });
}

// Decrypt all patient NHS numbers before rendering — admin is the only role permitted to see them.
// THEN - Load the stats and different tables
function renderAdminDashboard(patients, doctors, nurses, receptionists, guardians, appointments) {
    // Using Promise.all - .then; To handle an array of items (resolved when promise is resolved and rjected when promise is rejected)
    Promise.all(patients.map(function(Record) {
        var copy = Object.assign({}, patient);
        if (Record.nhsNumber && typeof Record.nhsNumber === "object") {
            // decryptField derived from crypto.js
            return decryptField(Record.nhsNumber).then(function(plain) {
                copy.nhsNumber = plain;
                return copy;
            });
        }
        return Promise.resolve(copy);
    })).then(function(decryptedPatients) {
        loadStats(decryptedPatients, doctors, appointments);
        loadDoctorsTable(doctors, decryptedPatients);
        loadNursesTable(nurses);
        loadReceptionistsTable(receptionists);
        loadPatientsTable(decryptedPatients, doctors);
        loadGuardiansTable(guardians, decryptedPatients);
    });
}

// STATS

function loadStats(patients, doctors, appointments) {
    document.getElementById('totalPatients').textContent = patients.length;
    document.getElementById('totalAppointments').textContent = appointments.length;
    document.getElementById('totalDoctors').textContent = doctors.length;

    const totalBeds = 20;
    const availableBeds = totalBeds - patients.length;
    document.getElementById('availableBeds').textContent = availableBeds;
}

// USER MANAGEMENT TABLES

function actionButtons(id) {
    return '<td>' +
        '<button class="adminEditBtn" onclick="alert(\'Edit ' + id + ' — available after backend implementation\')">Edit</button> ' +
        '<button class="adminDeleteBtn" onclick="alert(\'Delete ' + id + ' — available after backend implementation\')">Delete</button>' +
        '</td>';
}

function loadDoctorsTable(doctors, patients) {
    const tbody = document.getElementById('adminDoctorsTbody');
    tbody.innerHTML = '';

    doctors.forEach(function(doctor) {
        const assignedCount = patients.filter(function(p) {
            return p.registeredDoctorID === doctor.doctorID;
        }).length;

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + doctor.doctorID + '</td>' +
            '<td>' + doctor.title + ' ' + doctor.firstName + ' ' + doctor.lastName + '</td>' +
            '<td>' + doctor.specialty + '</td>' +
            '<td>' + doctor.gmcNumber + '</td>' +
            '<td>' + doctor.email + '</td>' +
            '<td>' + assignedCount + '</td>' +
            actionButtons(doctor.doctorID);

        tbody.appendChild(row);
    });
}

function loadNursesTable(nurses) {
    const tbody = document.getElementById('adminNursesTbody');
    tbody.innerHTML = '';

    nurses.forEach(function(nurse) {
        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + nurse.nurseID + '</td>' +
            '<td>' + nurse.title + ' ' + nurse.firstName + ' ' + nurse.lastName + '</td>' +
            '<td>' + nurse.nmcNumber + '</td>' +
            '<td>' + nurse.email + '</td>' +
            '<td>' + nurse.registeredPatient.join(', ') + '</td>' +
            actionButtons(nurse.nurseID);

        tbody.appendChild(row);
    });
}

function loadReceptionistsTable(receptionists) {
    const tbody = document.getElementById('adminReceptionistsTbody');
    tbody.innerHTML = '';

    receptionists.forEach(function(receptionist) {
        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + receptionist.receptionistID + '</td>' +
            '<td>' + receptionist.firstName + ' ' + receptionist.lastName + '</td>' +
            '<td>' + receptionist.email + '</td>' +
            '<td>' + receptionist.deskNumber + '</td>' +
            '<td>' + (receptionist.canCancelAppointments ? 'Yes' : 'No') + '</td>' +
            actionButtons(receptionist.receptionistID);

        tbody.appendChild(row);
    });
}

function loadPatientsTable(patients, doctors) {
    const tbody = document.getElementById('adminPatientsTbody');
    tbody.innerHTML = '';

    patients.forEach(function(patient) {
        const doctor = doctors.find(function(d) {
            return d.doctorID === patient.registeredDoctorID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + patient.patientID + '</td>' +
            '<td>' + patient.firstName + ' ' + patient.lastName + '</td>' +
            '<td>' + patient.dob + '</td>' +
            '<td>' + patient.nhsNumber + '</td>' +
            '<td>' + patient.address + '</td>' +
            '<td>' + patient.telephone + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName : 'Unknown') + '</td>' +
            '<td>' + (patient.guardianID ? patient.guardianID : 'None') + '</td>' +
            actionButtons(patient.patientID);

        tbody.appendChild(row);
    });
}

function loadGuardiansTable(guardians, patients) {
    const tbody = document.getElementById('adminGuardiansTbody');
    tbody.innerHTML = '';

    guardians.forEach(function(guardian) {
        const linkedPatient = patients.find(function(p) {
            return p.patientID === guardian.linkedPatientID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + guardian.guardianID + '</td>' +
            '<td>' + guardian.firstName + ' ' + guardian.lastName + '</td>' +
            '<td>' + guardian.relationship + '</td>' +
            '<td>' + (linkedPatient ? linkedPatient.firstName + ' ' + linkedPatient.lastName : guardian.linkedPatientID) + '</td>' +
            '<td>' + guardian.email + '</td>' +
            '<td>' + guardian.telephone + '</td>' +
            '<td>' + (guardian.consentGranted ? 'Yes' : 'No') + '</td>' +
            actionButtons(guardian.guardianID);

        tbody.appendChild(row);
    });
}

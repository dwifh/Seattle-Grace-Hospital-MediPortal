// admin.js — OWNED BY AYUSH

// initialise all table loading functions for the admin dashboard
function loadAdminDashboard() {
    loadStats();
    loadDoctorsTable();
    loadNursesTable();
    loadReceptionistsTable();
    loadPatientsTable();
    loadGuardiansTable();
}

// STATS cards

function loadStats() {
    document.getElementById('totalPatients').textContent = PATIENTS.length;
    document.getElementById('totalAppointments').textContent = APPOINTMENTS.length;
    document.getElementById('totalDoctors').textContent = DOCTORS.length;

    // applying a constant number of beds within the hospital because we havent implemented backend yet
    const totalBeds = 20;
    const availableBeds = totalBeds - PATIENTS.length;
    document.getElementById('availableBeds').textContent = availableBeds;
}

// USER MANAGEMENT TABLES 

function actionButtons(id) {
    return '<td>' +
        '<button class="adminEditBtn" onclick="alert(\'Edit ' + id + ' — available after backend implementation\')">Edit</button> ' +
        '<button class="adminDeleteBtn" onclick="alert(\'Delete ' + id + ' — available after backend implementation\')">Delete</button>' +
        '</td>';
}

 // all table loading functions will do the same thing - retreive the data from the dummy-data.js file and put them in the form of a table
 //(I've added add, edit and delete actions next for each actor)
function loadDoctorsTable() {
    const tbody = document.getElementById('adminDoctorsTbody');
    tbody.innerHTML = '';

    DOCTORS.forEach(function(doctor) {
        const assignedCount = PATIENTS.filter(function(p) {
            return p.registeredDoctorID === doctor.doctorID;
        }).length;

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + doctor.doctorID + '</td>' +
            '<td>' + doctor.title + ' ' + doctor.firstName + ' ' + doctor.lastName + '</td>' +
            '<td>' + doctor.specialty + '</td>' +
            '<td>' + doctor.gmcNumber + '</td>' +
            '<td>' + assignedCount + '</td>' +
            actionButtons(doctor.doctorID);

        tbody.appendChild(row);
    });
}

function loadNursesTable() {
    const tbody = document.getElementById('adminNursesTbody');
    tbody.innerHTML = '';

    NURSES.forEach(function(nurse) {
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

function loadReceptionistsTable() {
    const tbody = document.getElementById('adminReceptionistsTbody');
    tbody.innerHTML = '';

    RECEPTIONISTS.forEach(function(receptionist) {
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

function loadPatientsTable() {
    const tbody = document.getElementById('adminPatientsTbody');
    tbody.innerHTML = '';

    PATIENTS.forEach(function(patient) {
        const doctor = DOCTORS.find(function(d) {
            return d.doctorID === patient.registeredDoctorID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + patient.patientID + '</td>' +
            '<td>' + patient.firstName + ' ' + patient.lastName + '</td>' +
            '<td>' + patient.dob + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName : 'Unknown') + '</td>' +
            '<td>' + (patient.guardianID ? patient.guardianID : 'None') + '</td>' +
            actionButtons(patient.patientID);

        tbody.appendChild(row);
    });
}

function loadGuardiansTable() {
    const tbody = document.getElementById('adminGuardiansTbody');
    tbody.innerHTML = '';

    GUARDIAN.forEach(function(guardian) {
        const linkedPatient = PATIENTS.find(function(p) {
            return p.patientID === guardian.linkedPatientID;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + guardian.guardianID + '</td>' +
            '<td>' + guardian.firstName + ' ' + guardian.lastName + '</td>' +
            '<td>' + guardian.relationship + '</td>' +
            '<td>' + (linkedPatient ? linkedPatient.firstName + ' ' + linkedPatient.lastName : guardian.linkedPatientID) + '</td>' +
            '<td>' + guardian.email + '</td>' +
            '<td>' + (guardian.consentGranted ? 'Yes' : 'No') + '</td>' +
            actionButtons(guardian.guardianID);

        tbody.appendChild(row);
    });
}
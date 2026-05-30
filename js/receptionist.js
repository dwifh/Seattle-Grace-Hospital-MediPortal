// receptionist.js — OWNED BY AYUSH

function loadReceptionistDashboard() {
    loadReceptionistStats();
    loadTodaySchedule();
    loadAllAppointments();
    loadPatientDirectory();
}

// STATS

function loadReceptionistStats() {
    document.getElementById('receptionistTotalAppointments').textContent = APPOINTMENTS.length;

    // Get today's date in YYYY-MM-DD format to match dummy-data.js date strings
    const today = new Date().toISOString().slice(0, 10);

    const todayAppointments = APPOINTMENTS.filter(function(a) {
        return a.date === today;
    });

    document.getElementById('receptionistTodayAppointments').textContent = todayAppointments.length;

    const checkedIn = APPOINTMENTS.filter(function(a) {
        return a.checkInStatus === 'checked_in';
    }).length;
    document.getElementById('receptionistCheckedIn').textContent = checkedIn;

    const pending = APPOINTMENTS.filter(function(a) {
        return a.checkInStatus === 'pending';
    }).length;
    document.getElementById('receptionistPending').textContent = pending;
}

// TODAY'S SCHEDULE 

function loadTodaySchedule() {
    const tbody = document.getElementById('receptionistTodayTbody');
    tbody.innerHTML = '';

    const today = new Date().toISOString().slice(0, 10);

    const todayAppointments = APPOINTMENTS.filter(function(a) {
        return a.date === today;
    });

    if (todayAppointments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No appointments scheduled for today.</td>';
        tbody.appendChild(row);
        return;
    }

    todayAppointments.forEach(function(appointment) {
        const patient = PATIENTS.find(function(p) {
            return p.patientID === appointment.patientID;
        });

        const doctor = DOCTORS.find(function(d) {
            return d.doctorID === appointment.doctorID;
        });

        const receptionist = RECEPTIONISTS.find(function(r) {
            return r.receptionistID === appointment.bookedBy;
        });

        const row = document.createElement('tr');
        row.innerHTML =
            '<td>' + appointment.appointmentID + '</td>' +
            '<td>' + (patient ? patient.firstName + ' ' + patient.lastName : appointment.patientID) + '</td>' +
            '<td>' + (doctor  ? doctor.title + ' ' + doctor.lastName : appointment.doctorID) + '</td>' +
            '<td>' + appointment.time + '</td>' +
            '<td>' + appointment.reason + '</td>' +
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>';

        tbody.appendChild(row);
    });
}

// ALL APPOINTMENTS

function loadAllAppointments() {
    const tbody = document.getElementById('receptionistAppointmentsTbody');
    tbody.innerHTML = '';

    APPOINTMENTS.forEach(function(appointment) {
        const patient = PATIENTS.find(function(p) {
            return p.patientID === appointment.patientID;
        });

        const doctor = DOCTORS.find(function(d) {
            return d.doctorID === appointment.doctorID;
        });

        const receptionist = RECEPTIONISTS.find(function(r) {
            return r.receptionistID === appointment.bookedBy;
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
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>' +
            '<td>' + (receptionist ? receptionist.firstName + ' ' + receptionist.lastName : appointment.bookedBy) + '</td>';

        tbody.appendChild(row);
    });
}

// PATIENT DIRECTORY

function loadPatientDirectory() {
    const tbody = document.getElementById('receptionistPatientsTbody');
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
            '<td>' + patient.telephone + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName : 'Unknown') + '</td>';

        tbody.appendChild(row);
    });
}
// receptionist.js — OWNED BY AYUSH

function loadReceptionistDashboard() {
    openDatabase(function() {
        getAllRecords('appointments', function(idbAppointments) {
        getAllRecords('patients', function(idbPatients) {
        getAllRecords('doctors', function(idbDoctors) {
        getAllRecords('receptionists', function(idbReceptionists) {

            var appointments = idbAppointments.length ? idbAppointments: APPOINTMENTS;
            var patients= idbPatients.length ? idbPatients: PATIENTS;
            var doctors = idbDoctors.length ? idbDoctors: DOCTORS;
            var receptionists = idbReceptionists.length ? idbReceptionists: RECEPTIONISTS;

            loadReceptionistStats(appointments);
            loadTodaySchedule(appointments, patients, doctors);
            loadAllAppointments(appointments, patients, doctors, receptionists);
            loadPatientDirectory(patients, doctors);

        });
        });
        });
        });
    });
}

// STATS

function loadReceptionistStats(appointments) {
    document.getElementById('receptionistTotalAppointments').textContent = appointments.length;

    // Get today's date in YYYY-MM-DD format (ISO Format) to match data date strings
    var today = new Date().toISOString().slice(0, 10);

    var todayCount = appointments.filter(function(a) {
        return a.date === today;
    }).length;
    document.getElementById('receptionistTodayAppointments').textContent = todayCount;

    var checkedIn = appointments.filter(function(a) {
        return a.checkInStatus === 'checked_in';
    }).length;
    document.getElementById('receptionistCheckedIn').textContent = checkedIn;

    var pending = appointments.filter(function(a) {
        return a.checkInStatus === 'pending';
    }).length;
    document.getElementById('receptionistPending').textContent = pending;
}

// TODAY'S SCHEDULE

function loadTodaySchedule(appointments, patients, doctors) {
    var tbody = document.getElementById('receptionistTodayTbody');
    tbody.innerHTML = '';

    var today = new Date().toISOString().slice(0, 10);

    var todayAppointments = appointments.filter(function(a) {
        return a.date === today;
    });

    if (todayAppointments.length === 0) {
        var row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No appointments scheduled for today.</td>';
        tbody.appendChild(row);
        return;
    }

    todayAppointments.forEach(function(appointment) {
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
            '<td>' + appointment.time + '</td>' +
            '<td>' + appointment.reason + '</td>' +
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>';

        tbody.appendChild(row);
    });
}

// ALL APPOINTMENTS

function loadAllAppointments(appointments, patients, doctors, receptionists) {
    var tbody = document.getElementById('receptionistAppointmentsTbody');
    tbody.innerHTML = '';

    appointments.forEach(function(appointment) {
        var patient = patients.find(function(patient) {
            return patient.patientID === appointment.patientID;
        });

        var doctor = doctors.find(function(doc) {
            return doc.doctorID === appointment.doctorID;
        });

        var receptionist = receptionists.find(function(reception) {
            return reception.receptionistID === appointment.bookedBy;
        });

        var row = document.createElement('tr');
        row.innerHTML =
            '<td>' + appointment.appointmentID + '</td>' +
            '<td>' + (patient ? patient.firstName + ' ' + patient.lastName: appointment.patientID) + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName: appointment.doctorID) + '</td>' +
            '<td>' + appointment.date + '</td>' +
            '<td>' + appointment.time + '</td>' +
            '<td>' + appointment.reason + '</td>' +
            '<td><span class="badge badge--' + appointment.status + '">' + appointment.status       + '</span></td>' +
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>' +
            '<td>' + (receptionist ? receptionist.firstName + ' ' + receptionist.lastName: appointment.bookedBy) + '</td>';

        tbody.appendChild(row);
    });
}

// PATIENT DIRECTORY

function loadPatientDirectory(patients, doctors) {
    var tbody = document.getElementById('receptionistPatientsTbody');
    tbody.innerHTML = '';

    patients.forEach(function(patient) {
        var doctor = doctors.find(function(d) {
            return d.doctorID === patient.registeredDoctorID;
        });

        var row = document.createElement('tr');
        row.innerHTML =
            '<td>' + patient.patientID + '</td>' +
            '<td>' + patient.firstName + ' ' + patient.lastName + '</td>' +
            '<td>' + patient.dob + '</td>' +
            '<td>' + patient.telephone + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName : 'Unknown') + '</td>';

        tbody.appendChild(row);
    });
}

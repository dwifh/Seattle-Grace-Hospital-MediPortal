// receptionist.js — OWNED BY AYUSH

// Module-level cache so modal functions can read/update data without re-fetching IndexedDB
var _receptionistAppointments = [];
var _receptionistPatients = [];
var _receptionistDoctors = [];
var _receptionistReceptionists = [];

function loadReceptionistDashboard() {
    openDatabase(function() {
        getAllRecords('appointments', function(idbAppointments) {
        getAllRecords('patients', function(idbPatients) {
        getAllRecords('doctors', function(idbDoctors) {
        getAllRecords('receptionists', function(idbReceptionists) {

            var appointments = idbAppointments.length ? idbAppointments : APPOINTMENTS;
            var patients = idbPatients.length ? idbPatients : PATIENTS;
            var doctors = idbDoctors.length ? idbDoctors : DOCTORS;
            var receptionists = idbReceptionists.length ? idbReceptionists : RECEPTIONISTS;

            // Seed appointments to IndexedDB on first load so status changes persist
            if (!idbAppointments.length) {
                appointments.forEach(function(a) { putRecord('appointments', a); });
            }

            _receptionistAppointments = appointments;
            _receptionistPatients = patients;
            _receptionistDoctors = doctors;
            _receptionistReceptionists = receptionists;

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
        row.innerHTML = '<td colspan="7">No appointments scheduled for today.</td>';
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
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>' +
            '<td><button class="adminEditBtn" onclick="openUpdateAppointmentModal(\'' + appointment.appointmentID + '\')">Update</button></td>';

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

        // receptionistID as the FK on appointments so the appoints are derived from the FK
        var receptionist = receptionists.find(function(reception) {
            return reception.receptionistID === (appointment.receptionistID || appointment.bookedBy);
        });

        var row = document.createElement('tr');
        row.innerHTML =
            '<td>' + appointment.appointmentID + '</td>' +
            '<td>' + (patient ? patient.firstName + ' ' + patient.lastName: appointment.patientID) + '</td>' +
            '<td>' + (doctor ? doctor.title + ' ' + doctor.lastName: appointment.doctorID) + '</td>' +
            '<td>' + appointment.date + '</td>' +
            '<td>' + appointment.time + '</td>' +
            '<td>' + appointment.reason + '</td>' +
            '<td><span class="badge badge--' + appointment.status + '">' + appointment.status + '</span></td>' +
            '<td><span class="badge badge--' + appointment.checkInStatus + '">' + appointment.checkInStatus + '</span></td>' +
            '<td>' + (receptionist ? receptionist.firstName + ' ' + receptionist.lastName : (appointment.receptionistID || appointment.bookedBy)) + '</td>' +
            '<td><button class="adminEditBtn" onclick="openUpdateAppointmentModal(\'' + appointment.appointmentID + '\')">Update</button></td>';

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

// MODAL CORE

function openReceptionistModal(title, bodyHtml, footerHtml) {
    document.getElementById('receptionistModalTitle').textContent = title;
    document.getElementById('receptionistModalBody').innerHTML = bodyHtml;
    document.getElementById('receptionistModalFooter').innerHTML = footerHtml;
    document.getElementById('receptionistModalOverlay').removeAttribute('hidden');
}

function closeReceptionistModal() {
    document.getElementById('receptionistModalOverlay').setAttribute('hidden', '');
}

document.addEventListener('click', function(e) {
    var overlay = document.getElementById('receptionistModalOverlay');
    if (overlay && !overlay.hasAttribute('hidden') && e.target === overlay) {
        closeReceptionistModal();
    }
});

// UPDATE APPOINTMENT MODAL

function openUpdateAppointmentModal(appointmentId) {
    var appointment = _receptionistAppointments.find(function(a) { return a.appointmentID === appointmentId; });
    if (!appointment) return;

    var patient = _receptionistPatients.find(function(p) { return p.patientID === appointment.patientID; });
    var patientName = patient ? patient.firstName + ' ' + patient.lastName : appointment.patientID;

    var bodyHtml =
        '<div class="adminModal-grid">' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="rf_status">Appointment Status</label>' +
                '<select class="adminModal-input" id="rf_status">' +
                    '<option value="booked"' + (appointment.status === 'booked' ? ' selected' : '') + '>Booked</option>' +
                    '<option value="completed"' + (appointment.status === 'completed' ? ' selected' : '') + '>Completed</option>' +
                    '<option value="cancelled"' + (appointment.status === 'cancelled'? ' selected' : '') + '>Cancelled</option>' +
                '</select>' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="rf_checkInStatus">Check-in Status</label>' +
                '<select class="adminModal-input" id="rf_checkInStatus">' +
                    '<option value="pending"' + (appointment.checkInStatus === 'pending' ? ' selected' : '') + '>Pending</option>' +
                    '<option value="checked_in"' + (appointment.checkInStatus === 'checked_in' ? ' selected' : '') + '>Checked In</option>' +
                    '<option value="no_show"' + (appointment.checkInStatus === 'no_show' ? ' selected' : '') + '>No Show</option>' +
                '</select>' +
            '</div>' +
        '</div>';

    var footerHtml =
        '<button class="adminModal-saveBtn" onclick="saveAppointmentUpdate(\'' + appointmentId + '\')">Save</button>' +
        '<button class="adminModal-cancelBtn" onclick="closeReceptionistModal()">Cancel</button>';

    openReceptionistModal('Update Appointment — ' + patientName, bodyHtml, footerHtml);
}

function saveAppointmentUpdate(appointmentId) {
    var appointment = _receptionistAppointments.find(function(a) { return a.appointmentID === appointmentId; });
    if (!appointment) return;

    appointment.status = document.getElementById('rf_status').value;
    appointment.checkInStatus = document.getElementById('rf_checkInStatus').value;

    putRecord('appointments', appointment, function() {
        loadReceptionistStats(_receptionistAppointments);
        loadTodaySchedule(_receptionistAppointments, _receptionistPatients, _receptionistDoctors);
        loadAllAppointments(_receptionistAppointments, _receptionistPatients, _receptionistDoctors, _receptionistReceptionists);
        closeReceptionistModal();
    });
}

// ADD APPOINTMENT MODAL

function openAddAppointmentModal() {
    var patientOptions = _receptionistPatients.map(function(p) {
        return '<option value="' + p.patientID + '">' + p.firstName + ' ' + p.lastName + '</option>';
    }).join('');

    var doctorOptions = _receptionistDoctors.map(function(d) {
        return '<option value="' + d.doctorID + '">' + d.title + ' ' + d.lastName + '</option>';
    }).join('');

    var today = new Date().toISOString().slice(0, 10);

    var bodyHtml =
        '<div class="adminModal-grid">' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="af_patient">Patient</label>' +
                '<select class="adminModal-input" id="af_patient">' +
                    patientOptions +
                '</select>' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="af_doctor">Doctor</label>' +
                '<select class="adminModal-input" id="af_doctor">' +
                    doctorOptions +
                '</select>' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="af_date">Date</label>' +
                '<input class="adminModal-input" type="date" id="af_date" value="' + today + '" />' +
            '</div>' +
            '<div class="adminModal-field">' +
                '<label class="adminModal-label" for="af_time">Time</label>' +
                '<input class="adminModal-input" type="time" id="af_time" />' +
            '</div>' +
            '<div class="adminModal-field" style="grid-column: 1 / -1;">' +
                '<label class="adminModal-label" for="af_reason">Reason</label>' +
                '<input class="adminModal-input" type="text" id="af_reason" placeholder="Reason for visit" />' +
            '</div>' +
        '</div>';

    var footerHtml =
        '<button class="adminModal-saveBtn" onclick="saveNewAppointment()">Book Appointment</button>' +
        '<button class="adminModal-cancelBtn" onclick="closeReceptionistModal()">Cancel</button>';

    openReceptionistModal('New Appointment', bodyHtml, footerHtml);
}

function saveNewAppointment() {
    var patientID = document.getElementById('af_patient').value;
    var doctorID  = document.getElementById('af_doctor').value;
    var date = document.getElementById('af_date').value.trim();
    var time = document.getElementById('af_time').value.trim();
    var reason = document.getElementById('af_reason').value.trim();

    if (!date || !time || !reason) {
        alert('Please fill in date, time, and reason.');
        return;
    }

    // Generate next appointmentID based on current count
    var nextNum = _receptionistAppointments.length + 1;
    var newID = 'ap' + String(nextNum).padStart(3, '0');
    // Make sure the ID is unique in case of gaps
    while (_receptionistAppointments.find(function(a) { return a.appointmentID === newID; })) {
        nextNum++;
        newID = 'ap' + String(nextNum).padStart(3, '0');
    }

    var session = getSession();

    var newAppointment = {
        appointmentID: newID,
        patientID: patientID,
        doctorID: doctorID,
        receptionistID: session.receptionistID || '',
        date: date,
        time: time,
        reason: reason,
        status:'booked',
        notes: '',
        checkInStatus:'pending'
    };

    putRecord('appointments', newAppointment, function() {
        _receptionistAppointments.push(newAppointment);
        loadReceptionistStats(_receptionistAppointments);
        loadTodaySchedule(_receptionistAppointments, _receptionistPatients, _receptionistDoctors);
        loadAllAppointments(_receptionistAppointments, _receptionistPatients, _receptionistDoctors, _receptionistReceptionists);
        closeReceptionistModal();
    });
}

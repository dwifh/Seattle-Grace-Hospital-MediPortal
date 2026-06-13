// admin.js — OWNED BY AYUSH

// Module-level cache so modal functions can read/update data without re-fetching IndexedDB
var _patients = [], _doctors = [], _nurses = [], _receptionists = [], _guardians = [], _appointments = [];
var _appointmentPollInterval = null;

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
        var copy = Object.assign({}, Record);
        if (Record.nhsNumber && typeof Record.nhsNumber === "object") {
            return decryptField(Record.nhsNumber).then(function(plain) {
                copy.nhsNumber = plain;
                return copy;
            });
        }
        return Promise.resolve(copy);
    })).then(function(decryptedPatients) {
        return Promise.all(doctors.map(function(Record) {
            var copy = Object.assign({}, Record);
            if (Record.gmcNumber && typeof Record.gmcNumber === "object") {
                return decryptField(Record.gmcNumber).then(function(plain) {
                    copy.gmcNumber = plain;
                    return copy;
                });
            }
            return Promise.resolve(copy);
        })).then(function(decryptedDoctors) {
            _patients = decryptedPatients;
            _doctors = decryptedDoctors;
            _nurses = nurses;
            _receptionists = receptionists;
            _guardians = guardians;
            _appointments = appointments;

            // Poll IndexedDB every 30 seconds to pick up appointment changes made by other roles
            if (_appointmentPollInterval) { clearInterval(_appointmentPollInterval); }
            _appointmentPollInterval = setInterval(function() {
                getAllRecords("appointments", function(fresh) {
                    _appointments = fresh;
                    loadStats(_patients, _doctors, _appointments);
                });
            }, 30000);

            loadStats(_patients, _doctors, _appointments);
            loadDoctorsTable(decryptedDoctors, decryptedPatients);
            loadNursesTable(nurses);
            loadReceptionistsTable(receptionists);
            loadPatientsTable(decryptedPatients, decryptedDoctors);
            loadGuardiansTable(guardians, decryptedPatients);
        });
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

// type = 'doctor' , 'nurse' , 'receptionist' , 'patient' , 'guardian'
// id = the record's primary key (e.g. 'd001')
function actionButtons(type, id) {
    return '<td>' +
        '<button class="adminEditBtn" onclick="openEditModal(\'' + type + '\', \'' + id + '\')">Edit</button> ' +
        '<button class="adminDeleteBtn" onclick="openDeleteConfirm(\'' + type + '\', \'' + id + '\')">Delete</button>' +
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
            actionButtons('doctor', doctor.doctorID);

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
            actionButtons('nurse', nurse.nurseID);

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
            actionButtons('receptionist', receptionist.receptionistID);

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
            actionButtons('patient', patient.patientID);

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
            actionButtons('guardian', guardian.guardianID);

        tbody.appendChild(row);
    });
}

// SEARCH

// Hides rows whose full text doesn't contain the query. Hooked via oninput on each section's search box.
function filterSection(searchInput, tbodyId) {
    var query = searchInput.value.trim().toLowerCase();
    var tableBody = document.getElementById(tbodyId);
    var rows = tableBody.rows;
    
    //Converting to lowercase to prevent case sensitive searches
    for (var i = 0; i < rows.length; i++) {
        var rowText = rows[i].textContent.toLowerCase();
        rows[i].style.display = (rowText.indexOf(query) !== -1) ? '' : 'none';
    }
}

// MODAL POPUP CORE

function openAdminModal(title, bodyHtml, footerHtml) {
    document.getElementById('adminModalTitle').textContent = title;
    document.getElementById('adminModalBody').innerHTML = bodyHtml;
    document.getElementById('adminModalFooter').innerHTML = footerHtml;
    document.getElementById('adminModalOverlay').removeAttribute('hidden');
}

function closeAdminModal() {
    document.getElementById('adminModalOverlay').setAttribute('hidden', '');
}

// Clicking the dark backdrop (not the modal box itself) also closes it
document.addEventListener('click', function(e) {
    var overlay = document.getElementById('adminModalOverlay');
    if (overlay && !overlay.hasAttribute('hidden') && e.target === overlay) {
        closeAdminModal();
    }
});

// FORM FRAGMENT HELPERS 

// Renders a single labelled input. Quotes in the value are escaped so they don't break the HTML attribute.
function formField(labelText, inputId, currentValue, inputType) {
    inputType = inputType || 'text';
    var safeValue = (currentValue !== undefined && currentValue !== null) ? String(currentValue).replace(/"/g, '&quot;') : '';

    return '<div class="adminModal-field">' +
        '<label class="adminModal-label" for="' + inputId + '">' + labelText + '</label>' +
        '<input class="adminModal-input" type="' + inputType + '" id="' + inputId + '" value="' + safeValue + '" />' +
        '</div>';
}

// Renders a labelled <select>. Uses adminModal-field--full so it spans the whole grid row, not just half.
function formSelect(labelText, selectId, optionsList, currentValue) {
    var optionsHtml = optionsList.map(function(option) {
        var isSelected = (String(option.value) === String(currentValue || '')) ? ' selected' : '';
        return '<option value="' + option.value + '"' + isSelected + '>' + option.label + '</option>';
    }).join('');

    return '<div class="adminModal-field adminModal-field--full">' +
        '<label class="adminModal-label" for="' + selectId + '">' + labelText + '</label>' +
        '<select class="adminModal-select" id="' + selectId + '">' + optionsHtml + '</select>' +
        '</div>';
}

// Checkbox label sits to the right of the input, so the layout is reversed vs. regular fields.
function formCheckbox(labelText, checkboxId, isChecked) {
    return '<div class="adminModal-field adminModal-field--check">' +
        '<input class="adminModal-checkbox" type="checkbox" id="' + checkboxId + '"' + (isChecked ? ' checked' : '') + ' />' +
        '<label class="adminModal-label" for="' + checkboxId + '">' + labelText + '</label>' +
        '</div>';
}

// Blue info box shown on Add modals explaining what password will be auto-generated.
function infoBanner(messageHtml) {
    return '<p class="adminModal-hint"><i class="ti ti-info-circle"></i> ' + messageHtml + '</p>';
}

// FORM BUILDERS - used for different modal popups
function buildDoctorForm(doctor, isAddMode) {
    doctor = doctor || {};
    return '<div class="adminModal-grid">' +
        formField('Title','mf_title', doctor.title) +
        formField('First Name','mf_firstName', doctor.firstName) +
        formField('Last Name','mf_lastName', doctor.lastName) +
        formField('Specialty','mf_specialty', doctor.specialty) +
        formField('GMC Number','mf_gmcNumber',doctor.gmcNumber) +
        formField('Email', 'mf_email',doctor.email, 'email') +
        '</div>' +
        (isAddMode ? infoBanner('Password will be <strong>Doctor</strong> + last 4 digits of the GMC number.') : '');
}

function buildNurseForm(nurse, isAddMode) {
    nurse = nurse || {};
    return '<div class="adminModal-grid">' +
        formField('Title','mf_title', nurse.title) +
        formField('First Name', 'mf_firstName',nurse.firstName) +
        formField('Last Name','mf_lastName',nurse.lastName) +
        formField('NMC Number','mf_nmcNumber',nurse.nmcNumber) +
        formField('Email', 'mf_email', nurse.email, 'email') +
        '</div>' +
        (isAddMode ? infoBanner('Password will be <strong>Nurse</strong> + last 4 digits of the NMC number.') : '');
}

function buildReceptionistForm(receptionist, isAddMode) {
    receptionist = receptionist || {};
    return '<div class="adminModal-grid">' +
        formField('First Name', 'mf_firstName',receptionist.firstName) +
        formField('Last Name','mf_lastName', receptionist.lastName) +
        formField('Email', 'mf_email', receptionist.email, 'email') +
        formField('Desk Number','mf_deskNumber',receptionist.deskNumber) +
        '</div>' +
        formCheckbox('Can cancel appointments', 'mf_canCancel', receptionist.canCancelAppointments) +
        (isAddMode ? infoBanner('Password will be <strong>Reception</strong> + account number.') : '');
}

function buildPatientForm(patient) {
    patient = patient || {};

    // Doctor dropdown — pulled from the cached list loaded at dashboard init
    var doctorOptions = [{ value: '', label: '— Select doctor —' }];
    _doctors.forEach(function(doc) {
        doctorOptions.push({ value: doc.doctorID, label: doc.title + ' ' + doc.firstName + ' ' + doc.lastName });
    });

    // Guardian is optional — "None" is the first option
    var guardianOptions = [{ value: '', label: '— None —' }];
    _guardians.forEach(function(g) {
        guardianOptions.push({ value: g.guardianID, label: g.firstName + ' ' + g.lastName });
    });

    return '<div class="adminModal-grid">' +
        formField('First Name', 'mf_firstName', patient.firstName) +
        formField('Last Name', 'mf_lastName', patient.lastName) +
        formField('Date of Birth', 'mf_dob', patient.dob, 'date') +
        formField('NHS Number', 'mf_nhsNumber', patient.nhsNumber) +
        formField('Telephone', 'mf_telephone', patient.telephone, 'tel') +
        formField('Email', 'mf_email', patient.email, 'email') +
        formField('Address', 'mf_address', patient.address) +
        formField('Blood Group', 'mf_bloodGroup', patient.bloodGroup) +
        formField('Allergies (comma-separated)', 'mf_allergies', patient.allergies ? patient.allergies.join(', ') : '') +
        '</div>' +
        formSelect('Registered Doctor', 'mf_registeredDoctorID', doctorOptions, patient.registeredDoctorID) +
        formSelect('Linked Guardian', 'mf_guardianID', guardianOptions, patient.guardianID || '');
}

function buildGuardianForm(guardian, isAddMode) {
    guardian = guardian || {};

    // Every guardian must be linked to exactly one patient
    var patientOptions = [{ value: '', label: '— Select patient —' }];
    _patients.forEach(function(patient) {
        patientOptions.push({ value: patient.patientID, label: patient.firstName + ' ' + patient.lastName });
    });

    return '<div class="adminModal-grid">' +
        formField('First Name', 'mf_firstName', guardian.firstName) +
        formField('Last Name', 'mf_lastName', guardian.lastName) +
        formField('Relationship', 'mf_relationship', guardian.relationship) +
        formField('Email', 'mf_email', guardian.email, 'email') +
        formField('Telephone', 'mf_telephone', guardian.telephone, 'tel') +
        '</div>' +
        formSelect('Linked Patient', 'mf_linkedPatientID', patientOptions, guardian.linkedPatientID) +
        formCheckbox('Consent Granted', 'mf_consentGranted', guardian.consentGranted) +
        (isAddMode ? infoBanner('Password will be <strong>Guardian</strong> + account number.') : '');
}

// EDIT MODAL 

function openEditModal(type, id) {
    // Shared footer builder — just needs the type and id wired into the save call
    var saveFooter = 
        '<button class="adminModal-saveBtn" onclick="saveEdit(\'' + type + '\', \'' + id + '\')">Save Changes</button>' +
        '<button class="adminModal-cancelBtn" onclick="closeAdminModal()">Cancel</button>';

    if (type === 'doctor') {
        var doctor = _doctors.find(function(d) { return d.doctorID === id; });
        if (!doctor) return;
        openAdminModal('Edit Doctor', buildDoctorForm(doctor, false), saveFooter);

    } else if (type === 'nurse') {
        var nurse = _nurses.find(function(n) { return n.nurseID === id; });
        if (!nurse) return;
        openAdminModal('Edit Nurse', buildNurseForm(nurse, false), saveFooter);

    } else if (type === 'receptionist') {
        var receptionist = _receptionists.find(function(r) { return r.receptionistID === id; });
        if (!receptionist) return;
        openAdminModal('Edit Receptionist', buildReceptionistForm(receptionist, false), saveFooter);

    } else if (type === 'patient') {
        var patient = _patients.find(function(p) { return p.patientID === id; });
        if (!patient) return;
        openAdminModal('Edit Patient', buildPatientForm(patient), saveFooter);

    } else if (type === 'guardian') {
        var guardian = _guardians.find(function(g) { return g.guardianID === id; });
        if (!guardian) return;
        openAdminModal('Edit Guardian', buildGuardianForm(guardian, false), saveFooter);
    }
}

// SAVE EDIT 

// Reads the modal form values, mutates the in-memory record, persists to IndexedDB, and re-renders the table.
function saveEdit(type, id) {
    if (type === 'doctor') {
        var doctor = _doctors.find(function(d) { return d.doctorID === id; });
        if (!doctor) return;
        doctor.title = document.getElementById('mf_title').value.trim();
        doctor.firstName = document.getElementById('mf_firstName').value.trim();
        doctor.lastName = document.getElementById('mf_lastName').value.trim();
        doctor.specialty = document.getElementById('mf_specialty').value.trim();
        var plainGmc = document.getElementById('mf_gmcNumber').value.trim();
        doctor.email = document.getElementById('mf_email').value.trim();
        encryptField(plainGmc).then(function(encGmc) {
            doctor.gmcNumber = plainGmc;  // keep plaintext in the memory cache for display
            var toStore = Object.assign({}, doctor, { gmcNumber: encGmc });
            putRecord('doctors', toStore, function() {
                loadDoctorsTable(_doctors, _patients);
                closeAdminModal();
            });
        });

    } else if (type === 'nurse') {
        var nurse = _nurses.find(function(n) { return n.nurseID === id; });
        if (!nurse) return;
        nurse.title = document.getElementById('mf_title').value.trim();
        nurse.firstName = document.getElementById('mf_firstName').value.trim();
        nurse.lastName = document.getElementById('mf_lastName').value.trim();
        nurse.nmcNumber = document.getElementById('mf_nmcNumber').value.trim();
        nurse.email = document.getElementById('mf_email').value.trim();
        putRecord('nurses', nurse, function() {
            loadNursesTable(_nurses);
            closeAdminModal();
        });

    } else if (type === 'receptionist') {
        var receptionist = _receptionists.find(function(r) { return r.receptionistID === id; });
        if (!receptionist) return;
        receptionist.firstName = document.getElementById('mf_firstName').value.trim();
        receptionist.lastName = document.getElementById('mf_lastName').value.trim();
        receptionist.email = document.getElementById('mf_email').value.trim();
        receptionist.deskNumber = document.getElementById('mf_deskNumber').value.trim();
        receptionist.canCancelAppointments = document.getElementById('mf_canCancel').checked;
        putRecord('receptionists', receptionist, function() {
            loadReceptionistsTable(_receptionists);
            closeAdminModal();
        });

    } else if (type === 'patient') {
        var patient = _patients.find(function(p) { return p.patientID === id; });
        if (!patient) return;
        patient.firstName = document.getElementById('mf_firstName').value.trim();
        patient.lastName = document.getElementById('mf_lastName').value.trim();
        patient.dob = document.getElementById('mf_dob').value;
        patient.telephone = document.getElementById('mf_telephone').value.trim();
        patient.email = document.getElementById('mf_email').value.trim();
        patient.address = document.getElementById('mf_address').value.trim();
        patient.bloodGroup = document.getElementById('mf_bloodGroup').value.trim() || null;
        patient.registeredDoctorID = document.getElementById('mf_registeredDoctorID').value || null;
        patient.guardianID = document.getElementById('mf_guardianID').value || null;

        var allergiesRaw = document.getElementById('mf_allergies').value.trim();
        patient.allergies = allergiesRaw
            ? allergiesRaw.split(',').map(function(a) { return a.trim(); }).filter(function(a) { return a; })
            : [];

        // NHS number may have been edited — re-encrypt before storing, keep plaintext in cache
        var plainNhs = document.getElementById('mf_nhsNumber').value.trim();
        encryptField(plainNhs).then(function(encNhs) {
            patient.nhsNumber = plainNhs;
            var toStore = Object.assign({}, patient, { nhsNumber: encNhs });
            putRecord('patients', toStore, function() {
                loadPatientsTable(_patients, _doctors);
                closeAdminModal();
            });
        });

    } else if (type === 'guardian') {
        var guardian = _guardians.find(function(g) { return g.guardianID === id; });
        if (!guardian) return;
        guardian.firstName = document.getElementById('mf_firstName').value.trim();
        guardian.lastName = document.getElementById('mf_lastName').value.trim();
        guardian.relationship = document.getElementById('mf_relationship').value.trim();
        guardian.email = document.getElementById('mf_email').value.trim();
        guardian.telephone = document.getElementById('mf_telephone').value.trim();
        guardian.linkedPatientID = document.getElementById('mf_linkedPatientID').value;
        guardian.consentGranted = document.getElementById('mf_consentGranted').checked;
        putRecord('guardians', guardian, function() {
            loadGuardiansTable(_guardians, _patients);
            closeAdminModal();
        });
    }
}

// ADD MODAL 

function openAddModal(type) {
    var addFooter = 
        '<button class="adminModal-saveBtn" onclick="addUser(\'' + type + '\')">Create Account</button>' +
        '<button class="adminModal-cancelBtn" onclick="closeAdminModal()">Cancel</button>';

    if (type === 'doctor') {
        openAdminModal('Add Doctor', buildDoctorForm(null, true), addFooter);
    } else if (type === 'nurse') {
        openAdminModal('Add Nurse', buildNurseForm(null, true), addFooter);
    } else if (type === 'receptionist') {
        openAdminModal('Add Receptionist', buildReceptionistForm(null, true), addFooter);
    } else if (type === 'guardian') {
        openAdminModal('Add Guardian', buildGuardianForm(null, true), addFooter);
    }
}

// ID GENERATION 

// Scans the existing records, finds the highest numeric suffix, and returns the next one zero-padded to 3 digits.
// for exxample: existing doctors ['d001', 'd002'] → returns 'd003'

function nextId(prefix, existingRecords, idField) {
    var highestNum = 0;

    existingRecords.forEach(function(record) {
        var numericPart = parseInt((record[idField] || '').replace(/[^0-9]/g, ''), 10) || 0;
        if (numericPart > highestNum) {
            highestNum = numericPart;
        }
    });

    var nextNum = highestNum + 1;
    var padded  = nextNum < 10 ? '00' + nextNum : (nextNum < 100 ? '0' + nextNum : '' + nextNum);
    return prefix + padded;
}

// ADD USER 

// Creates a new record in the role store AND a matching entry in the users store.
// NOTE: new accounts only exist in IndexedDB — the source JSON files cannot be updated from the browser.
function addUser(type) {
    clearModalError();

    if (type === 'doctor') {
        var title = document.getElementById('mf_title').value.trim();
        var firstName = document.getElementById('mf_firstName').value.trim();
        var lastName = document.getElementById('mf_lastName').value.trim();
        var specialty = document.getElementById('mf_specialty').value.trim();
        var gmcNumber = document.getElementById('mf_gmcNumber').value.trim();
        var email = document.getElementById('mf_email').value.trim();

        if (!firstName || !lastName || !specialty || !gmcNumber || !email) {
            showModalError('Please fill in all required fields.'); return;
        }

        var doctorId = nextId('d', _doctors, 'doctorID');
        var username = makeUsername(firstName, lastName);
        var password = 'Doctor' + gmcNumber.slice(-4);

        encryptField(gmcNumber).then(function(encGmc) {
            return encryptField(password).then(function(encPass) {
                var newDoctor = { doctorID: doctorId, title: title, firstName: firstName, lastName: lastName, specialty: specialty, gmcNumber: encGmc, email: email };
                putRecord('doctors', newDoctor, function() {
                    putRecord('users', { username: username, password: encPass, role: 'doctor', doctorID: doctorId }, function() {
                        // Cache holds plaintext GMC so the table can display it without re-decrypting
                        _doctors.push(Object.assign({}, newDoctor, { gmcNumber: gmcNumber }));
                        loadDoctorsTable(_doctors, _patients);
                        loadStats(_patients, _doctors, _appointments);
                        showCredentials(username, password);
                    });
                });
            });
        });

    } else if (type === 'nurse') {
        var title = document.getElementById('mf_title').value.trim();
        var firstName = document.getElementById('mf_firstName').value.trim();
        var lastName = document.getElementById('mf_lastName').value.trim();
        var nmcNumber = document.getElementById('mf_nmcNumber').value.trim();
        var email = document.getElementById('mf_email').value.trim();

        if (!firstName || !lastName || !nmcNumber || !email) {
            showModalError('Please fill in all required fields.'); return;
        }

        var nurseId = nextId('n', _nurses, 'nurseID');
        var username = makeUsername(firstName, lastName);
        var password = 'Nurse' + nmcNumber.slice(-4);
        var newNurse = { nurseID: nurseId, title: title, firstName: firstName, lastName: lastName, nmcNumber: nmcNumber, email: email, registeredPatient: [] };

        encryptField(password).then(function(encPass) {
            putRecord('nurses', newNurse, function() {
                putRecord('users', { username: username, password: encPass, role: 'nurse', nurseID: nurseId }, function() {
                    _nurses.push(newNurse);
                    loadNursesTable(_nurses);
                    showCredentials(username, password);
                });
            });
        });

    } else if (type === 'receptionist') {
        var firstName = document.getElementById('mf_firstName').value.trim();
        var lastName = document.getElementById('mf_lastName').value.trim();
        var email = document.getElementById('mf_email').value.trim();
        var deskNumber = document.getElementById('mf_deskNumber').value.trim();
        var canCancel = document.getElementById('mf_canCancel').checked;

        if (!firstName || !lastName || !email) {
            showModalError('Please fill in all required fields.'); return;
        }

        var receptionistId = nextId('r', _receptionists, 'receptionistID');
        var idNum = receptionistId.replace(/[^0-9]/g, '');
        var username = makeUsername(firstName, lastName);
        var password = 'Reception' + idNum;
        var newReceptionist = { receptionistID: receptionistId, firstName: firstName, lastName: lastName, email: email, deskNumber: deskNumber, canCancelAppointments: canCancel };

        encryptField(password).then(function(encPass) {
            putRecord('receptionists', newReceptionist, function() {
                putRecord('users', { username: username, password: encPass, role: 'receptionist', receptionistID: receptionistId }, function() {
                    _receptionists.push(newReceptionist);
                    loadReceptionistsTable(_receptionists);
                    showCredentials(username, password);
                });
            });
        });

    } else if (type === 'guardian') {
        var firstName = document.getElementById('mf_firstName').value.trim();
        var lastName = document.getElementById('mf_lastName').value.trim();
        var relationship = document.getElementById('mf_relationship').value.trim();
        var email = document.getElementById('mf_email').value.trim();
        var telephone = document.getElementById('mf_telephone').value.trim();
        var linkedPatientID = document.getElementById('mf_linkedPatientID').value;
        var consentGranted = document.getElementById('mf_consentGranted').checked;

        if (!firstName || !lastName || !relationship || !email || !telephone || !linkedPatientID) {
            showModalError('Please fill in all required fields.'); return;
        }

        var guardianId = nextId('g', _guardians, 'guardianID');
        var idNum = guardianId.replace(/[^0-9]/g, '');
        var username = makeUsername(firstName, lastName);
        var password = 'Guardian' + idNum;
        var newGuardian = { guardianID: guardianId, firstName: firstName, lastName: lastName, relationship: relationship, email: email, telephone: telephone, linkedPatientID: linkedPatientID, consentGranted: consentGranted };

        encryptField(password).then(function(encPass) {
            putRecord('guardians', newGuardian, function() {
                putRecord('users', { username: username, password: encPass, role: 'guardian', guardianID: guardianId }, function() {
                    _guardians.push(newGuardian);
                    loadGuardiansTable(_guardians, _patients);
                    showCredentials(username, password);
                });
            });
        });
    }
}

// CREDENTIALS DISPLAY 

// Replaces the modal content with the generated credentials after a successful account creation.
function showCredentials(username, password) {
    document.getElementById('adminModalTitle').textContent = 'Account Created';
    document.getElementById('adminModalBody').innerHTML =
        '<div class="adminModal-creds">' +
            '<p class="adminModal-creds-label">Share these credentials with the new staff member. They will not be shown again.</p>' +
            '<div class="adminModal-creds-row"><span>Username</span><strong>' + username + '</strong></div>' +
            '<div class="adminModal-creds-row"><span>Password</span><strong>' + password + '</strong></div>' +
        '</div>';
    document.getElementById('adminModalFooter').innerHTML =
        '<button class="adminModal-saveBtn" onclick="closeAdminModal()">Done</button>';
}

//MODAL ERROR HELPERS 

function showModalError(message) {
    var existing = document.getElementById('adminModalError');
    if (existing) { existing.textContent = message; return; }
    var errorEl = document.createElement('p');
    errorEl.id = 'adminModalError';
    errorEl.className = 'adminModal-error';
    errorEl.textContent = message;
    document.getElementById('adminModalBody').appendChild(errorEl);
}

function clearModalError() {
    var existing = document.getElementById('adminModalError');
    if (existing) { existing.remove(); }
}

// DELETE 

function openDeleteConfirm(type, id) {
    var label = type.charAt(0).toUpperCase() + type.slice(1);
    var body =
        '<div class="adminModal-deleteConfirm">' +
            '<i class="ti ti-alert-triangle adminModal-deleteIcon"></i>' +
            '<p>Are you sure you want to delete this ' + label + '?<br>This action cannot be undone.</p>' +
        '</div>';
    var footer =
        '<button class="adminModal-deleteBtn" onclick="deleteUser(\'' + type + '\', \'' + id + '\')">Yes, Delete</button>' +
        '<button class="adminModal-cancelBtn" onclick="closeAdminModal()">Cancel</button>';
    openAdminModal('Delete ' + label, body, footer);
}

function deleteUser(type, id) {
    var storeMap = {
        doctor: { store: 'doctors', idField: 'doctorID'},
        nurse: { store: 'nurses', idField: 'nurseID'},
        receptionist: { store: 'receptionists', idField: 'receptionistID' },
        patient: { store: 'patients',idField: 'patientID' },
        guardian: { store: 'guardians', idField: 'guardianID'}
    };
    var storeInfo = storeMap[type];
    if (!storeInfo) return;

    deleteRecord(storeInfo.store, id, function() {
        // Also remove the login account from the users store
        getAllRecords('users', function(allUsers) {
            var userRecord = allUsers.find(function(u) { return u[storeInfo.idField] === id; });
            if (userRecord) {
                deleteRecord('users', userRecord.username, function() {});
            }
        });

        // Remove from the in-memory cache and re-render only the affected table
        if (type === 'doctor') {
            _doctors = _doctors.filter(function(d) { return d.doctorID !== id; });
            loadDoctorsTable(_doctors, _patients);
            loadStats(_patients, _doctors, _appointments);
        } else if (type === 'nurse') {
            _nurses = _nurses.filter(function(n) { return n.nurseID !== id; });
            loadNursesTable(_nurses);
        } else if (type === 'receptionist') {
            _receptionists = _receptionists.filter(function(r) { return r.receptionistID !== id; });
            loadReceptionistsTable(_receptionists);
        } else if (type === 'patient') {
            _patients = _patients.filter(function(p) { return p.patientID !== id; });
            loadPatientsTable(_patients, _doctors);
            loadStats(_patients, _doctors, _appointments);
        } else if (type === 'guardian') {
            _guardians = _guardians.filter(function(g) { return g.guardianID !== id; });
            loadGuardiansTable(_guardians, _patients);
        }

        closeAdminModal();
    });
}

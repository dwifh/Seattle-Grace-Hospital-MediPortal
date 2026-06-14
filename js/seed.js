//seed.js fills IndexedDB with starter data. It fetches JSON files and generates login accounts.
//Passwords are encrypted with AES-256-GCM via encryptField() in crypto.js before being stored.
//NHS numbers for patients are also encrypted before storage.

//This function opens DB first and checks if data has been seeded. If not, it fetches and stores data.
function seedDatabase() {
    //Open DB from db.js.
    openDatabase(function() {
        //It will check if data has been seeded already.
        getAllRecords("patients", function(existingPatients) {
            if (existingPatients.length > 0) {
                console.log("Database already seeded. Skipping phase...");
                return;
            }

            //If not, it will fetch data from JSON files and store them in IndexedDB.
            seedPatients();
            seedDoctors();
            seedMedicines();
            seedAdmins();
            seedNurses();
            seedReceptionists();
            seedGuardians();
            seedNotifications();
            seedAppointments();
        });
    });
}

//This will be used to generate usernames for everyone.
function makeUsername(firstName, lastName) {
    //Shared formula for all roles: firstname.lastname in lowercase, letters only.
    return firstName.toLowerCase().replace(/[^a-z]/g, "")
        + "."
        + lastName.toLowerCase().replace(/[^a-z]/g, "");
}


//----PATIENTS SECTION----
function seedPatients() {
    fetch("data/patients.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(patients) {
            if (!Array.isArray(patients)) { console.log("patients.json — expected an array."); return; }

            for (var i = 0; i < patients.length; i++) {
                var p = patients[i];

                if (!p.patientID || !p.firstName || !p.lastName || !p.nhsNumber) {
                    console.log("Skipping patient at index " + i + " — missing required field.");
                    continue;
                }

                // ENCRYPTION FUNCTION - This part of seed.js for all sections within this file is made by Ayush
                // The base function is the same throughout, the username is their firstname.lastname; the password is a mixture of the role + a number derived from a unique number
                //Derive nhsLast4 before encrypting, then encrypt nhsNumber and password.
                (function(patient) {
                    var nhsDigits = patient.nhsNumber.replace(/\s/g, "");
                    var nhsLast4 = nhsDigits.slice(-4);
                    var username = makeUsername(patient.firstName, patient.lastName) + nhsLast4;
                    var password = "Patient" + nhsLast4;

                    // Once the username and password is derived, the password and unique number are encrypted.
                    encryptField(patient.nhsNumber).then(function(encNhs) {
                        patient.nhsNumber = encNhs;
                        return encryptField(password);
                    }).then(function(encPass) {
                        putRecord("patients", patient);
                        putRecord("users", {
                            username: username,
                            password: encPass,
                            role: "patient",
                            patientID: patient.patientID
                        });
                    });
                })(p);
            }

            console.log("Seeded " + patients.length + " patients and their login accounts.");
        })
        .catch(function(error) {
            console.log("Could not seed patients: " + error);
        });
}

//----DOCTORS SECTION----
function seedDoctors() {
    fetch("data/doctors.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(doctors) {
            if (!Array.isArray(doctors)) { console.log("doctors.json — expected an array."); return; }

            for (var i = 0; i < doctors.length; i++) {
                var d = doctors[i];

                if (!d.doctorID || !d.firstName || !d.lastName || !d.gmcNumber) {
                    console.log("Skipping doctor at index " + i + " — missing required field.");
                    continue;
                }
 
                (function(doctor) {
                    var gmcLast4 = doctor.gmcNumber.slice(-4);
                    var username = makeUsername(doctor.firstName, doctor.lastName);
                    var password = "Doctor" + gmcLast4;

                    encryptField(doctor.gmcNumber).then(function(encGmc) {
                        doctor.gmcNumber = encGmc;
                        return encryptField(password);
                    }).then(function(encPass) {
                        putRecord("doctors", doctor);
                        putRecord("users", {
                            username: username,
                            password: encPass,
                            role: "doctor",
                            doctorID: doctor.doctorID
                        });
                    });
                })(d);
            }

            console.log("Seeded " + doctors.length + " doctor(s) and their login accounts.");
        })
        .catch(function(error) {
            console.log("Could not seed doctors: " + error);
        });
}

//----NURSES SECTION----
function seedNurses() {
    fetch("data/nurses.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(nurses) {
            if (!Array.isArray(nurses)) { console.log("nurses.json — expected an array."); return; }

            for (var i = 0; i < nurses.length; i++) {
                var n = nurses[i];

                if (!n.nurseID || !n.firstName || !n.lastName || !n.nmcNumber) {
                    console.log("Skipping nurse at index " + i + " — missing required field.");
                    continue;
                }
 
                (function(nurse) {
                    var nmcLast4 = nurse.nmcNumber.slice(-4);
                    var username = makeUsername(nurse.firstName, nurse.lastName);
                    var password = "Nurse" + nmcLast4;

                    putRecord("nurses", nurse);
                    encryptField(password).then(function(encPass) {
                        putRecord("users", {
                            username: username,
                            password: encPass,
                            role: "nurse",
                            nurseID: nurse.nurseID
                        });
                    });
                })(n);
            }

            console.log("Seeded " + nurses.length + " nurse(s) and their login accounts.");
        })
        .catch(function(error) {
            console.log("Could not seed nurses: " + error);
        });
}

//----RECEPTIONISTS SECTION----
function seedReceptionists() {
    fetch("data/receptionists.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(receptionists) {
            if (!Array.isArray(receptionists)) { console.log("receptionists.json — expected an array."); return; }

            for (var i = 0; i < receptionists.length; i++) {
                var r = receptionists[i];

                if (!r.receptionistID || !r.firstName || !r.lastName) {
                    console.log("Skipping receptionist at index " + i + " — missing required field.");
                    continue;
                }
 
                (function(receptionist, index) {
                    var username = makeUsername(receptionist.firstName, receptionist.lastName);
                    var idNum = String(index + 1).padStart(3, "0");
                    var password = "Reception" + idNum;

                    putRecord("receptionists", receptionist);
                    encryptField(password).then(function(encPass) {
                        putRecord("users", {
                            username: username,
                            password: encPass,
                            role: "receptionist",
                            receptionistID: receptionist.receptionistID
                        });
                    });
                })(r, i);
            }

            console.log("Seeded " + receptionists.length + " receptionist(s) and their login accounts.");
        })
        .catch(function(error) {
            console.log("Could not seed receptionists: " + error);
        });
}

//----GUARDIANS SECTION----
function seedGuardians() {
    fetch("data/guardians.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(guardians) {
            if (!Array.isArray(guardians)) { console.log("guardians.json — expected an array."); return; }

            for (var i = 0; i < guardians.length; i++) {
                var g = guardians[i];

                if (!g.guardianID || !g.firstName || !g.lastName) {
                    console.log("Skipping guardian at index " + i + " — missing required field.");
                    continue;
                }
 
                (function(guardian) {
                    var idNum = guardian.guardianID.replace(/[^0-9]/g, "");
                    var username = makeUsername(guardian.firstName, guardian.lastName);
                    var password = "Guardian" + idNum;

                    putRecord("guardians", guardian);
                    encryptField(password).then(function(encPass) {
                        putRecord("users", {
                            username: username,
                            password: encPass,
                            role: "guardian",
                            guardianID: guardian.guardianID
                        });
                    });
                })(g);
            }

            console.log("Seeded " + guardians.length + " guardian(s) and their login accounts.");
        })
        .catch(function(error) {
            console.log("Could not seed guardians: " + error);
        });
}

//----ADMINS SECTION----
function seedAdmins() {
    fetch("data/admins.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(admins) {
            if (!Array.isArray(admins)) { console.log("admins.json — expected an array."); return; }

            for (var i = 0; i < admins.length; i++) {
                var a = admins[i];

                if (!a.adminID || !a.firstName || !a.lastName) {
                    console.log("Skipping admin at index " + i + " — missing required field.");
                    continue;
                }
 
                (function(admin) {
                    var idNum = admin.adminID.replace(/[^0-9]/g, "");
                    var username = makeUsername(admin.firstName, admin.lastName);
                    var password = "Admin" + idNum;

                    putRecord("admins", admin);
                    encryptField(password).then(function(encPass) {
                        putRecord("users", {
                            username: username,
                            password: encPass,
                            role: "admin",
                            adminID:  admin.adminID
                        });
                    });
                })(a);
            }

            console.log("Seeded " + admins.length + " admin(s) and their login accounts.");
        })
        .catch(function(error) {
            console.log("Could not seed admins: " + error);
        });
}

//----MEDICINES SECTION----
//Medicines have no login accounts so no encryption needed here.
function seedMedicines() {
    fetch("data/medicines.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(medicines) {
            for (var i = 0; i < medicines.length; i++) {
                putRecord("medicines", medicines[i]);
            }
            console.log("Seeded " + medicines.length + " medicine(s).");
        })
        .catch(function(error) {
            console.log("Could not seed medicines: " + error);
        });
}

//----NOTIFICATIONS SECTION----
//Notifications have no passwords so no encryption needed here.
function seedNotifications() {
    fetch("data/notifications.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(notifications) {
            if (!Array.isArray(notifications)) { console.log("notifications.json — expected an array."); return; }

            for (var i = 0; i < notifications.length; i++) {
                var n = notifications[i];

                if (!n.notificationID || !n.recipientID) {
                    console.log("Skipping notification at index " + i + " — missing required field.");
                    continue;
                }

                putRecord("notifications", n);
            }

            console.log("Seeded " + notifications.length + " notification(s).");
        })
        .catch(function(error) {
            console.log("Could not seed notifications: " + error);
        });
}

//----APPOINTMENTS SECTION----
//Appointments have no passwords so the encryption and decrytion functions arent needed here.
function seedAppointments() {
    fetch("data/appointments.json")
        .then(function(response) {
            if (!response.ok) { throw new Error("HTTP " + response.status); }
            return response.json();
        })
        .then(function(appointments) {
            if (!Array.isArray(appointments)) { console.log("appointments.json — expected an array."); return; }

            for (var i = 0; i < appointments.length; i++) {
                var a = appointments[i];

                if (!a.appointmentID || !a.patientID || !a.doctorID) {
                    console.log("Skipping appointment at index " + i + " — missing required field.");
                    continue;
                }

                putRecord("appointments", a);
            }

            console.log("Seeded " + appointments.length + " appointment(s).");
        })
        .catch(function(error) {
            console.log("Could not seed appointments: " + error);
        });
}
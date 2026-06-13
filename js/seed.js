//seed.js fills IndexedDB with starter data. It fetches JSON files and stores them.
//Passwords are now encrypted using encryptField() from crypto.js before being stored.
//This means every login account in the users store has an encrypted password object instead of a plaintext string.

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

                //Store the patient profile record as-is. Profile fields like name are not encrypted here because they are needed for display.
                //Sensitive field encryption (NHS, DOB, address) is handled in patient.js.
                putRecord("patients", p);

                //Build login credentials.
                var nhsDigits = p.nhsNumber.replace(/\s/g, "");
                var nhsLast4  = nhsDigits.slice(-4);
                var username  = makeUsername(p.firstName, p.lastName) + nhsLast4;
                var password  = "Patient" + nhsLast4;

                //We use a closure here to capture the correct username, password and patientID for this loop iteration. 
                //Without the closure, the loop would finish before encryption completes.
                (function(uname, pwd, pid) {
                    //encryptField returns a Promise, so putRecord goes inside .then()
                    //and only runs once the encrypted password is ready.
                    encryptField(pwd).then(function(encryptedPassword) {
                        putRecord("users", {
                            username:  uname,
                            password:  encryptedPassword,
                            role:      "patient",
                            patientID: pid
                        });
                    });
                })(username, password, p.patientID);
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

                putRecord("doctors", d);

                //Build login: firstname.lastname   password: "Doctor" + last 4 of GMC number.
                var gmcLast4 = d.gmcNumber.slice(-4);
                var username = makeUsername(d.firstName, d.lastName);
                var password = "Doctor" + gmcLast4;

                (function(uname, pwd, did) {
                    encryptField(pwd).then(function(encryptedPassword) {
                        putRecord("users", {
                            username: uname,
                            password: encryptedPassword,
                            role:     "doctor",
                            doctorID: did
                        });
                    });
                })(username, password, d.doctorID);
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

                putRecord("nurses", n);

                //Build login: firstname.lastname   password: "Nurse" + last 4 of NMC number.
                var nmcLast4 = n.nmcNumber.slice(-4);
                var username = makeUsername(n.firstName, n.lastName);
                var password = "Nurse" + nmcLast4;

                (function(uname, pwd, nid) {
                    encryptField(pwd).then(function(encryptedPassword) {
                        putRecord("users", {
                            username: uname,
                            password: encryptedPassword,
                            role:     "nurse",
                            nurseID:  nid
                        });
                    });
                })(username, password, n.nurseID);
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

                putRecord("receptionists", r);

                //Build login: firstname.lastname   password: "Reception" + numeric part of receptionistID.
                var idNum    = r.receptionistID.replace(/[^0-9]/g, "");
                var username = makeUsername(r.firstName, r.lastName);
                var password = "Reception" + idNum;

                (function(uname, pwd, rid) {
                    encryptField(pwd).then(function(encryptedPassword) {
                        putRecord("users", {
                            username:       uname,
                            password:       encryptedPassword,
                            role:           "receptionist",
                            receptionistID: rid
                        });
                    });
                })(username, password, r.receptionistID);
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

                putRecord("guardians", g);

                //Build login: firstname.lastname   password: "Guardian" + numeric part of guardianID.
                var idNum    = g.guardianID.replace(/[^0-9]/g, "");
                var username = makeUsername(g.firstName, g.lastName);
                var password = "Guardian" + idNum;

                (function(uname, pwd, gid) {
                    encryptField(pwd).then(function(encryptedPassword) {
                        putRecord("users", {
                            username:   uname,
                            password:   encryptedPassword,
                            role:       "guardian",
                            guardianID: gid
                        });
                    });
                })(username, password, g.guardianID);
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

                putRecord("admins", a);

                //Build login: firstname.lastname   password: "Admin" + numeric part of adminID.
                var idNum    = a.adminID.replace(/[^0-9]/g, "");
                var username = makeUsername(a.firstName, a.lastName);
                var password = "Admin" + idNum;

                (function(uname, pwd, aid) {
                    encryptField(pwd).then(function(encryptedPassword) {
                        putRecord("users", {
                            username: uname,
                            password: encryptedPassword,
                            role:     "admin",
                            adminID:  aid
                        });
                    });
                })(username, password, a.adminID);
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
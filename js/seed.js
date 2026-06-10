//seed.js fills IndexedDB with starter data. It fetches JSON files. It also generates login accounts.
//NOTE: the passwords are plaintext in the file. This is exactly the data that Ayush's crypto.js will encrypt before storing in a later phase.

//This function opens DB first and checks if data has been seeded. If not, it fetches and stores data.
function seedDatabase() {
    //Open DB from db.js.
    openDatabase(function() {
        //It will check if data has been seeded.
        getAllRecords("patients", function(existingPatients) {
            if (existingPatients.length > 0) {
                console.log("Database already seeded. Skipping phase...");
                return;
            }

            //If not, it will fetch data from JSON files and store them in IndexedDB.
            seedPeople();
            seedMedicines();
            seedAdmins();
        });
    });
}

//----PEOPLE SECTION----
//This function fetches data from people.json.
function seedPeople() {
    //fetch asks for the file. It returns a promise, .then() to wait for response, another .then() to turn response into JSON.
    fetch("data/people.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(people) {

            //Loop through every person in JSON file.
            for (var i = 0; i < people.length; i++) {
                var person = people[i];
                if (!person.First || !person.Last || !person.NHS) {
                    console.log("Skipping person id " + person.id + " — missing required field.");
                    continue;    // ← jumps to the next person, doesn't crash
            }
                //Now, create username for login accounts. It will be first letter of firstName + lastName in lowercase. NOTE: id is used so that people of the same name won't clash.
                var firstInitial = person.First.charAt(0).toLowerCase();
                var lastName = person.Last.toLowerCase();
                var nhsLast4 = person.NHS.slice(-4);
                var username = firstInitial + lastName + nhsLast4;
                //Now, create password for login accounts. It will be "password" + id.
                var password = "password" + nhsLast4;

                //DOCTOR RECORDS
                if (person.Title === "Dr") {
                    var doctorID = "d" + person.id;
                    var doctor = {
                        doctorID: doctorID,
                        title: person.Title,
                        firstName: person.First,
                        lastName: person.Last,
                        gender: person.Gender,
                        email: person.Email,
                        telephone: person.Telephone,
                        //The people data has no specialty. For simplicity, we will assign "General Practice" to all doctors.
                        specialty: "General Practice"
                    };
                    putRecord("doctors", doctor);

                    //Create the doctor's login account.
                    putRecord("users", {
                        username: username,
                        password: password,
                        role: "doctor",
                        doctorID: doctorID
                    });

                } else {
                    //PATIENT RECORDS
                    var patientID = "p" + person.id;
                    var patient = {
                        patientID: patientID,
                        title: person.Title,
                        firstName: person.First,
                        lastName: person.Last,
                        nhsNumber: person.NHS,
                        dob: person.DOB,     
                        gender: person.Gender,
                        address: person.Address,
                        email: person.Email,
                        telephone: person.Telephone,
                        //Clinical extras.
                        bloodGroup: "Unknown",
                        allergies: [],
                        registeredDoctorID: ""
                    };
                    putRecord("patients", patient);
 
                    //Create the patient's login account.
                    putRecord("users", {
                        username: username,
                        password: password,
                        role: "patient",
                        patientID: patientID
                    });
                }
            }
            
            console.log("People data seeded successfully.");
        })
        .catch(function(error) {
            //catch runs when fetch fails + gives error details for debugging.
            console.log("Could not fetch people.json: " + error);
        });
}

//----MEDICINES SECTION----
function seedMedicines() {
    fetch("data/medicines.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(medicines) {
            for (var i = 0; i < medicines.length; i++) {
                var med = medicines[i];
                var medicine = {
                    medicineID: "m" + med.id,
                    name: med.Drug
                };
                putRecord("medicines", medicine);
            }
            console.log("Medicines seeded.");
        })
        .catch(function(error) {
            console.log("Could not fetch medicines.json: " + error);
        });
}
 

//---ADMIN SECTION----
function seedAdmins() {
    fetch("data/admin.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(admins) {
            for (var i = 0; i < admins.length; i++) {
                var admin = admins[i];
                if (!admin.username) {
                console.log("Skipping admin record at index " + i + " — missing username.");
                continue;
                }
                putRecord("users", {
                    username: admin.username,
                    password: admin.password,
                    role: "admin"
                });
            }
            console.log("Admins seeded.");
        })
        .catch(function(error) {
            console.log("Could not fetch admin.json: " + error);
        });
}
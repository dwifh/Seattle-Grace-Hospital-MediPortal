//Name of database
//version number means if structure of DB changes, the browser runs so that we can create or change object stores.
var DB_NAME = "MedicalPortalDB";
var DB_VERSION = 1;
//global variable to hold the database connection.
var db = null;

//This function opens DB and creates object sores if they don't exist yet.
//callback function is called once database is ready.
function openDatabase(callback) {
 
    //indexedDB will ask the browser to open the database.
    //request will tell us whether our DB is ready or not.
    var request = indexedDB.open(DB_NAME, DB_VERSION);
 
    //onupgradeneeded runs when DB is first created or when version number goes up.
    request.onupgradeneeded = function(event) {

        //event.target.result is the DB we are building.
        var thisDb = event.target.result;
 
        //createStore makes one object store if it doesn't exist already, for e.g (patients)
        createStore(thisDb, "patients", "patientID");
        createStore(thisDb, "doctors", "doctorID");
        createStore(thisDb, "admins", "adminID");
        createStore(thisDb, "nurses", "nurseID");
        createStore(thisDb, "guardians", "guardianID");
        createStore(thisDb, "receptionists", "receptionistID");
        createStore(thisDb, "medicines", "medicineID");
        createStore(thisDb, "booking_requests", "requestID");
        createStore(thisDb, "users", "username");         
        createStore(thisDb, "appointments", "appointmentID");
        createStore(thisDb, "prescriptions", "prescriptionID");
        createStore(thisDb, "medicalHistory", "historyID");
        createStore(thisDb, "notifications", "notificationID");
        createStore(thisDb, "vitals", "vitalID");
    };
 
    //onsuccess runs when DB opens correctly.
    //We save the DB object to the global variable and call the callback if there is one.
    request.onsuccess = function(event) {
        db = event.target.result;
        //Only call the callback if one was actually given.
        if (callback) {
            callback(db);
        }
    };
 
    //onerror runs if something went wrong opening the database.
    request.onerror = function(event) {
        console.log("Database failed to open: " + event.target.error);
    };
}
 
 
//This function will create an object store, including storeName(patients) and keyName(patientID).
function createStore(thisDb, storeName, keyName) {
    //objectStoresNames. contain checks if the object store already exists.
    if (!thisDb.objectStoreNames.contains(storeName)) {
        thisDb.createObjectStore(storeName, { keyPath: keyName });
    }
}

 
//putRecord ADDS or UPDATES records and doesn't overwrite any existing ones.
function putRecord(storeName, record, callback) {
    var transaction = db.transaction(storeName, "readwrite");
    var store = transaction.objectStore(storeName);
    var request = store.put(record);
 
    request.onsuccess = function() {
        if (callback) { callback(true); }
    };
    request.onerror = function(event) {
        console.log("Could not save record: " + event.target.error);
        if (callback) { callback(false); }
    };
}
 

//getRecord fetches one record of its significant key and the result will come through the callback.
function getRecord(storeName, key, callback) {
    var transaction = db.transaction(storeName, "readonly");
    var store = transaction.objectStore(storeName);
    var request = store.get(key);
 
    request.onsuccess = function(event) {
        //event.target.result is the record found, or undefined if none.
        callback(event.target.result);
    };
    request.onerror = function(event) {
        console.log("Could not get record: " + event.target.error);
        callback(null);
    };
}
 
 
//getAllRecords will fetch all records and return them as an array through callback.
//It will more useful in dropdowns for doctor dashboard.
function getAllRecords(storeName, callback) {
    var transaction = db.transaction(storeName, "readonly");
    var store = transaction.objectStore(storeName);
    var request = store.getAll();
 
    request.onsuccess = function(event) {
        //event.target.result is an array of all the records.
        callback(event.target.result);
    };
    request.onerror = function(event) {
        console.log("Could not get records: " + event.target.error);
        callback([]);
    };
}
 
 
//deleteRecord will remove one record by its significant key zand return true or false through callback.
function deleteRecord(storeName, key, callback) {
    var transaction = db.transaction(storeName, "readwrite");
    var store = transaction.objectStore(storeName);
    var request = store.delete(key);
 
    request.onsuccess = function() {
        if (callback) { callback(true); }
    };
    request.onerror = function(event) {
        console.log("Could not delete record: " + event.target.error);
        if (callback) { callback(false); }
    };
}
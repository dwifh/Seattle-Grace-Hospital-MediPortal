//Name of database
//version number means if structure of DB changes, the browser runs so that we can create or change object stores.
var DB_NAME = "MedicalPortalDB";
//Bumped to 2: adds the prescription_requests store (rxRequestID) for patient prescription requests.
var DB_VERSION = 2;
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
        createStore(thisDb, "prescription_requests", "rxRequestID");
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
    if (!db || !db.objectStoreNames.contains(storeName)) {
        console.log("putRecord: store '" + storeName + "' not found — skipping write.");
        if (callback) { callback(false); }
        return;
    }
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
    if (!db || !db.objectStoreNames.contains(storeName)) {
        console.log("getRecord: store '" + storeName + "' not found — returning null.");
        callback(null);
        return;
    }
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
    //Guard: if the store doesn't exist in this DB version (e.g. DB hasn't been upgraded
    //yet in this session), return an empty array instead of throwing a DOMException.
    if (!db || !db.objectStoreNames.contains(storeName)) {
        console.log("getAllRecords: store '" + storeName + "' not found — returning [].");
        callback([]);
        return;
    }

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
    if (!db || !db.objectStoreNames.contains(storeName)) {
        console.log("deleteRecord: store '" + storeName + "' not found — skipping.");
        if (callback) { callback(false); }
        return;
    }
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
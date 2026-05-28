//dummy data for testing purposes

//USERS SECTION
const USERS = [
  {
    username: "patient.login",
    password: "Patient123!",
    role: "patient",
    patientID: "p001",
  },

  {
    username: "doctor.login",
    password: "Doctor123!",
    role: "doctor",
    doctorID: "d001",
  },

  {
    username: "admin.login",
    password: "Admin123!",
    role: "admin",
    adminID: "a001",
  },

  {
    username: "reception.login",
    password: "Reception123!",
    role: "receptionist",
    receptionistID: "r001",
  },

  {
    username: "guardian.login",
    password: "Guardian123!",
    role: "guardian",
    guardianID: "g001",
  },

  {
    username: "nurse.login",
    password: "Nurse123!",
    role: "nurse",
    nurseID: "n001"
}

];

//PATIENT SECTION
const PATIENTS = [
 {
    patientID: "p001",                          
    firstName: "Aanya",
    lastName: "Sharma",
    age: 30,
    nhsNumber: "485 777 3456",            
    dob: "1996-03-14",                    
    gender: "female",
    address: "12 Elm Road, Seattle, NW3 4QP",
    telephone: "07700 900123",
    email: "aanya.sharma@example.com",         
    registeredDoctorID: "d001",           
    bloodGroup: "O+",
    allergies: ["peanuts"],            
    guardianID: null                      
  },

 {
    patientID: "p002",
    firstName: "Marcus",
    lastName: "Bennett",
    age: 60,
    nhsNumber: "612 901 8842",
    dob: "1966-11-02",
    gender: "male",
    address: "47 Birch Lane, Seattle, M14 5SE",
    telephone: "07700 900456",
    email: "marcus.bennett@example.com",
    registeredDoctorID: "d002",
    bloodGroup: "A-",
    allergies: [],                       
    guardianID: null
},

  {
    patientID: "p003",
    firstName: "Liam",
    lastName: "O'Connor",
    age: 10,
    nhsNumber: "703 224 5519",
    dob: "2016-06-22",                  
    gender: "male",
    address: "8 Maple Close, Seattle, BS8 2QR",
    telephone: "07700 900789",
    email: "liam.guardian@example.com",
    registeredDoctorID: "d003",
    bloodGroup: "B+",
    allergies: ["nuts", "shellfish"],
    guardianID: "g001"                    //Since he's a child, he has a guardian linked by ID
 },

  {
    patientID: "p004",
    firstName: "Sofia",
    lastName: "Rossi",
    age: 20,
    nhsNumber: "891 445 6677",
    dob: "2004-09-30",
    gender: "female",
    address: "23 Oak Avenue, Seattle, EH3 7LP",
    telephone: "07700 900222",
    email: "sofia.rossi@example.com",
    registeredDoctorID: "d002",
    bloodGroup: "AB+",
    allergies: ["latex"],
    guardianID: null
  }
];


//DOCTOR SECTION
const DOCTORS = [
{
    doctorID: "d001",
    firstName: "Priya",
    lastName: "Patel",
    title: "Dr",
    gmcNumber: "GMC7421988",
    specialty: "General Practice",        
    email: "priya.patel@mediportal.us",
  },

 {
    doctorID: "d002",
    firstName: "James",
    lastName: "Whitfield",
    title: "Dr",
    gmcNumber: "GMC8993211",
    specialty: "General Practice",
    email: "james.whitfield@mediportal.us",
  },

  {
    doctorID: "d003",
    firstName: "Aisha",
    lastName: "Khan",
    title: "Dr",
    gmcNumber: "GMC6112847",
    specialty: "Paediatrics",              //child specialist for Liam
    email: "aisha.khan@mediportal.us",
  }
];

//NURSE SECTION
const NURSES = [
  {
    nurseID: "n001",
    firstName: "Karen",
    lastName: "Smith",
    title: "Nurse",
    nmcNumber: "NMC1234567",
    email: "karen.smith@mediportal.us",
    registeredPatient: ["p001"],
    canCheckVitals: true,                    
  },

  {
    nurseID: "n002",
    firstName: "David",
    lastName: "Johnson",
    title: "Nurse",
    nmcNumber: "NMC7654321",
    email: "david.johnson@mediportal.us",
    registeredPatient: ["p003"],
    canCheckVitals: true,
  },

  {
    nurseID: "n003",
    firstName: "Emily",
    lastName: "Clark",
    title: "Nurse",
    nmcNumber: "NMC2468101",
    email: "emily.clark@mediportal.us",
    registeredPatient: ["p004", "p002"],
    canCheckVitals: true,
  },
]

//ADMIN SECTION 
const ADMIN = [
 {
    adminID: "a001",
    firstName: "Helen",
    lastName: "Morgan",
    role: "Practice Manager",
    email: "helen.morgan@mediportal.us",
 }
];

//GUARDIAN SECTION 
const GUARDIAN = [
  {
    guardianID: "g001",
    firstName: "Sinead",
    lastName: "O'Connor",
    relationship: "son",               
    linkedPatientID: "p003",               
    email: "sinead.guardian@example.com",
    telephone: "07700 900345",
    consentGranted: true,                  
    consentDate: "2026-01-15"
  }
];


// MEDICINES SECTION 
const MEDICINES = [
  {
    medicineID: "m001",
    name: "Amoxicillin",
    form: "capsule",                       
    strength: "500mg",
    category: "antibiotic",
    commonSideEffects: ["nausea", "rash"]
  },

  {
    medicineID: "m002",
    name: "Ibuprofen",
    form: "tablet",
    strength: "400mg",
    category: "painkiller",
    commonSideEffects: ["upset stomach", "dizziness"]
  },

  {
    medicineID: "m003",
    name: "Salbutamol Inhaler",
    form: "inhaler",
    strength: "100mcg/puff",
    category: "respiratory",
    commonSideEffects: ["tremor", "headache"]
  },

  {
    medicineID: "m004",
    name: "Paracetamol",
    form: "tablet",
    strength: "500mg",
    category: "painkiller",
    commonSideEffects: []
  },

  {
    medicineID: "m005",
    name: "Loratadine",
    form: "tablet",
    strength: "10mg",
    category: "antihistamine",
    commonSideEffects: ["drowsiness"]
  }
];

//RECEPTIONISTS SECTION
const RECEPTIONISTS = [
  {
    receptionistID: "r001",
    firstName: "Chloe",
    lastName: "Davies",
    email: "chloe.davies@mediportal.us",
    deskNumber: "Reception 1",
    canCancelAppointments: true,         
  },

  {
    receptionistID: "r002",
    firstName: "Omar",
    lastName: "Hussain",
    email: "omar.hussain@mediportal.us",
    deskNumber: "Reception 2",
    canCancelAppointments: true,
  }
];
 
 
//APPOINTMENTS SECTION
const APPOINTMENTS = [
  {
    appointmentID: "ap001",
    patientID: "p001",               //Aanya's routine check-up appointment      
    doctorID: "d001",                //with Dr. Priya Patel, her registered GP
    date: "2026-06-04",
    time: "09:30",
    reason: "Routine check-up",
    status: "booked",                     
    notes: "",                            
    bookedBy: "r001",                 //Booked by receptionist Chloe Davies
    checkInStatus: "pending"               //check in status is pending until the patient arrives and checks in at the reception. Once they check in, the status can be updated to "checked_in". If they do not show up for the appointment, the status can be updated to "no_show".
  },

  {
    appointmentID: "ap002",
    patientID: "p001",                 //Aanya's follow-up appointment for her throat infection, after being treated with amoxicillin. This appointment is marked as completed, and the doctor has filled in the notes with the diagnosis and treatment plan.
    doctorID: "d001",                  //with Dr. Priya Patel, her registered GP   
    date: "2026-05-12",
    time: "14:00",
    reason: "Sore throat, persistent cough",
    status: "completed",                   
    notes: "Mild throat infection. Prescribed amoxicillin 500mg, 7 days. Follow up if not improved.",
    bookedBy: "r002",                       //Booked by receptionist Omar Hussain
    checkInStatus: "checked_in"            
  },

  {
    appointmentID: "ap003",
    patientID: "p002",                   //Marcus's appointment to review his elevated blood pressure, which was noted during a routine check. This appointment is still booked and pending check-in.
    doctorID: "d002",                   //with Dr. James Whitfield, his registered GP
    date: "2026-06-10",
    time: "11:00",
    reason: "Blood pressure review",
    status: "booked",
    notes: "",
    bookedBy: "r001",
    checkInStatus: "pending"
  },

  {
    appointmentID: "ap004",
    patientID: "p003",                     //Liam's appointment for an asthma review
    doctorID: "d003",                     //with Dr. Aisha Khan, his registered pediatrician
    date: "2026-05-25",
    time: "10:15",
    reason: "Asthma review",
    status: "booked",
    notes: "",
    bookedBy: "r002",
    checkInStatus: "pending"
  },

  {
    appointmentID: "ap005",
    patientID: "p004",                    //Sofia's appointment for migraines
    doctorID: "d002",                     //with Dr. James Whitfield, her registered GP 
    date: "2026-04-18",
    time: "15:30",
    reason: "Migraine episodes",
    status: "completed",
    notes: "Discussed triggers. Advised hydration log and OTC pain relief. Review in 4 weeks if no improvement.",
    bookedBy: "r001",
    checkInStatus: "checked_in"
  }
];
 

//PRESCRIPTIONS SECTION 
const PRESCRIPTIONS = [
  {
    prescriptionID: "rx001",
    patientID: "p001",
    doctorID: "d001",
    medicineID: "m001",                    //Amoxicillin —  Aanya's throat infection
    dosage: "1 capsule",
    frequency: "3 times daily, after meals",
    durationDays: 7,
    dateIssued: "2026-05-12",
    instructions: "Complete the full course even if you feel better.",
    status: "active"                      //status means the prescription is currently active and being taken by the patient. Once the course is completed, the status can be updated to "completed". If the patient requests a repeat of the prescription, the status can be updated to "repeat_requested" until the doctor approves it.
  },

  {
    prescriptionID: "rx002",
    patientID: "p002",
    doctorID: "d002",
    medicineID: "m004",                    //Paracetamol - Marcus's elevated blood pressure headaches
    dosage: "1 tablet",
    frequency: "every 8 hours when needed",
    durationDays: 30,
    dateIssued: "2026-04-08",
    instructions: "Take with water. Do not exceed 4 tablets in 24 hours.",
    status: "active"
  },

  {
    prescriptionID: "rx003",
    patientID: "p003",
    doctorID: "d003",
    medicineID: "m003",                    //Salbutamol — Liam's asthma inhaler
    dosage: "1-2 puffs",
    frequency: "as needed for shortness of breath",
    durationDays: 90,
    dateIssued: "2026-04-02",
    instructions: "Carry inhaler at all times. Tell school nurse.",
    status: "active"
  },

  {
    prescriptionID: "rx004",
    patientID: "p004",
    doctorID: "d002",
    medicineID: "m002",                    //Ibuprofen - Sofia's migraines
    dosage: "1 tablet",
    frequency: "every 6 hours when needed",
    durationDays: 30,
    dateIssued: "2026-04-18",
    instructions: "Take with food. Do not exceed 4 tablets in 24 hours.",
    status: "active"
  }
];


//MEDICAL HISTORY SECTION 
const MEDICAL_HISTORY = [
  {
    historyID: "h001",
    patientID: "p001",                  //Aanya's flu vaccination record from 2023, which is a routine seasonal vaccination. 
    date: "2023-09-15",
    type: "vaccination",                  
    title: "Flu vaccine",
    description: "Seasonal influenza vaccination, no adverse reaction.",
    recordedBy: "d001"                  //Recorded by Dr. Priya Patel, her registered GP
  },

  {
    historyID: "h002",
    patientID: "p001",
    date: "2024-08-08",                  //Aanya's full blood count test result from 2024, which was done as part of her routine check-up. 
    type: "test_result",
    title: "Full blood count",
    description: "All values within normal range.",
    recordedBy: "d001"                  //Recorded by Dr. Priya Patel, her registered GP
  },

  {
    historyID: "h003",
    patientID: "p001",
    date: "2026-05-12",
    type: "diagnosis",
    title: "Throat infection",
    description: "Mild bacterial infection. Treated with amoxicillin.",
    recordedBy: "d001"                  //Recorded by Dr. Priya Patel, her registered GP
  },

  {
    historyID: "h004",
    patientID: "p003",
    date: "2022-05-28",                 //Liam's asthma diagnosis from 2022, which was made after he had a spirometry test that showed reduced lung function. 
    title: "Asthma diagnosis",
    type: "diagnosis",
    description: "Diagnosed with mild persistent asthma after spirometry.",
    recordedBy: "d003"                  //Recorded by Dr. Aisha Khan, his registered pediatrician
  },

  {
    historyID: "h005",
    patientID: "p003",                  //Liam's MMR booster vaccination record from 2024, which is a routine childhood vaccination.
    date: "2024-09-01",
    type: "vaccination",
    title: "MMR booster",
    description: "Routine childhood MMR booster, no adverse reaction.",
    recordedBy: "d003"                  //Recorded by Dr. Aisha Khan, his registered pediatrician
  },

  {
    historyID: "h006",
    patientID: "p002",                   //Marcus's elevated blood pressure test result from 2025, which was noted during a routine check. 
    date: "2025-11-08",
    type: "test_result",
    title: "Blood pressure check",
    description: "BP 138/86 — slightly elevated, lifestyle advice given.",
    recordedBy: "d002"                  //Recorded by Dr. James Whitfield, his registered GP
  },

  {
    historyID: "h007",
    patientID: "p004",                   //Sofia's migraine diagnosis from 2024, which was made after she had several episodes of severe headaches
    date: "2024-07-22",
    type: "diagnosis",
    title: "Migraine without aura",
    description: "Recurring episodes, triggers identified as stress and skipped meals.",
    recordedBy: "d002"                  //Recorded by Dr. James Whitfield, her registered GP
  }
];


//VITALS SECTION - Nurses can access it.
const VITALS = [
  {
    vitalID: "v001",
    patientID: "p001",    
    registeredNurseID: "n001",   
    heightCm: 165,
    weightKg: 62,
    bloodPressure: "118/76",
    heartRate: 72,
    lastUpdated: "2026-02-20"
  },

  {
    vitalID: "v002",
    patientID: "p002",  
    registeredNurseID: "n003",   
    heightCm: 180,
    weightKg: 88,
    bloodPressure: "138/86",
    heartRate: 78,
    lastUpdated: "2025-11-08"
  },

  {
    vitalID: "v003",
    patientID: "p003",
    registeredNurseID: "n002",
    heightCm: 142,
    weightKg: 36,
    bloodPressure: "100/65",
    heartRate: 90,
    lastUpdated: "2025-04-01"
  },

  {
    vitalID: "v004",
    patientID: "p004",
    registeredNurseID: "n003",
    heightCm: 168,
    weightKg: 64,
    bloodPressure: "120/78",
    heartRate: 70,
    lastUpdated: "2026-05-20"
  }
];
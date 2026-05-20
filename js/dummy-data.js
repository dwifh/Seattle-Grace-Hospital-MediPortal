// ============================================================
// dummy-data.js — OWNED BY TIANA
// Hardcoded data for Phase 1 (before IndexedDB is wired up)
// ============================================================

// ----------------------------------------------------------
// USER CREDENTIALS
// Used by auth.js to validate login and determine role.
// ----------------------------------------------------------
const USERS = [
    { username: "ayush.admin",  password: "Admin123",   role: "admin" },
    { username: "dr.carter",    password: "Doctor123",  role: "doctor" },
    { username: "nurse.jane",   password: "Nurse123",   role: "nurse" },
    { username: "reception1",   password: "Recep123",   role: "receptionist" },
    { username: "p.sarah",      password: "Patient123", role: "patient" },
    { username: "guardian1",    password: "Guard123",   role: "guardian" }
];

// ----------------------------------------------------------
// PATIENTS
// ----------------------------------------------------------
const PATIENTS = [
    { id: "PT-001", name: "Sarah Thompson",  dob: "1985-03-12", nhs: "943 476 5193", address: "14 Maple St, London",    phone: "07700 900123", blood: "O+",  allergies: "Penicillin",  doctor: "dr.carter" },
    { id: "PT-002", name: "Marcus Williams", dob: "1990-07-24", nhs: "812 334 7821", address: "32 Oak Ave, Manchester", phone: "07700 900456", blood: "A+",  allergies: "None",        doctor: "dr.carter" },
    { id: "PT-003", name: "Aisha Johnson",   dob: "1978-11-05", nhs: "567 221 9034", address: "8 Birch Rd, Birmingham", phone: "07700 900789", blood: "B-",  allergies: "Aspirin",     doctor: "dr.carter" },
    { id: "PT-004", name: "Tom Bradley",     dob: "2000-01-18", nhs: "334 889 2210", address: "21 Pine Ln, Leeds",      phone: "07700 901012", blood: "AB+", allergies: "None",        doctor: "dr.carter" },
    { id: "PT-005", name: "Nina Patel",      dob: "1995-06-30", nhs: "721 556 4478", address: "5 Elm St, Bristol",      phone: "07700 901345", blood: "O-",  allergies: "Latex",       doctor: "dr.carter" }
];

// ----------------------------------------------------------
// DOCTORS
// ----------------------------------------------------------
const DOCTORS = [
    { id: "DR-001", username: "dr.carter", name: "Dr. James Carter",  specialty: "Cardiology" },
    { id: "DR-002", username: "dr.patel",  name: "Dr. Priya Patel",   specialty: "Neurology" },
    { id: "DR-003", username: "dr.reeves", name: "Dr. Sam Reeves",    specialty: "General" }
];

// ----------------------------------------------------------
// APPOINTMENTS
// ----------------------------------------------------------
const APPOINTMENTS = [
    { id: "AP-001", patientId: "PT-001", doctorId: "DR-001", date: "2026-05-20", time: "09:00", reason: "Annual checkup",      status: "confirmed" },
    { id: "AP-002", patientId: "PT-002", doctorId: "DR-002", date: "2026-05-21", time: "10:30", reason: "Cardiology follow-up", status: "pending" },
    { id: "AP-003", patientId: "PT-003", doctorId: "DR-003", date: "2026-05-21", time: "11:00", reason: "Lab result review",    status: "confirmed" },
    { id: "AP-004", patientId: "PT-004", doctorId: "DR-001", date: "2026-05-22", time: "14:00", reason: "Post-op check",        status: "cancelled" },
    { id: "AP-005", patientId: "PT-005", doctorId: "DR-003", date: "2026-05-22", time: "15:30", reason: "Neurology consult",    status: "pending" }
];

// ----------------------------------------------------------
// PRESCRIPTIONS
// ----------------------------------------------------------
const PRESCRIPTIONS = [
    { id: "RX-001", patientId: "PT-001", doctorId: "DR-001", drug: "Amoxicillin", dosage: "500mg", instructions: "3x daily with food", dispensed: false },
    { id: "RX-002", patientId: "PT-002", doctorId: "DR-002", drug: "Lisinopril",  dosage: "10mg",  instructions: "1x daily morning",    dispensed: true  }
];

// ----------------------------------------------------------
// VITALS (for Nurse panel)
// ----------------------------------------------------------
const VITALS = [
    { id: "VT-001", patientId: "PT-001", timestamp: "2026-05-20T09:00", bp: "120/80", temp: "36.8", pulse: 72, weight: 68 },
    { id: "VT-002", patientId: "PT-002", timestamp: "2026-05-20T10:00", bp: "135/88", temp: "37.1", pulse: 80, weight: 85 }
];
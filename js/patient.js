//Variables to hold patient state in different sections of the dashboard.
const patientState = {
    patientId: null,
    historyFilter: "all",
    selectedDoctor: null,
    selectedDate: null
};

//Function to initialize patient dashboard by fetching necessary data and populating the UI
document.addEventListener("DOMContentLoaded", () => {
    const dashboard = document.getElementById("dashboard-patient");
    if (!dashboard) return;

    //call function to load patient details and populate dashboard
    initPatientDashboard();
});

function initPatientDashboard() {
    //auth.js stores patient login in sessionStorage which is safer than localStorage for sensitive data.
    const storedID = sessionStorage.getItem("patientId");

    if (storedId && PATIENTS.some(p => p.patientID === storedId)) {
        patientState.patientId
    }

}
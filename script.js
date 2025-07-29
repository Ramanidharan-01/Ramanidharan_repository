// Medical Assistant App - Main JavaScript File

// Application State
let appState = {
    currentSection: 'dashboard',
    medications: [],
    appointments: [],
    healthHistory: [],
    symptoms: [],
    userProfile: {},
    selectedSymptoms: []
};

// Load data from localStorage on app start
function loadAppData() {
    const savedData = localStorage.getItem('mediCareAssistant');
    if (savedData) {
        appState = { ...appState, ...JSON.parse(savedData) };
    }
    updateDashboard();
    renderMedications();
    renderAppointments();
    renderHealthHistory();
}

// Save data to localStorage
function saveAppData() {
    localStorage.setItem('mediCareAssistant', JSON.stringify(appState));
}

// Navigation Functions
function navigateToSection(sectionId) {
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    appState.currentSection = sectionId;
    saveAppData();
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', function() {
    // Navigation button event listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });
    
    // Load saved data
    loadAppData();
    
    // Set up form submissions
    setupFormSubmissions();
    
    // Initialize notification system
    checkMedicationReminders();
    setInterval(checkMedicationReminders, 60000); // Check every minute
});

// Dashboard Functions
function updateDashboard() {
    updateHealthScore();
    renderRecentActivity();
}

function updateHealthScore() {
    // Calculate health score based on various factors
    let score = 85; // Base score
    
    // Adjust based on recent vital signs
    if (appState.healthHistory.length > 0) {
        const latestVitals = appState.healthHistory[appState.healthHistory.length - 1];
        if (latestVitals.type === 'vitals') {
            // Adjust score based on vital signs (simplified algorithm)
            score = Math.max(60, Math.min(100, score + Math.random() * 10 - 5));
        }
    }
    
    // Adjust based on medication compliance
    const medicationCompliance = calculateMedicationCompliance();
    score = Math.max(0, Math.min(100, score + (medicationCompliance - 80) * 0.2));
    
    document.getElementById('healthScore').textContent = Math.round(score);
    appState.userProfile.healthScore = score;
    saveAppData();
}

function calculateMedicationCompliance() {
    // Simplified medication compliance calculation
    if (appState.medications.length === 0) return 100;
    
    const takenToday = appState.medications.filter(med => 
        med.lastTaken && isToday(new Date(med.lastTaken))
    ).length;
    
    return (takenToday / appState.medications.length) * 100;
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function renderRecentActivity() {
    const activityList = document.getElementById('activityList');
    let activities = [];
    
    // Add recent medication activities
    appState.medications.forEach(med => {
        if (med.lastTaken) {
            activities.push({
                icon: 'fas fa-pills',
                text: `Took ${med.name}`,
                time: getTimeAgo(new Date(med.lastTaken))
            });
        }
    });
    
    // Add recent health records
    appState.healthHistory.slice(-3).forEach(record => {
        activities.push({
            icon: getActivityIcon(record.type),
            text: getActivityText(record),
            time: getTimeAgo(new Date(record.date))
        });
    });
    
    // Sort by most recent
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (activities.length === 0) {
        activities = [{
            icon: 'fas fa-info-circle',
            text: 'No recent activity',
            time: 'Start using the app to see your activity'
        }];
    }
    
    activityList.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <i class="${activity.icon} activity-icon"></i>
            <div class="activity-content">
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        vitals: 'fas fa-heartbeat',
        bmi: 'fas fa-weight',
        symptoms: 'fas fa-stethoscope',
        appointment: 'fas fa-calendar-alt'
    };
    return icons[type] || 'fas fa-circle';
}

function getActivityText(record) {
    switch (record.type) {
        case 'vitals':
            return 'Recorded vital signs';
        case 'bmi':
            return `BMI calculated: ${record.value}`;
        case 'symptoms':
            return 'Symptom analysis completed';
        case 'appointment':
            return `Appointment with ${record.doctor}`;
        default:
            return 'Health record updated';
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Symptom Checker Functions
function addSymptomCategory(symptom) {
    const btn = event.target.closest('.category-btn');
    
    if (appState.selectedSymptoms.includes(symptom)) {
        // Remove symptom
        appState.selectedSymptoms = appState.selectedSymptoms.filter(s => s !== symptom);
        btn.classList.remove('selected');
    } else {
        // Add symptom
        appState.selectedSymptoms.push(symptom);
        btn.classList.add('selected');
    }
    
    // Update the textarea
    const textarea = document.getElementById('symptomDescription');
    const currentText = textarea.value;
    const symptomText = symptom.charAt(0).toUpperCase() + symptom.slice(1);
    
    if (!currentText.toLowerCase().includes(symptom.toLowerCase())) {
        textarea.value = currentText ? `${currentText}, ${symptomText}` : symptomText;
    }
}

function analyzeSymptoms() {
    const description = document.getElementById('symptomDescription').value.trim();
    
    if (!description && appState.selectedSymptoms.length === 0) {
        showAlert('Please describe your symptoms or select from the categories.', 'warning');
        return;
    }
    
    // Show loading
    const resultsCard = document.getElementById('symptomResults');
    resultsCard.style.display = 'block';
    resultsCard.querySelector('#symptomAnalysis').innerHTML = '<div class="loading-spinner"></div>';
    
    // Simulate analysis delay
    setTimeout(() => {
        const analysis = performSymptomAnalysis(description, appState.selectedSymptoms);
        displaySymptomAnalysis(analysis);
        
        // Save to history
        appState.healthHistory.push({
            type: 'symptoms',
            date: new Date().toISOString(),
            description: description,
            selectedSymptoms: [...appState.selectedSymptoms],
            analysis: analysis
        });
        
        saveAppData();
        renderRecentActivity();
    }, 2000);
}

function performSymptomAnalysis(description, symptoms) {
    // This is a simplified symptom analysis for demonstration
    // In a real app, this would connect to a medical API or database
    
    const commonConditions = {
        'headache': {
            name: 'Headache',
            severity: 'mild',
            recommendations: ['Stay hydrated', 'Rest in a quiet, dark room', 'Consider over-the-counter pain relief'],
            whenToSeeDoctor: 'If headache persists for more than 2 days or is severe'
        },
        'fever': {
            name: 'Fever',
            severity: 'moderate',
            recommendations: ['Rest and stay hydrated', 'Monitor temperature regularly', 'Take fever reducers as needed'],
            whenToSeeDoctor: 'If fever exceeds 103°F (39.4°C) or persists for more than 3 days'
        },
        'cough': {
            name: 'Cough',
            severity: 'mild',
            recommendations: ['Stay hydrated', 'Use honey or throat lozenges', 'Avoid irritants'],
            whenToSeeDoctor: 'If cough persists for more than 2 weeks or produces blood'
        },
        'fatigue': {
            name: 'Fatigue',
            severity: 'mild',
            recommendations: ['Ensure adequate sleep', 'Maintain regular exercise', 'Eat a balanced diet'],
            whenToSeeDoctor: 'If fatigue persists for more than 2 weeks despite adequate rest'
        },
        'nausea': {
            name: 'Nausea',
            severity: 'mild',
            recommendations: ['Eat small, frequent meals', 'Stay hydrated', 'Avoid strong odors'],
            whenToSeeDoctor: 'If accompanied by severe abdominal pain or persistent vomiting'
        },
        'pain': {
            name: 'Body Pain',
            severity: 'moderate',
            recommendations: ['Rest the affected area', 'Apply ice or heat as appropriate', 'Consider over-the-counter pain relief'],
            whenToSeeDoctor: 'If pain is severe, persistent, or interferes with daily activities'
        }
    };
    
    // Find matching conditions
    const matchedConditions = [];
    symptoms.forEach(symptom => {
        if (commonConditions[symptom]) {
            matchedConditions.push(commonConditions[symptom]);
        }
    });
    
    // If no specific symptoms selected, provide general advice
    if (matchedConditions.length === 0) {
        return {
            conditions: [{
                name: 'General Symptoms',
                severity: 'unknown',
                recommendations: ['Monitor symptoms closely', 'Rest and stay hydrated', 'Maintain good hygiene'],
                whenToSeeDoctor: 'If symptoms worsen or persist'
            }],
            generalAdvice: 'Based on your description, please monitor your symptoms carefully. If you experience worsening symptoms or are concerned, consult with a healthcare professional.',
            urgency: 'low'
        };
    }
    
    // Determine overall urgency
    const severities = matchedConditions.map(c => c.severity);
    let urgency = 'low';
    if (severities.includes('severe')) urgency = 'high';
    else if (severities.includes('moderate')) urgency = 'medium';
    
    return {
        conditions: matchedConditions,
        generalAdvice: 'This is a preliminary assessment based on common symptoms. Always consult with a healthcare professional for accurate diagnosis and treatment.',
        urgency: urgency
    };
}

function displaySymptomAnalysis(analysis) {
    const analysisDiv = document.getElementById('symptomAnalysis');
    
    const urgencyColors = {
        low: 'success',
        medium: 'warning',
        high: 'error'
    };
    
    const urgencyTexts = {
        low: 'Low Priority',
        medium: 'Moderate Priority',
        high: 'High Priority - Seek Medical Attention'
    };
    
    analysisDiv.innerHTML = `
        <div class="alert alert-${urgencyColors[analysis.urgency]}">
            <strong>Assessment Priority: ${urgencyTexts[analysis.urgency]}</strong>
        </div>
        
        <div class="analysis-results">
            ${analysis.conditions.map(condition => `
                <div class="condition-card">
                    <h4>${condition.name}</h4>
                    <div class="recommendations">
                        <h5>Recommendations:</h5>
                        <ul>
                            ${condition.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="doctor-advice">
                        <h5>When to see a doctor:</h5>
                        <p>${condition.whenToSeeDoctor}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="general-advice">
            <h4>Important Note:</h4>
            <p>${analysis.generalAdvice}</p>
        </div>
        
        <div class="action-buttons">
            <button class="primary-btn" onclick="scheduleAppointment()">
                <i class="fas fa-calendar-plus"></i>
                Schedule Doctor Appointment
            </button>
        </div>
    `;
}

// BMI Calculator Functions
function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    
    if (!height || !weight || height <= 0 || weight <= 0) {
        showAlert('Please enter valid height and weight values.', 'warning');
        return;
    }
    
    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Determine category
    let category, advice, categoryClass;
    if (bmi < 18.5) {
        category = 'Underweight';
        categoryClass = 'underweight';
        advice = 'Consider consulting with a healthcare provider about healthy weight gain strategies.';
    } else if (bmi < 25) {
        category = 'Normal weight';
        categoryClass = 'normal';
        advice = 'Maintain your current healthy lifestyle with balanced diet and regular exercise.';
    } else if (bmi < 30) {
        category = 'Overweight';
        categoryClass = 'overweight';
        advice = 'Consider adopting a healthier diet and increasing physical activity.';
    } else {
        category = 'Obese';
        categoryClass = 'obese';
        advice = 'Consult with a healthcare provider for a comprehensive weight management plan.';
    }
    
    // Display results
    const resultDiv = document.getElementById('bmiResult');
    document.getElementById('bmiValue').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = category;
    document.getElementById('bmiCategory').className = `bmi-category ${categoryClass}`;
    document.getElementById('bmiAdvice').textContent = advice;
    
    resultDiv.style.display = 'block';
    
    // Save to history
    appState.healthHistory.push({
        type: 'bmi',
        date: new Date().toISOString(),
        value: bmi.toFixed(1),
        category: category,
        height: height,
        weight: weight
    });
    
    saveAppData();
    renderRecentActivity();
    updateHealthScore();
}

// Vital Signs Functions
function recordVitals() {
    const bloodPressure = document.getElementById('bloodPressure').value.trim();
    const heartRate = parseFloat(document.getElementById('heartRate').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const oxygenSat = parseFloat(document.getElementById('oxygenSat').value);
    
    if (!bloodPressure && !heartRate && !temperature && !oxygenSat) {
        showAlert('Please enter at least one vital sign measurement.', 'warning');
        return;
    }
    
    const vitals = {
        type: 'vitals',
        date: new Date().toISOString(),
        bloodPressure: bloodPressure || null,
        heartRate: heartRate || null,
        temperature: temperature || null,
        oxygenSaturation: oxygenSat || null
    };
    
    appState.healthHistory.push(vitals);
    saveAppData();
    renderHealthHistory();
    renderRecentActivity();
    updateHealthScore();
    
    // Clear form
    document.getElementById('bloodPressure').value = '';
    document.getElementById('heartRate').value = '';
    document.getElementById('temperature').value = '';
    document.getElementById('oxygenSat').value = '';
    
    showAlert('Vital signs recorded successfully!', 'success');
}

function renderHealthHistory() {
    const historyDiv = document.getElementById('healthHistory');
    const recentHistory = appState.healthHistory.slice(-10).reverse();
    
    if (recentHistory.length === 0) {
        historyDiv.innerHTML = '<p class="text-center">No health records yet. Start tracking your health metrics!</p>';
        return;
    }
    
    historyDiv.innerHTML = recentHistory.map(record => `
        <div class="history-item">
            <div class="history-header">
                <span class="history-type">${getHistoryTypeLabel(record.type)}</span>
                <span class="history-date">${formatDate(record.date)}</span>
            </div>
            <div class="history-content">
                ${formatHistoryContent(record)}
            </div>
        </div>
    `).join('');
}

function getHistoryTypeLabel(type) {
    const labels = {
        vitals: 'Vital Signs',
        bmi: 'BMI Calculation',
        symptoms: 'Symptom Check',
        appointment: 'Appointment'
    };
    return labels[type] || 'Health Record';
}

function formatHistoryContent(record) {
    switch (record.type) {
        case 'vitals':
            const vitals = [];
            if (record.bloodPressure) vitals.push(`BP: ${record.bloodPressure}`);
            if (record.heartRate) vitals.push(`HR: ${record.heartRate} bpm`);
            if (record.temperature) vitals.push(`Temp: ${record.temperature}°F`);
            if (record.oxygenSaturation) vitals.push(`O2: ${record.oxygenSaturation}%`);
            return vitals.join(', ');
        case 'bmi':
            return `BMI: ${record.value} (${record.category})`;
        case 'symptoms':
            return `Symptoms: ${record.description || record.selectedSymptoms.join(', ')}`;
        default:
            return 'Health record updated';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Medication Management Functions
function addMedication() {
    // If called from dashboard, navigate to medications section first
    if (appState.currentSection !== 'medications') {
        navigateToSection('medications');
        return;
    }
    
    const name = document.getElementById('medicationName').value.trim();
    const dosage = document.getElementById('dosage').value.trim();
    const frequency = document.getElementById('frequency').value;
    const time = document.getElementById('medicationTime').value;
    const notes = document.getElementById('notes').value.trim();
    
    if (!name || !dosage) {
        showAlert('Please enter medication name and dosage.', 'warning');
        return;
    }
    
    const medication = {
        id: Date.now(),
        name: name,
        dosage: dosage,
        frequency: frequency,
        time: time,
        notes: notes,
        created: new Date().toISOString(),
        lastTaken: null,
        reminderEnabled: true
    };
    
    appState.medications.push(medication);
    saveAppData();
    renderMedications();
    
    // Clear form
    document.getElementById('medicationName').value = '';
    document.getElementById('dosage').value = '';
    document.getElementById('frequency').value = 'once';
    document.getElementById('medicationTime').value = '';
    document.getElementById('notes').value = '';
    
    showAlert('Medication added successfully!', 'success');
}

function renderMedications() {
    const medicationsDiv = document.getElementById('medicationsList');
    
    if (appState.medications.length === 0) {
        medicationsDiv.innerHTML = '<p class="text-center">No medications added yet. Add your first medication above!</p>';
        return;
    }
    
    medicationsDiv.innerHTML = appState.medications.map(med => `
        <div class="medication-item">
            <div class="medication-header">
                <span class="medication-name">${med.name}</span>
                <span class="medication-dosage">${med.dosage}</span>
            </div>
            <div class="medication-schedule">
                ${getFrequencyText(med.frequency)} ${med.time ? `at ${med.time}` : ''}
            </div>
            ${med.notes ? `<div class="medication-notes">${med.notes}</div>` : ''}
            <div class="medication-actions">
                <button class="action-btn-small btn-take" onclick="takeMedication(${med.id})">
                    <i class="fas fa-check"></i> Take Now
                </button>
                <button class="action-btn-small btn-edit" onclick="editMedication(${med.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn-small btn-delete" onclick="deleteMedication(${med.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            ${med.lastTaken ? `<div class="last-taken">Last taken: ${getTimeAgo(new Date(med.lastTaken))}</div>` : ''}
        </div>
    `).join('');
}

function getFrequencyText(frequency) {
    const frequencies = {
        once: 'Once daily',
        twice: 'Twice daily',
        thrice: 'Three times daily',
        custom: 'Custom schedule'
    };
    return frequencies[frequency] || frequency;
}

function takeMedication(medicationId) {
    const medication = appState.medications.find(med => med.id === medicationId);
    if (medication) {
        medication.lastTaken = new Date().toISOString();
        saveAppData();
        renderMedications();
        renderRecentActivity();
        updateHealthScore();
        showAlert(`Marked "${medication.name}" as taken!`, 'success');
    }
}

function editMedication(medicationId) {
    const medication = appState.medications.find(med => med.id === medicationId);
    if (medication) {
        // Pre-fill the form with medication data
        document.getElementById('medicationName').value = medication.name;
        document.getElementById('dosage').value = medication.dosage;
        document.getElementById('frequency').value = medication.frequency;
        document.getElementById('medicationTime').value = medication.time;
        document.getElementById('notes').value = medication.notes || '';
        
        // Remove the existing medication
        deleteMedication(medicationId, false);
        
        showAlert('Medication loaded for editing. Update the fields and click "Add Medication".', 'info');
    }
}

function deleteMedication(medicationId, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this medication?')) {
        return;
    }
    
    appState.medications = appState.medications.filter(med => med.id !== medicationId);
    saveAppData();
    renderMedications();
    
    if (confirm) {
        showAlert('Medication deleted successfully!', 'success');
    }
}

function checkMedicationReminders() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    appState.medications.forEach(med => {
        if (med.reminderEnabled && med.time) {
            const medTime = med.time.split(':');
            const medMinutes = parseInt(medTime[0]) * 60 + parseInt(medTime[1]);
            
            // Check if it's time for medication (within 5 minutes)
            if (Math.abs(currentTime - medMinutes) <= 5) {
                // Check if already taken today
                const lastTaken = med.lastTaken ? new Date(med.lastTaken) : null;
                if (!lastTaken || !isToday(lastTaken)) {
                    showMedicationReminder(med);
                }
            }
        }
    });
}

function showMedicationReminder(medication) {
    showModal(`
        <div class="reminder-modal">
            <h3><i class="fas fa-pills"></i> Medication Reminder</h3>
            <p>It's time to take your medication:</p>
            <div class="medication-reminder-info">
                <strong>${medication.name}</strong><br>
                <span>Dosage: ${medication.dosage}</span>
            </div>
            <div class="reminder-actions">
                <button class="primary-btn" onclick="takeMedication(${medication.id}); closeModal();">
                    <i class="fas fa-check"></i> Mark as Taken
                </button>
                <button class="action-btn-small btn-edit" onclick="closeModal();">
                    <i class="fas fa-clock"></i> Remind Later
                </button>
            </div>
        </div>
    `);
}

// Appointment Management Functions
function scheduleAppointment() {
    // If called from dashboard or symptoms, navigate to appointments section first
    if (appState.currentSection !== 'appointments') {
        navigateToSection('appointments');
        return;
    }
    
    const doctorName = document.getElementById('doctorName').value.trim();
    const appointmentType = document.getElementById('appointmentType').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    const appointmentNotes = document.getElementById('appointmentNotes').value.trim();
    
    if (!doctorName || !appointmentDate || !appointmentTime) {
        showAlert('Please fill in all required appointment details.', 'warning');
        return;
    }
    
    // Check if appointment date is in the past
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime < new Date()) {
        showAlert('Appointment date and time cannot be in the past.', 'warning');
        return;
    }
    
    const appointment = {
        id: Date.now(),
        doctorName: doctorName,
        type: appointmentType,
        date: appointmentDate,
        time: appointmentTime,
        notes: appointmentNotes,
        created: new Date().toISOString(),
        status: 'scheduled'
    };
    
    appState.appointments.push(appointment);
    saveAppData();
    renderAppointments();
    
    // Clear form
    document.getElementById('doctorName').value = '';
    document.getElementById('appointmentType').value = 'checkup';
    document.getElementById('appointmentDate').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('appointmentNotes').value = '';
    
    showAlert('Appointment scheduled successfully!', 'success');
}

function renderAppointments() {
    const appointmentsDiv = document.getElementById('appointmentsList');
    
    // Sort appointments by date and time
    const sortedAppointments = appState.appointments
        .filter(apt => apt.status !== 'cancelled')
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    
    if (sortedAppointments.length === 0) {
        appointmentsDiv.innerHTML = '<p class="text-center">No upcoming appointments. Schedule your first appointment above!</p>';
        return;
    }
    
    appointmentsDiv.innerHTML = sortedAppointments.map(apt => {
        const appointmentDate = new Date(`${apt.date}T${apt.time}`);
        const isUpcoming = appointmentDate > new Date();
        
        return `
            <div class="appointment-item ${!isUpcoming ? 'past-appointment' : ''}">
                <div class="appointment-header">
                    <span class="appointment-title">${apt.doctorName}</span>
                    <span class="appointment-time">${formatDate(apt.date + 'T' + apt.time)}</span>
                </div>
                <div class="appointment-details">
                    <strong>Type:</strong> ${getAppointmentTypeLabel(apt.type)}
                    ${apt.notes ? `<br><strong>Notes:</strong> ${apt.notes}` : ''}
                </div>
                <div class="appointment-actions">
                    ${isUpcoming ? `
                        <button class="action-btn-small btn-edit" onclick="editAppointment(${apt.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn-small btn-delete" onclick="cancelAppointment(${apt.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : `
                        <span class="past-label">Past Appointment</span>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function getAppointmentTypeLabel(type) {
    const types = {
        checkup: 'Regular Checkup',
        consultation: 'Consultation',
        followup: 'Follow-up',
        emergency: 'Emergency',
        specialist: 'Specialist Visit'
    };
    return types[type] || type;
}

function editAppointment(appointmentId) {
    const appointment = appState.appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        document.getElementById('doctorName').value = appointment.doctorName;
        document.getElementById('appointmentType').value = appointment.type;
        document.getElementById('appointmentDate').value = appointment.date;
        document.getElementById('appointmentTime').value = appointment.time;
        document.getElementById('appointmentNotes').value = appointment.notes || '';
        
        cancelAppointment(appointmentId, false);
        showAlert('Appointment loaded for editing. Update the fields and click "Schedule Appointment".', 'info');
    }
}

function cancelAppointment(appointmentId, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    const appointment = appState.appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        appointment.status = 'cancelled';
        saveAppData();
        renderAppointments();
        
        if (confirm) {
            showAlert('Appointment cancelled successfully!', 'success');
        }
    }
}

// Utility Functions
function setupFormSubmissions() {
    // Prevent default form submissions and handle with JavaScript
    document.addEventListener('submit', function(e) {
        e.preventDefault();
    });
    
    // Set minimum date for appointment scheduling to today
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i>
        ${message}
    `;
    
    // Insert at the top of the current section
    const currentSection = document.querySelector('.section.active');
    if (currentSection) {
        const sectionHeader = currentSection.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.insertAdjacentElement('afterend', alert);
        } else {
            currentSection.insertBefore(alert, currentSection.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showModal(content) {
    const modal = document.getElementById('notificationModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = content;
    modal.style.display = 'block';
    
    // Add click outside to close
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function closeModal() {
    document.getElementById('notificationModal').style.display = 'none';
}

// Export functions for global access
window.navigateToSection = navigateToSection;
window.addSymptomCategory = addSymptomCategory;
window.analyzeSymptoms = analyzeSymptoms;
window.calculateBMI = calculateBMI;
window.recordVitals = recordVitals;
window.addMedication = addMedication;
window.takeMedication = takeMedication;
window.editMedication = editMedication;
window.deleteMedication = deleteMedication;
window.scheduleAppointment = scheduleAppointment;
window.editAppointment = editAppointment;
window.cancelAppointment = cancelAppointment;
window.closeModal = closeModal;
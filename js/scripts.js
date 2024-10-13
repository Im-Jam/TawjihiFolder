
// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// GitHub Repository Information
const githubUsername = 'Im-Jam';
const githubRepo = 'Bank';
const githubBranch = 'main'; // or the branch where your data is stored

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCF1VuNvhbHF5L3qiSjER0s-gQWEiIAPq8",
    authDomain: "tawjihifolder.firebaseapp.com",
    projectId: "tawjihifolder",
    storageBucket: "tawjihifolder.appspot.com",
    messagingSenderId: "963092650429",
    appId: "1:963092650429:web:ce896548cf328b66d2dad4",
    measurementId: "G-487PZPDLJT"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Global Variables
let subjects = [];
let systemsData = {};
let questionsData = {};
let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
let userAnswers = JSON.parse(localStorage.getItem('userAnswers')) || {};

// User's Selection
let selectedSubjects = JSON.parse(localStorage.getItem('selectedSubjects')) || [];
let selectedSystems = JSON.parse(localStorage.getItem('selectedSystems')) || [];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadSubjectsFromGitHub();
    initializeDarkMode();
    initializeAuthState();

    // Restore last page
    const lastPage = localStorage.getItem('currentPage') || 'home-page';
    const lastQuestion = JSON.parse(localStorage.getItem('lastQuestion'));
    selectedSystems = JSON.parse(localStorage.getItem('selectedSystems')) || [];

    if (lastPage === 'questions-list-page' || lastPage === 'question-page') {
        if (selectedSystems && selectedSystems.length > 0) {
            loadQuestionsList(selectedSystems).then(() => {
                if (lastPage === 'question-page' && lastQuestion) {
                    loadQuestion(lastQuestion.questionId, lastQuestion.subject, lastQuestion.system);
                } else {
                    showPage('questions-list-page', false);
                }
            });
        } else {
            showPage('home-page', false);
        }
    } else {
        showPage(lastPage, false);
    }
});

// Initialize Dark Mode
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i> الوضع الفاتح';
    }

    darkModeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i> الوضع الفاتح';
            localStorage.setItem('darkMode', 'enabled');
        } else {
            darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i> الوضع الداكن';
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

// Initialize Firebase Authentication State
function initializeAuthState() {
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    const backupButton = document.getElementById('backupButton');
    const restoreButton = document.getElementById('restoreButton');
    const userMenu = document.getElementById('userMenu');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            backupButton.style.display = 'block';
            restoreButton.style.display = 'block';
            userMenu.textContent = user.displayName || 'حسابي';
        } else {
            // User is signed out
            loginButton.style.display = 'block';
            logoutButton.style.display = 'none';
            backupButton.style.display = 'none';
            restoreButton.style.display = 'none';
            userMenu.textContent = 'حسابي';
        }
    });

    // Login Button Event
    loginButton.addEventListener('click', function(e) {
        e.preventDefault();
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                showToast('تم تسجيل الدخول بنجاح');
            })
            .catch((error) => {
                console.error('Error during sign in:', error);
                showToast('حدث خطأ أثناء تسجيل الدخول');
            });
    });

    // Logout Button Event
    logoutButton.addEventListener('click', function(e) {
        e.preventDefault();
        signOut(auth).then(() => {
            showToast('تم تسجيل الخروج بنجاح');
        }).catch((error) => {
            console.error('Error during sign out:', error);
            showToast('حدث خطأ أثناء تسجيل الخروج');
        });
    });

    // Backup Button Event
    backupButton.addEventListener('click', function(e) {
        e.preventDefault();
        backupData();
    });

    // Restore Button Event
    restoreButton.addEventListener('click', function(e) {
        e.preventDefault();
        restoreData();
    });
}

// Load Subjects from GitHub
function loadSubjectsFromGitHub() {
    const url = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/Data?ref=${githubBranch}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            subjects = data.map(item => item.name);
            loadSubjects();
        })
        .catch(error => {
            console.error('Error fetching subjects:', error);
        });
}

// Load Subjects into the DOM
function loadSubjects() {
    const subjectsContainer = document.getElementById('subjects-container');
    subjectsContainer.innerHTML = '';
    subjects.forEach((subject, index) => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input subject-checkbox" type="checkbox" value="${subject}" id="subject-${index}">
            <label class="form-check-label" for="subject-${index}">
                ${subject}
            </label>
        `;
        subjectsContainer.appendChild(div);
    });
    // Add event listeners
    const subjectCheckboxes = document.querySelectorAll('.subject-checkbox');
    subjectCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedSubjects = getSelectedSubjects();
            localStorage.setItem('selectedSubjects', JSON.stringify(selectedSubjects));
            fetchSystemsFromGitHub(selectedSubjects);
        });
    });
    // Restore previously selected subjects
    if (selectedSubjects.length > 0) {
        subjectCheckboxes.forEach(checkbox => {
            if (selectedSubjects.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
        fetchSystemsFromGitHub(selectedSubjects);
    }
    // Select All Subjects Button
    document.getElementById('select-all-subjects').addEventListener('click', function() {
        const allSelected = Array.from(subjectCheckboxes).every(checkbox => checkbox.checked);
        subjectCheckboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
        });
        selectedSubjects = getSelectedSubjects();
        localStorage.setItem('selectedSubjects', JSON.stringify(selectedSubjects));
        fetchSystemsFromGitHub(selectedSubjects);
    });
}

// Get Selected Subjects
function getSelectedSubjects() {
    const subjectCheckboxes = document.querySelectorAll('.subject-checkbox');
    return Array.from(subjectCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);
}

// Fetch Systems from GitHub
function fetchSystemsFromGitHub(selectedSubjects) {
    const systemsContainer = document.getElementById('systems-container');
    const proceedButton = document.getElementById('proceed-button');
    systemsData = {}; // Reset systems data
    if (selectedSubjects.length === 0) {
        systemsContainer.innerHTML = '<p>حدد مادة واحدة على الأقل أولاً</p>';
        proceedButton.disabled = true;
        localStorage.removeItem('selectedSystems');
        return;
    }
    systemsContainer.innerHTML = '<p>جاري تحميل الوحدات...</p>';
    proceedButton.disabled = true;

    // Fetch systems for each selected subject
    let fetchPromises = selectedSubjects.map(subject => {
        const url = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/Data/${encodeURIComponent(subject)}?ref=${githubBranch}`;
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                systemsData[subject] = data.map(item => item.name);
            });
    });

    Promise.all(fetchPromises)
        .then(() => {
            displaySystems();
        })
        .catch(error => {
            console.error('Error fetching systems:', error);
            systemsContainer.innerHTML = '<p class="text-danger">Error loading systems. Please try again later.</p>';
        });
}

// Display Systems
function displaySystems() {
    const systemsContainer = document.getElementById('systems-container');
    let systemsHTML = '';
    for (const subject in systemsData) {
        systemsData[subject].forEach(system => {
            systemsHTML += `
                <div class="system-item">
                    <label class="system-checkbox-label">
                        <input class="form-check-input system-checkbox" type="checkbox" value="${system}" data-subject="${subject}">
                        <span>${subject} - ${system}</span>
                    </label>
                </div>
            `;
        });
    }
    systemsContainer.innerHTML = systemsHTML;
    // Add event listeners
    const systemCheckboxes = document.querySelectorAll('.system-checkbox');
    systemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            selectedSystems = getSelectedSystems();
            localStorage.setItem('selectedSystems', JSON.stringify(selectedSystems));
            updateProceedButtonState();
        });
    });
    // Restore previously selected systems
    if (selectedSystems.length > 0) {
        systemCheckboxes.forEach(checkbox => {
            if (selectedSystems.some(sel => sel.subject === checkbox.dataset.subject && sel.system === checkbox.value)) {
                checkbox.checked = true;
            }
        });
        updateProceedButtonState();
    }
    // Select All Systems Button
    document.getElementById('select-all-systems').addEventListener('click', function() {
        const allSelected = Array.from(systemCheckboxes).every(checkbox => checkbox.checked);
        systemCheckboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
        });
        selectedSystems = getSelectedSystems();
        localStorage.setItem('selectedSystems', JSON.stringify(selectedSystems));
        updateProceedButtonState();
    });
    updateProceedButtonState();
}

// Update Proceed Button State
function updateProceedButtonState() {
    const proceedButton = document.getElementById('proceed-button');
    proceedButton.disabled = selectedSystems.length === 0;
}

// Get Selected Systems
function getSelectedSystems() {
    const systemCheckboxes = document.querySelectorAll('.system-checkbox');
    return Array.from(systemCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => ({subject: checkbox.dataset.subject, system: checkbox.value}));
}

// Proceed Button Event
document.getElementById('proceed-button').addEventListener('click', function() {
    if (selectedSystems.length === 0) {
        alert('حدد على الأقل وحدة واحدة');
        return;
    }
    loadQuestionsList(selectedSystems);
});

// Load Questions List
function loadQuestionsList(selectedSystems) {
    questionsData = {}; // Reset questions data
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';
    let fetchPromises = [];

    selectedSystems.forEach(({subject, system}) => {
        const url = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/Data/${encodeURIComponent(subject)}/${encodeURIComponent(system)}?ref=${githubBranch}`;
        let systemQuestions = [];
        fetchPromises.push(
            fetch(url)
            .then(response => response.json())
            .then(data => {
                const questionFolders = data.filter(item => item.type === 'dir');
                let questionFetches = questionFolders.map(folder => {
                    const questionUrl = `https://raw.githubusercontent.com/${githubUsername}/${githubRepo}/${githubBranch}/Data/${encodeURIComponent(subject)}/${encodeURIComponent(system)}/${encodeURIComponent(folder.name)}/question.json`;
                    return fetch(questionUrl)
                        .then(response => response.json())
                        .then(questionData => {
                            systemQuestions.push({...questionData, subject_name: subject, system_name: system});
                        });
                });
                return Promise.all(questionFetches);
            })
            .then(() => {
                if (!questionsData[subject]) questionsData[subject] = {};
                questionsData[subject][system] = systemQuestions;
            })
        );
    });

    return Promise.all(fetchPromises)
        .then(() => {
            displayQuestionsList();
            showPage('questions-list-page');
        })
        .catch(error => {
            console.error('Error fetching questions:', error);
            questionsList.innerHTML = '<p class="text-danger">Error loading questions. Please try again later.</p>';
        });
}

// The rest of your JavaScript functions remain largely the same.
// Ensure you are using the modular syntax when interacting with Firebase.


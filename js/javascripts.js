
// GitHub Repository Information
const githubUsername = 'Im-Jam';
const githubRepo = 'Bank';
const githubBranch = 'main'; // or the branch where your data is stored

// Global Variables
let subjects = [];
let systemsData = {};
let questionsData = {};
let bookmarks = []; // Will be loaded from Firestore
let userAnswers = {}; // Will be loaded from Firestore

// User's Selection
let selectedSubjects = [];
let selectedSystems = [];

// Firebase Initialization (Already done in HTML)

// Initialize Application (Modify to load data from Firestore)
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(user => { // Add this block

        if (user) {

            loadUserData(user.uid).then(() => { // Load data after login
                loadSubjectsFromGitHub();
                initializeDarkMode();
                restoreLastPage();

            });

        } else {
            // User is signed out - Proceed as usual (no saved data)
            loadSubjectsFromGitHub();
            initializeDarkMode();
            restoreLastPage();


        }
    });
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
            showToast('حدث خطأ أثناء جلب المواد.');
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
        systemsContainer.innerHTML = '<p>Select one or more subjects to view available systems.</p>';
        proceedButton.disabled = true;
        localStorage.removeItem('selectedSystems');
        return;
    }
    systemsContainer.innerHTML = '<p>جاري تحميل الوحدات</p>';
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
            showToast('حدث خطأ أثناء جلب الوحدات.');
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
        alert('حدد على الاقل وحدة واحدة');
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
            showToast('حدث خطأ أثناء جلب الأسئلة.');
        });
}

// Display Questions List
function displayQuestionsList() {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';
    let questions = [];
    for (const subject in questionsData) {
        for (const system in questionsData[subject]) {
            questionsData[subject][system].forEach(question => {
                questions.push(question);
            });
        }
    }
    if (questions.length === 0) {
        questionsList.innerHTML = '<p>No questions available for the selected systems.</p>';
        return;
    }
    questions.forEach(question => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">Question ${question.question_id}</h5>
                    <p class="card-text">${stripHTML(question.question_text).substring(0, 100)}...</p>
                    <p class="card-text">
                        <strong>المادة</strong> ${question.subject_name}<br>
                        <strong>الوحدة</strong> ${question.system_name}
                    </p>
                    <div class="mt-auto">
                        ${getAnswerBadge(question.question_id)}
                        <button class="btn btn-primary mt-2 w-100" onclick="loadQuestion(${question.question_id}, '${question.subject_name}', '${question.system_name}')">الذهاب الى السؤال</button>
                    </div>
                </div>
            </div>
        `;
        questionsList.appendChild(col);
    });
    // Update Breadcrumb
    const breadcrumb = document.getElementById('questions-breadcrumb');
    breadcrumb.innerHTML = `
        <li class="breadcrumb-item"><a href="#" onclick="showPage('home-page')">Home</a></li>
        <li class="breadcrumb-item active" aria-current="page">Questions List</li>
    `;
    // Filter Event
    document.getElementById('filter').addEventListener('change', function() {
        filterQuestions(questions);
    });
    filterQuestions(questions);
}

// Strip HTML Tags
function stripHTML(html) {
    let div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}

// Get Answer Badge
function getAnswerBadge(questionId) {
    if (userAnswers[questionId]) {
        if (userAnswers[questionId].isCorrect) {
            return '<span class="badge bg-success">اجابتك صحيحة</span>';
        } else {
            return '<span class="badge bg-danger">اجابتك خاطئة</span>';
        }
    } else {
        return '<span class="badge bg-secondary">لا يوجد اجابة</span>';
    }
}

// Load Individual Question
function loadQuestion(questionId, subject, system) {
    const questionData = questionsData[subject][system].find(q => q.question_id == questionId);
    if (!questionData) return;
    document.getElementById('question-title').textContent = `سؤال رقم ${questionId}`;
    document.getElementById('question-text').innerHTML = questionData.question_text;
    // Load Choices
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    for (const [letter, choiceText] of Object.entries(questionData.choices)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-primary choice-btn text-start';
        btn.dataset.choice = letter;
        btn.innerHTML = `<strong>${letter}.</strong> ${choiceText}`;
        btn.addEventListener('click', function() {
            selectChoice(this);
        });
        choicesDiv.appendChild(btn);
    }
    // Update Bookmark Button
    const bookmarkButton = document.getElementById('bookmarkQuestion');
    const isBookmarked = bookmarks.some(b => b.questionId == questionId && b.subject === subject && b.system === system);
    if (isBookmarked) {
        bookmarkButton.textContent = 'الغاء حفظ السؤال';
    } else {
        bookmarkButton.textContent = 'احفظ السؤال';
    }
    // Update Answer Explanation
    const answerExplanation = document.getElementById('answerExplanation');
    answerExplanation.classList.add('hidden');
    document.getElementById('revealAnswer').textContent = 'اظهار الاجابة';
    // Set Event Listeners
    selectedChoice = userAnswers[questionId]?.userAnswer || null;
    updateChoiceButtons();
    document.getElementById('saveAnswer').onclick = function() {
        saveAnswer(questionId, questionData);
    };
    document.getElementById('revealAnswer').onclick = function() {
        revealAnswer(questionData);
    };
    document.getElementById('bookmarkQuestion').onclick = function() {
        toggleBookmark(questionId, subject, system);
    };
    document.getElementById('correct-answer').textContent = `(الاجابة الصحيحة) ${questionData.correct_choice}`;
    document.getElementById('explanation-text').innerHTML = questionData.explanation || 'لا يوجد اجابة';
    // Update Navigation Buttons
    updateNavigationButtons(questionId, subject, system);
    // Update Breadcrumb
    const breadcrumb = document.getElementById('question-breadcrumb');
    breadcrumb.innerHTML = `
        <li class="breadcrumb-item"><a href="#" onclick="showPage('home-page')">الصفحة الرئيسية</a></li>
        <li class="breadcrumb-item"><a href="#" onclick="showPage('questions-list-page')">الاسئلة</a></li>
        <li class="breadcrumb-item active" aria-current="page">سؤال رقم ${questionId}</li>
    `;
    // Save current page and question
    localStorage.setItem('currentPage', 'question-page');
    localStorage.setItem('lastQuestion', JSON.stringify({questionId: questionId, subject: subject, system: system}));
    showPage('question-page');
}

// Update Navigation Buttons
function updateNavigationButtons(questionId, subject, system) {
    const questions = questionsData[subject][system];
    const index = questions.findIndex(q => q.question_id == questionId);

    document.getElementById('previous-question').onclick = function() {
        if (index > 0) {
            const prevQuestion = questions[index - 1];
            loadQuestion(prevQuestion.question_id, subject, system);
        } else {
            showToast('مازلت في السؤال الاول');
        }
    };

    document.getElementById('next-question').onclick = function() {
        if (index < questions.length - 1) {
            const nextQuestion = questions[index + 1];
            loadQuestion(nextQuestion.question_id, subject, system);
        } else {
            showToast('مبارك، هذا السؤال الاخير');
        }
    };
}

// Choice Selection
let selectedChoice = null;
function selectChoice(btn) {
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach(button => {
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
    });
    btn.classList.remove('btn-outline-primary');
    btn.classList.add('btn-primary');
    selectedChoice = btn.dataset.choice;
}

// Update Choice Buttons
function updateChoiceButtons() {
    const choiceButtons = document.querySelectorAll('.choice-btn');
    choiceButtons.forEach(button => {
        if (button.dataset.choice === selectedChoice) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
        } else {
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        }
    });
}

// Save Answer
function saveAnswer(questionId, questionData) {
    if (!selectedChoice) {
        showToast('حدد اجابة واحدة قبل الحفظ');
        return;
    }
    const isCorrect = selectedChoice === questionData.correct_choice;
    userAnswers[questionId] = { userAnswer: selectedChoice, isCorrect };
    // Save to Firestore
    if (auth.currentUser) {  // Check if user is logged in
        firestore.collection('users').doc(auth.currentUser.uid).update({
            answers: userAnswers
        }).catch(error => {
            console.error("Error saving answer:", error);
            showToast("حدث خطأ أثناء حفظ الإجابة.");
        });
    }
    showToast("تم حفظ الاجابة بنجاح.");
}

// Reveal Answer
function revealAnswer(questionData) {
    if (!selectedChoice) {
        showToast('قم بختيار اجابة اولا قبل محاولة عرض الاجالة النموذجية');
        return;
    }
    const answerExplanation = document.getElementById('answerExplanation');
    answerExplanation.classList.toggle('hidden');
    const revealButton = document.getElementById('revealAnswer');
    if (answerExplanation.classList.contains('hidden')) {
        revealButton.textContent = 'اظهار الاجابة';
    } else {
        revealButton.textContent = 'اخفاء الاجابة';
    }
}

// Toggle Bookmark
function toggleBookmark(questionId, subject, system) {
    const bookmarkButton = document.getElementById('bookmarkQuestion');
    const bookmark = { questionId, subject, system };
    const bookmarkIndex = bookmarks.findIndex(b => b.questionId == questionId && b.subject === subject && b.system === system);

    if (bookmarkIndex !== -1) {
        // Remove bookmark
        bookmarks.splice(bookmarkIndex, 1);
        bookmarkButton.textContent = 'احفظ السؤال';
        showToast('تم الغاء حفظ السؤال');
    } else {
        // Add bookmark
        bookmarks.push(bookmark);

        bookmarkButton.textContent = 'الغاء حفظ السؤال';
        showToast('تم حفظ السؤال');
    }

    // Save bookmarks to Firestore
     if (auth.currentUser) {
        firestore.collection('users').doc(auth.currentUser.uid).update({
            bookmarks: bookmarks
        }).catch(error => {
             console.error("Error saving bookmark:", error);
             showToast("حدث خطأ أثناء حفظ الإشارة المرجعية.");


         });

     }

}

// Load Bookmarks
function loadBookmarks() {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '';

    if (bookmarks.length === 0) {
        container.innerHTML = '<p>ليس لديك اي اسئلة محفوظة</p>';
        return;
    }

    const fetchPromises = bookmarks.map(bookmark => {
        const { questionId, subject, system } = bookmark;
        return getQuestionFromData(questionId, subject, system) || fetchQuestionFromGitHub(questionId, subject, system);
    });


    Promise.all(fetchPromises).then(() => {
        let html = '<ul class="list-group">';
        bookmarks.forEach(bookmark => {
            const { questionId, subject, system } = bookmark;
            const question = getQuestionFromData(questionId, subject, system);
            if (question) {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <a href="#" onclick="loadQuestion(${questionId}, '${subject}', '${system}')">سؤال رقم ${questionId} (${subject} - ${system})</a>
                        <button class="btn btn-sm btn-danger" onclick="removeBookmark(${questionId}, '${subject}', '${system}')">
                            ازالة
                        </button>
                    </li>
                `;
            } else {
                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>سؤال رقم ${questionId} (${subject} - ${system}) - Failed to load</span>
                        <button class="btn btn-sm btn-danger" onclick="removeBookmark(${questionId}, '${subject}', '${system}')">
                            ازالة
                        </button>
                    </li>
                `;
            }
        });
        html += '</ul>';
        container.innerHTML = html;
    });
}

// Get Question from Data
function getQuestionFromData(questionId, subject, system) {
    if (questionsData[subject] && questionsData[subject][system]) {
        return questionsData[subject][system].find(q => q.question_id == questionId);
    }
    return null;
}


function fetchQuestionFromGitHub(questionId, subject, system) {

    const questionUrl = `https://raw.githubusercontent.com/${githubUsername}/${githubRepo}/${githubBranch}/Data/${encodeURIComponent(subject)}/${encodeURIComponent(system)}/${encodeURIComponent(questionId)}/question.json`;

    return fetch(questionUrl)
    .then(response => response.json())
    .then(questionData => {
                // Store the question in questionsData
                if (!questionsData[subject]) questionsData[subject] = {};
                if (!questionsData[subject][system]) questionsData[subject][system] = [];
                questionsData[subject][system].push({...questionData, subject_name: subject, system_name: system});
                return questionData;
            })
    .catch(error => {
        console.error('حدث خطأ اثناء استلام الاسئلة المحفوظة', error);
        return null;
    })


}

// Remove Bookmark
function removeBookmark(questionId, subject, system) {
    const bookmarkIndex = bookmarks.findIndex(b => b.questionId == questionId && b.subject === subject && b.system === system);
    if (bookmarkIndex !== -1) {
        bookmarks.splice(bookmarkIndex,1);
        if (auth.currentUser) {
            firestore.collection('users').doc(auth.currentUser.uid).update({
                bookmarks: bookmarks
            }).catch(error => {
                console.error("Error removing bookmark:", error);
                showToast("حدث خطأ أثناء إزالة الإشارة المرجعية.");
            });
        }
        loadBookmarks();
        showToast('تم ازالة السؤال من قائمة الاسئلة المحفوظة');
    }
}

// Show Toast
function showToast(message) {
    const toastBody = document.querySelector('#liveToast .toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('liveToast'));
    toast.show();
}

// Show Page Function
function showPage(pageId, addToHistory=true) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Update active class on navbar
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    if (pageId === 'home-page') {
        navLinks[0].classList.add('active');
    } else if (pageId === 'bookmarks-page') {
        navLinks[1].classList.add('active');
        loadBookmarks();
    }
    if (pageId === 'questions-list-page') {
        displayQuestionsList();
    }
    // Save current page in localStorage
    localStorage.setItem('currentPage', pageId);

    if (addToHistory) {
        history.pushState({pageId: pageId}, '', '');
    }
}

// Handle Back Button Navigation
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.pageId) {
        showPage(event.state.pageId, false);
    } else {
        // Default to home-page or last saved page
        const lastPage = localStorage.getItem('currentPage') || 'home-page';
        showPage(lastPage, false);
    }
});

// Filter Questions
function filterQuestions(allQuestions) {
    const filterType = document.getElementById('filter').value;
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';
    let filteredQuestions = [];
    if (filterType === 'all') {
        filteredQuestions = allQuestions;
    } else if (filterType === 'correct') {
        filteredQuestions = allQuestions.filter(q => userAnswers[q.question_id]?.isCorrect);
    } else if (filterType === 'incorrect') {
        filteredQuestions = allQuestions.filter(q => userAnswers[q.question_id] && !userAnswers[q.question_id].isCorrect);
    } else if (filterType === 'unanswered') {
        filteredQuestions = allQuestions.filter(q => !userAnswers[q.question_id]);
    }
    if (filteredQuestions.length === 0) {
        questionsList.innerHTML = '<p>لا يوجد اسئلة تحت هذه التصفية</p>';
        return;
    }
    filteredQuestions.forEach(question => {
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">سؤال رقم ${question.question_id}</h5>
                    <p class="card-text">${stripHTML(question.question_text).substring(0, 100)}...</p>
                    <p class="card-text">
                        <strong>(المادة)</strong> ${question.subject_name}<br>
                        <strong>(الوحدة)</strong> ${question.system_name}
                    </p>
                    <div class="mt-auto">
                        ${getAnswerBadge(question.question_id)}
                        <button class="btn btn-primary mt-2 w-100" onclick="loadQuestion(${question.question_id}, '${question.subject_name}', '${question.system_name}')">اظهار السؤال</button>
                    </div>
                </div>
            </div>
        `;
        questionsList.appendChild(col);
    });
}

async function loadUserData(userId) {
    try {
        const userDoc = await firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            bookmarks = userData.bookmarks || [];
            userAnswers = userData.answers || {};
        } else {
            // Create a new document for the user if it doesn't exist
            await firestore.collection('users').doc(userId).set({
                bookmarks: [],
                answers: {}
            })
        }

    } catch (error) {
        console.error("Error loading user data:", error);
        showToast('حدث خطأ اثناء تحميل بيانات المستخدم');

    }
}

function restoreLastPage() {
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
}


//Sign-in/Sign-out Logic
const loginButton = document.getElementById('login-button');
const userInfo = document.getElementById('user-info');

auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        userInfo.innerHTML = `<span>${user.displayName}</span><button class="btn btn-outline-danger ms-2" id="sign-out-button">تسجيل الخروج</button>`;
        document.getElementById('sign-out-button').addEventListener('click', () => {
            auth.signOut().then(() => {
                showToast('تم تسجيل الخروج بنجاح');
                location.reload(); //refresh the page after logout
            }).catch(error => {
                console.error("Sign-out error:", error);
                showToast('حدث خطأ أثناء تسجيل الخروج.');
            });
        });
    } else {
        // User is signed out
        userInfo.innerHTML = ''; // Clear user info
        loginButton.style.display = 'block'; // Show login button
    }
});

loginButton.addEventListener('click', () => {
    auth.signInWithPopup(provider).then(result => {
        showToast('تم تسجيل الدخول بنجاح');
    }).catch(error => {
        console.error("Sign-in error:", error);
        showToast('حدث خطأ أثناء تسجيل الدخول');
    });
});

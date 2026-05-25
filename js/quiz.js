// Student Quiz Taking Controller (Light Mode UI)
import { getQuizById, addSubmission } from "./db.js";
import { showLoader, hideLoader, showConfirmModal, toast } from "./ui.js";
import { TELEGRAM_WEBHOOK_URL } from "./config.js";

// Page State Variables
let quiz = null;
let studentName = "";
let studentId = "";
let studentAnswers = []; // Holds selected option index for each question
let timerInterval = null;
let secondsRemaining = 0;
let autoSubmitted = false;

// DOM Elements
const quizRegCard = document.getElementById("quiz-reg-card");
const regQuizTitle = document.getElementById("reg-quiz-title");
const regQuizDescription = document.getElementById("reg-quiz-description");
const regQuizQuestions = document.getElementById("reg-quiz-questions");
const regQuizTimeLimit = document.getElementById("reg-quiz-timelimit");
const studentRegForm = document.getElementById("student-reg-form");

const quizTakingPanel = document.getElementById("quiz-taking-panel");
const takingQuizTitle = document.getElementById("taking-quiz-title");
const takingQuizDescription = document.getElementById("taking-quiz-description");
const takingQuestionsContainer = document.getElementById("taking-questions-container");
const quizSubmitBtn = document.getElementById("quiz-submit-btn");

const headerTimerContainer = document.getElementById("header-timer-container");
const quizTimerDisplay = document.getElementById("quiz-timer");
const progressText = document.getElementById("quiz-progress-text");
const progressBar = document.getElementById("quiz-progress-bar");

const quizErrorCard = document.getElementById("quiz-error-card");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");

/**
 * Initialize quiz taking page
 */
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");

  if (!quizId) {
    showErrorState("Missing Quiz ID", "This quiz URL appears to be incomplete. Please check the link and try again.");
    return;
  }

  try {
    showLoader();
    
    // Fetch Quiz
    quiz = await getQuizById(quizId);
    
    if (!quiz) {
      showErrorState("Quiz Not Found", "The requested quiz could not be located. It might have been deleted or the ID is invalid.");
      return;
    }

    // Initialize answers array with null values
    studentAnswers = new Array(quiz.questions.length).fill(null);

    // Show verification/intro panel
    showRegistrationState();

  } catch (err) {
    console.error("Error initializing quiz takers:", err);
    showErrorState("Error Loading Quiz", "An error occurred while loading this quiz. Please refresh or try again later.");
  } finally {
    hideLoader();
  }
}

/**
 * Render introductory registration card
 */
function showRegistrationState() {
  regQuizTitle.textContent = quiz.title;
  regQuizDescription.textContent = quiz.description || "No description provided.";
  
  const questionCount = quiz.questions ? quiz.questions.length : 0;
  regQuizQuestions.textContent = `${questionCount} ${questionCount === 1 ? 'Question' : 'Questions'}`;
  
  regQuizTimeLimit.textContent = quiz.timeLimit ? `${quiz.timeLimit} Minutes` : "No Time Limit";
  
  quizRegCard.classList.remove("hidden");
  studentRegForm.addEventListener("submit", handleRegistrationSubmit);
}

/**
 * Handle student info form submission
 */
function handleRegistrationSubmit(e) {
  e.preventDefault();
  
  studentName = document.getElementById("student-name").value.trim();
  studentId = document.getElementById("student-id").value.trim() || "";

  if (!studentName) {
    toast.show("Please enter your name.", "error");
    return;
  }

  // Transition UI
  quizRegCard.classList.add("hidden");
  quizTakingPanel.classList.remove("hidden");

  // Render taking panel
  startQuizTaking();
}

/**
 * Begin taking the quiz: renders questions, registers timer
 */
function startQuizTaking() {
  takingQuizTitle.textContent = quiz.title;
  takingQuizDescription.textContent = quiz.description || "";

  // Render question list
  renderQuestions();

  // Setup Timer if applicable
  if (quiz.timeLimit && quiz.timeLimit > 0) {
    secondsRemaining = quiz.timeLimit * 60;
    headerTimerContainer.classList.remove("hidden");
    updateTimerUI();
    
    timerInterval = setInterval(() => {
      secondsRemaining--;
      updateTimerUI();
      
      if (secondsRemaining <= 0) {
        clearInterval(timerInterval);
        triggerAutoSubmission();
      }
    }, 1000);
  }

  // Update progress indicator initially
  updateProgressUI();

  // Wire submission button
  quizSubmitBtn.addEventListener("click", handleManualSubmit);
}

/**
 * Update timer UI
 */
function updateTimerUI() {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  quizTimerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  // Visual warning if less than 1 minute remains
  if (secondsRemaining < 60) {
    headerTimerContainer.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-rose-300 bg-rose-100 text-rose-700 text-xs font-semibold font-mono animate-pulse";
  }
}

/**
 * Render list of multiple-choice questions
 */
function renderQuestions() {
  takingQuestionsContainer.innerHTML = "";

  quiz.questions.forEach((q, qIdx) => {
    const qCard = document.createElement("div");
    qCard.className = "glass-panel p-6 rounded-2xl border-zinc-200 space-y-4 shadow-sm animate-fade-in";
    qCard.setAttribute("data-q-idx", qIdx);

    let optionsHtml = "";
    q.options.forEach((opt, optIdx) => {
      const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...
      
      optionsHtml += `
        <button 
          type="button" 
          data-opt-idx="${optIdx}" 
          class="option-btn w-full p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-left text-xs text-zinc-700 font-medium transition-all flex items-center gap-3 focus:outline-none shadow-sm"
        >
          <span class="option-badge w-6 h-6 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-500 font-bold flex items-center justify-center flex-shrink-0 transition-colors">
            ${optionLetter}
          </span>
          <span class="option-text truncate">${escapeHtml(opt)}</span>
        </button>
      `;
    });

    qCard.innerHTML = `
      <div class="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
        <h3 class="text-sm font-semibold text-zinc-500">Question ${qIdx + 1} of ${quiz.questions.length}</h3>
      </div>
      <p class="text-sm font-bold text-zinc-800 mt-2">${escapeHtml(q.text)}</p>
      <div class="grid grid-cols-1 gap-2.5 mt-4">
        ${optionsHtml}
      </div>
    `;

    // Attach option button click handlers
    qCard.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => selectOption(qIdx, parseInt(btn.getAttribute("data-opt-idx"))));
    });

    takingQuestionsContainer.appendChild(qCard);
  });
}

/**
 * Selection handler
 */
function selectOption(questionIdx, optionIdx) {
  // Update state
  studentAnswers[questionIdx] = optionIdx;

  // Update DOM styles inside the specific question card
  const qCard = takingQuestionsContainer.querySelector(`[data-q-idx="${questionIdx}"]`);
  const buttons = qCard.querySelectorAll(".option-btn");

  buttons.forEach(btn => {
    const btnOptIdx = parseInt(btn.getAttribute("data-opt-idx"));
    const badge = btn.querySelector(".option-badge");

    if (btnOptIdx === optionIdx) {
      // Selected Option
      btn.className = "option-btn w-full p-4 rounded-xl border border-indigo-300 bg-indigo-50 text-left text-xs text-indigo-700 font-bold transition-all flex items-center gap-3 focus:outline-none shadow-sm";
      badge.className = "option-badge w-6 h-6 rounded-lg bg-indigo-600 border border-indigo-300 text-[10px] text-white font-bold flex items-center justify-center flex-shrink-0 transition-colors";
    } else {
      // Normal options
      btn.className = "option-btn w-full p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-left text-xs text-zinc-700 font-medium transition-all flex items-center gap-3 focus:outline-none shadow-sm";
      badge.className = "option-badge w-6 h-6 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-500 font-bold flex items-center justify-center flex-shrink-0 transition-colors";
    }
  });

  // Sync completion values
  updateProgressUI();
}

/**
 * Calculate progress percentage and text
 */
function updateProgressUI() {
  const total = quiz.questions.length;
  const answered = studentAnswers.filter(ans => ans !== null).length;
  
  progressText.textContent = `Answered ${answered} of ${total}`;
  
  const pct = total > 0 ? (answered / total) * 100 : 0;
  progressBar.style.width = `${pct}%`;
}

/**
 * Submit answers flow
 */
async function processSubmission() {
  try {
    showLoader();
    
    // Disable inputs & buttons
    quizSubmitBtn.disabled = true;
    quizSubmitBtn.querySelector("span").textContent = "Submitting...";

    // Calculate score
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    // Grade calculation rules
    let grade = "Fail";
    if (percentage >= 90) grade = "Excellent";
    else if (percentage >= 80) grade = "Very Good";
    else if (percentage >= 70) grade = "Good";
    else if (percentage >= 60) grade = "Pass";

    // Setup payload
    const submissionPayload = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentName: studentName,
      studentId: studentId || "N/A",
      answers: studentAnswers,
      score: score,
      percentage: percentage,
      grade: grade
    };

    // Save to database
    const submissionId = await addSubmission(submissionPayload);

    // Secure Telegram Webhook trigger (Free alternative to Cloud Functions)
    if (TELEGRAM_WEBHOOK_URL && TELEGRAM_WEBHOOK_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      try {
        await fetch(TELEGRAM_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(submissionPayload)
        });
      } catch (webhookErr) {
        console.error("Telegram Webhook call failed:", webhookErr);
      }
    }

    // Stop timer
    if (timerInterval) clearInterval(timerInterval);

    // Redirect to results page
    window.location.href = `/results.html?id=${submissionId}`;

  } catch (err) {
    console.error("Submission processing error:", err);
    toast.show("An error occurred during submission. Please try clicking submit again.", "error");
    quizSubmitBtn.disabled = false;
    quizSubmitBtn.querySelector("span").textContent = "Submit My Answers";
    hideLoader();
  }
}

/**
 * Handle manual submit click
 */
function handleManualSubmit() {
  const total = quiz.questions.length;
  const answered = studentAnswers.filter(ans => ans !== null).length;
  const unanswered = total - answered;

  let msg = `You have answered ${answered} of ${total} questions. Are you sure you want to submit your answers?`;
  if (unanswered > 0) {
    msg = `⚠️ WARNING: You have left ${unanswered} question(s) unanswered. Submitting now will grade these questions as wrong. Are you sure you want to proceed?`;
  }

  showConfirmModal({
    title: "Confirm Submission",
    message: msg,
    confirmText: "Yes, Submit",
    cancelText: "Keep Answering",
    onConfirm: () => {
      processSubmission();
    }
  });
}

/**
 * Automatically triggers submission when timer expires
 */
function triggerAutoSubmission() {
  if (autoSubmitted) return;
  autoSubmitted = true;
  
  toast.show("Time is up! Your answers are being submitted automatically.", "error", 5000);
  
  document.querySelectorAll(".option-btn").forEach(btn => {
    btn.disabled = true;
  });

  setTimeout(() => {
    processSubmission();
  }, 1500);
}

/**
 * Render error screen
 */
function showErrorState(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  quizErrorCard.classList.remove("hidden");
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Kickstart Quiz Page
init();

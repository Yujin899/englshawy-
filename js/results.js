// Student Results Page Controller (Light Mode UI)
import { getSubmissionById, getQuizById } from "./db.js";

// DOM Elements
const resultsLoader = document.getElementById("results-loader");
const resultsContainer = document.getElementById("results-container");
const resultsError = document.getElementById("results-error");

const progressCircle = document.getElementById("progress-circle");
const scorePercentage = document.getElementById("score-percentage");
const badgeGrade = document.getElementById("badge-grade");
const studentDisplayName = document.getElementById("student-display-name");
const studentMeta = document.getElementById("student-meta");

const statCorrect = document.getElementById("stat-correct");
const statWrong = document.getElementById("stat-wrong");
const statTime = document.getElementById("stat-time");

const questionsReviewContainer = document.getElementById("questions-review-container");

/**
 * Initialize Results Page
 */
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const submissionId = urlParams.get("id");

  if (!submissionId) {
    showErrorState();
    return;
  }

  try {
    // 1. Fetch submission
    const submission = await getSubmissionById(submissionId);
    
    if (!submission) {
      showErrorState();
      return;
    }

    // 2. Populate stats & metadata
    studentDisplayName.textContent = escapeHtml(submission.studentName);
    studentMeta.textContent = `Quiz: ${escapeHtml(submission.quizTitle)} • ID: ${escapeHtml(submission.studentId || "N/A")}`;
    
    const correctCount = submission.score !== undefined ? submission.score : 0;
    const totalQuestions = submission.answers ? submission.answers.length : 0;
    
    statCorrect.textContent = correctCount;
    statWrong.textContent = totalQuestions - correctCount;

    if (submission.submittedAt) {
      const date = new Date(submission.submittedAt.seconds * 1000);
      statTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + date.toLocaleDateString();
    } else {
      statTime.textContent = "N/A";
    }

    // Percentage display & SVG Animation
    const pct = submission.percentage || 0;
    scorePercentage.textContent = `${pct}%`;
    animateProgressCircle(pct);

    // Grade display
    badgeGrade.textContent = submission.grade;
    applyGradeStyle(submission.grade);

    // Show panel
    resultsLoader.classList.add("hidden");
    resultsContainer.classList.remove("hidden");

    // Confetti effect on passing grade
    if (submission.grade !== "Fail" && window.confetti) {
      triggerConfetti();
    }

    // 3. Render questions review comparisons
    await renderReview(submission);

  } catch (error) {
    console.error("Error loading results:", error);
    showErrorState();
  }
}

/**
 * Circle dashOffset animation (circumference is ~390)
 */
function animateProgressCircle(percentage) {
  setTimeout(() => {
    const circumference = 390;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
  }, 100);
}

/**
 * Set grade badge styling
 */
function applyGradeStyle(grade) {
  badgeGrade.className = "inline-block px-3 py-1 rounded-lg text-xs font-bold border ";
  if (grade === "Excellent") {
    badgeGrade.classList.add("border-emerald-200", "text-emerald-700", "bg-emerald-50");
    progressCircle.setAttribute("stroke", "#10b981"); // green-500
  } else if (grade === "Very Good" || grade === "Good") {
    badgeGrade.classList.add("border-indigo-200", "text-indigo-700", "bg-indigo-50");
    progressCircle.setAttribute("stroke", "#6366f1"); // indigo-500
  } else if (grade === "Pass") {
    badgeGrade.classList.add("border-amber-200", "text-amber-700", "bg-amber-50");
    progressCircle.setAttribute("stroke", "#f59e0b"); // amber-500
  } else {
    badgeGrade.classList.add("border-rose-200", "text-rose-700", "bg-rose-50");
    progressCircle.setAttribute("stroke", "#ef4444"); // rose-500
  }
}

/**
 * Confetti fire sequence
 */
function triggerConfetti() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#6366f1', '#a855f7', '#10b981']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#6366f1', '#a855f7', '#10b981']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

/**
 * Fetch source quiz and reconstruct answers visual logs
 */
async function renderReview(submission) {
  questionsReviewContainer.innerHTML = '<div class="py-6 flex justify-center"><div class="animate-spin rounded-full h-6 w-6 border-2 border-zinc-350 border-t-indigo-600"></div></div>';
  
  try {
    const quiz = await getQuizById(submission.quizId);
    questionsReviewContainer.innerHTML = "";

    if (!quiz) {
      questionsReviewContainer.innerHTML = `
        <div class="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs text-center font-medium">
          ⚠️ Source quiz document has been deleted. Questions review is unavailable.
        </div>
      `;
      return;
    }

    quiz.questions.forEach((q, idx) => {
      const studentAnswerIdx = submission.answers[idx];
      const correctAnswerIdx = q.correctAnswerIndex;
      const isCorrect = studentAnswerIdx === correctAnswerIdx;

      const card = document.createElement("div");
      card.className = `p-5 rounded-2xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'} space-y-4 animate-fade-in`;

      let optionsHtml = "";
      q.options.forEach((opt, optIdx) => {
        let optStyle = "border-zinc-200 bg-white text-zinc-650";
        let badgeHtml = "";

        if (optIdx === correctAnswerIdx) {
          // Correct Answer (Green highlight)
          optStyle = "border-emerald-250 bg-emerald-50 text-emerald-800 font-semibold";
          badgeHtml = `<span class="text-[10px] text-emerald-700 font-bold ml-auto bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Correct Answer</span>`;
        } else if (optIdx === studentAnswerIdx && !isCorrect) {
          // Wrong selection by student (Red highlight)
          optStyle = "border-rose-250 bg-rose-50 text-rose-800 font-semibold";
          badgeHtml = `<span class="text-[10px] text-rose-700 font-bold ml-auto bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Your Answer</span>`;
        } else if (optIdx === studentAnswerIdx && isCorrect) {
          // Correct selection by student
          badgeHtml = `<span class="text-[10px] text-emerald-700 font-bold ml-auto bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Your Choice</span>`;
        }

        optionsHtml += `
          <div class="flex items-center gap-3 p-3 rounded-xl border text-xs ${optStyle}">
            <span class="w-5.5 h-5.5 rounded bg-zinc-150 text-zinc-500 text-[9px] font-bold border border-zinc-250 flex items-center justify-center flex-shrink-0">
              ${String.fromCharCode(65 + optIdx)}
            </span>
            <span class="truncate">${escapeHtml(opt)}</span>
            ${badgeHtml}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <h4 class="text-sm font-semibold text-zinc-800">Q${idx + 1}: ${escapeHtml(q.text)}</h4>
          <span class="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}">
            ${isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        </div>
        <div class="grid grid-cols-1 gap-2">
          ${optionsHtml}
        </div>
      `;

      questionsReviewContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error fetching review quiz questions:", error);
    questionsReviewContainer.innerHTML = `
      <div class="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-750 text-xs text-center font-medium">
        ⚠️ Error loading quiz question review details.
      </div>
    `;
  }
}

/**
 * Handle errors / missing submissions
 */
function showErrorState() {
  resultsLoader.classList.add("hidden");
  resultsContainer.classList.add("hidden");
  resultsError.classList.remove("hidden");
}

/**
 * Escapes HTML characters
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

// Kickstart results controller
init();

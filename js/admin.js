// Admin Dashboard Controller (Functional Light-Mode UI)
import { initAuthGuard, logoutAdmin } from "./auth.js";
import { getQuizzes, getSubmissions, deleteQuiz, duplicateQuiz, getQuizById } from "./db.js";
import { showConfirmModal, toast } from "./ui.js";

// Global states
let quizzes = [];
let submissions = [];
let filteredSubmissions = [];

// DOM Elements
const adminEmailDisplay = document.getElementById("admin-email-display");
const logoutBtn = document.getElementById("logout-btn");

const statTotalQuizzes = document.getElementById("stat-total-quizzes");
const statTotalSubmissions = document.getElementById("stat-total-submissions");
const statAvgPercentage = document.getElementById("stat-avg-percentage");
const statExcellentRate = document.getElementById("stat-excellent-rate");

const tabQuizzes = document.getElementById("tab-quizzes");
const tabSubmissions = document.getElementById("tab-submissions");
const panelQuizzes = document.getElementById("panel-quizzes");
const panelSubmissions = document.getElementById("panel-submissions");

const badgeQuizzes = document.getElementById("count-badge-quizzes");
const badgeSubmissions = document.getElementById("count-badge-submissions");

const quizzesLoading = document.getElementById("quizzes-loading");
const quizzesEmpty = document.getElementById("quizzes-empty");
const quizzesGrid = document.getElementById("quizzes-grid");

const submissionsLoading = document.getElementById("submissions-loading");
const submissionsEmpty = document.getElementById("submissions-empty");
const submissionsTableContainer = document.getElementById("submissions-table-container");
const submissionsTbody = document.getElementById("submissions-tbody");
const submissionSearch = document.getElementById("submission-search");
const submissionFilterQuiz = document.getElementById("submission-filter-quiz");

// Modal Elements
const modalSubmissionDetails = document.getElementById("modal-submission-details");
const modalDetailsClose = document.getElementById("modal-details-close");
const modalStudentName = document.getElementById("modal-student-name");
const modalStudentMeta = document.getElementById("modal-student-meta");
const modalAnswersContainer = document.getElementById("modal-answers-container");
const modalCountCorrect = document.getElementById("modal-count-correct");
const modalCountWrong = document.getElementById("modal-count-wrong");
const modalBadgeGrade = document.getElementById("modal-badge-grade");

/**
 * Initialize Admin Controller
 */
async function init() {
  // 1. Guard check
  const user = await initAuthGuard(true);
  adminEmailDisplay.textContent = user.email;
  adminEmailDisplay.classList.remove("hidden");

  // 2. Wire log out
  logoutBtn.addEventListener("click", () => {
    showConfirmModal({
      title: "Log Out",
      message: "Are you sure you want to end your session?",
      confirmText: "Log Out",
      onConfirm: async () => {
        await logoutAdmin();
      }
    });
  });

  // 3. Tab Toggles
  tabQuizzes.addEventListener("click", () => switchTab("quizzes"));
  tabSubmissions.addEventListener("click", () => switchTab("submissions"));

  // 4. Filters
  submissionSearch.addEventListener("input", filterSubmissionsData);
  submissionFilterQuiz.addEventListener("change", filterSubmissionsData);

  // 5. Modal Close
  modalDetailsClose.addEventListener("click", hideSubmissionModal);
  modalSubmissionDetails.addEventListener("click", (e) => {
    if (e.target === modalSubmissionDetails) hideSubmissionModal();
  });

  // 6. Load DB Data
  await refreshData();
}

/**
 * Switch Dashboard Tabs
 */
function switchTab(tab) {
  if (tab === "quizzes") {
    // Quizzes active
    tabQuizzes.className = "px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 transition-all focus:outline-none";
    tabSubmissions.className = "px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border border-transparent transition-all focus:outline-none";
    panelQuizzes.classList.remove("hidden");
    panelSubmissions.classList.add("hidden");
  } else {
    // Submissions active
    tabSubmissions.className = "px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 transition-all focus:outline-none";
    tabQuizzes.className = "px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border border-transparent transition-all focus:outline-none";
    panelSubmissions.classList.remove("hidden");
    panelQuizzes.classList.add("hidden");
  }
}

/**
 * Fetch and populate dashboard
 */
async function refreshData() {
  try {
    quizzesLoading.classList.remove("hidden");
    submissionsLoading.classList.remove("hidden");
    
    // Fetch concurrently
    const [fetchedQuizzes, fetchedSubmissions] = await Promise.all([
      getQuizzes(),
      getSubmissions()
    ]);

    quizzes = fetchedQuizzes;
    submissions = fetchedSubmissions;
    filteredSubmissions = [...submissions];

    // Compute stats
    calculateStats();

    // Populate dropdowns & lists
    populateQuizDropdown();
    renderQuizzes();
    renderSubmissions();

  } catch (error) {
    console.error("Dashboard refresh error:", error);
  } finally {
    quizzesLoading.classList.add("hidden");
    submissionsLoading.classList.add("hidden");
  }
}

/**
 * Aggregations for Stats Cards
 */
function calculateStats() {
  statTotalQuizzes.textContent = quizzes.length;
  statTotalSubmissions.textContent = submissions.length;
  badgeQuizzes.textContent = quizzes.length;
  badgeSubmissions.textContent = submissions.length;

  if (submissions.length > 0) {
    const totalPct = submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0);
    const avgPct = Math.round(totalPct / submissions.length);
    statAvgPercentage.textContent = `${avgPct}%`;

    const excellentCount = submissions.filter(sub => sub.grade === "Excellent" || sub.percentage >= 90).length;
    const excRate = Math.round((excellentCount / submissions.length) * 100);
    statExcellentRate.textContent = `${excRate}%`;
  } else {
    statAvgPercentage.textContent = "0%";
    statExcellentRate.textContent = "0%";
  }
}

/**
 * Populate filters
 */
function populateQuizDropdown() {
  submissionFilterQuiz.innerHTML = '<option value="">All Quizzes</option>';
  quizzes.forEach(quiz => {
    const opt = document.createElement("option");
    opt.value = quiz.id;
    opt.textContent = quiz.title;
    submissionFilterQuiz.appendChild(opt);
  });
}

/**
 * Render Quizzes Grid
 */
function renderQuizzes() {
  quizzesGrid.innerHTML = "";
  if (quizzes.length === 0) {
    quizzesEmpty.classList.remove("hidden");
    return;
  }
  quizzesEmpty.classList.add("hidden");

  quizzes.forEach(quiz => {
    const quizCard = document.createElement("div");
    quizCard.className = "glass-panel p-6 rounded-2xl border-zinc-200 flex flex-col justify-between hover:border-zinc-300 transition-all shadow-sm";
    
    const timeLimitStr = quiz.timeLimit ? `${quiz.timeLimit} mins` : "No limit";
    const dateStr = quiz.createdAt ? new Date(quiz.createdAt.seconds * 1000).toLocaleDateString() : "Pending";
    const shareableLink = `${window.location.origin}/quiz.html?id=${quiz.id}`;

    quizCard.innerHTML = `
      <div>
        <div class="flex items-start justify-between gap-3 mb-2">
          <h3 class="font-bold text-zinc-800 text-base line-clamp-1">${escapeHtml(quiz.title)}</h3>
          <span class="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-600 font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap">
            ${quiz.questions ? quiz.questions.length : 0} Qs
          </span>
        </div>
        <p class="text-xs text-zinc-500 mb-4 line-clamp-2 min-h-[32px]">${escapeHtml(quiz.description || "No description provided.")}</p>
        
        <!-- Details row -->
        <div class="flex items-center gap-4 text-[10px] text-zinc-400 mb-4 font-semibold">
          <div class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>${timeLimitStr}</span>
          </div>
          <div class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span>${dateStr}</span>
          </div>
        </div>

        <!-- Shareable Link Copy -->
        <div class="flex items-center gap-1.5 p-1.5 rounded-xl border border-zinc-200 bg-zinc-50 mb-6">
          <input 
            type="text" 
            readonly 
            value="${shareableLink}" 
            class="bg-transparent border-none text-[10px] font-mono text-zinc-600 focus:outline-none flex-grow pl-2 select-all line-clamp-1 truncate"
          >
          <button 
            data-link="${shareableLink}" 
            class="copy-link-btn px-2.5 py-1 text-[10px] font-bold rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 transition-all focus:outline-none"
          >
            Copy
          </button>
        </div>
      </div>

      <!-- Actions Footer -->
      <div class="flex items-center justify-between border-t border-zinc-100 pt-4 gap-2">
        <button 
          data-id="${quiz.id}" 
          class="duplicate-quiz-btn text-xs text-zinc-600 hover:text-zinc-800 transition-colors flex items-center gap-1 font-semibold"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
          <span>Duplicate</span>
        </button>
        
        <div class="flex items-center gap-3">
          <a 
            href="/create-quiz.html?edit=${quiz.id}" 
            class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span>Edit</span>
          </a>
          <button 
            data-id="${quiz.id}" 
            class="delete-quiz-btn text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;

    quizzesGrid.appendChild(quizCard);
  });

  // Attach button events
  document.querySelectorAll(".copy-link-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const link = e.target.getAttribute("data-link");
      navigator.clipboard.writeText(link).then(() => {
        toast.show("Quiz link copied to clipboard!", "success");
      });
    });
  });

  document.querySelectorAll(".duplicate-quiz-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const quizId = e.currentTarget.getAttribute("data-id");
      showConfirmModal({
        title: "Duplicate Quiz",
        message: "Are you sure you want to clone this quiz?",
        onConfirm: async () => {
          try {
            await duplicateQuiz(quizId);
            await refreshData();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });
  });

  document.querySelectorAll(".delete-quiz-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const quizId = e.currentTarget.getAttribute("data-id");
      showConfirmModal({
        title: "Delete Quiz",
        message: "This will permanently delete the quiz. Existing student submissions will remain in records.",
        confirmText: "Delete",
        onConfirm: async () => {
          try {
            await deleteQuiz(quizId);
            await refreshData();
          } catch (err) {
            console.error(err);
          }
        }
      });
    });
  });
}

/**
 * Filter submissions list based on input state
 */
function filterSubmissionsData() {
  const queryText = submissionSearch.value.trim().toLowerCase();
  const quizIdFilter = submissionFilterQuiz.value;

  filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.studentName.toLowerCase().includes(queryText);
    const matchesQuiz = !quizIdFilter || sub.quizId === quizIdFilter;

    return matchesSearch && matchesQuiz;
  });

  renderSubmissions();
}

/**
 * Render Submissions Table Rows
 */
function renderSubmissions() {
  submissionsTbody.innerHTML = "";
  if (filteredSubmissions.length === 0) {
    submissionsEmpty.classList.remove("hidden");
    submissionsTableContainer.classList.add("hidden");
    return;
  }

  submissionsEmpty.classList.add("hidden");
  submissionsTableContainer.classList.remove("hidden");

  filteredSubmissions.forEach(sub => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-zinc-50 transition-colors";

    const dateStr = sub.submittedAt 
      ? new Date(sub.submittedAt.seconds * 1000).toLocaleString() 
      : "Pending";
      
    const correctCount = sub.score !== undefined ? sub.score : 0;
    const totalQuestions = sub.answers ? sub.answers.length : 0;

    // Grade styling badge
    let gradeBadgeColor = "border-zinc-200 text-zinc-600 bg-zinc-50";
    if (sub.grade === "Excellent") gradeBadgeColor = "border-emerald-200 text-emerald-700 bg-emerald-50";
    else if (sub.grade === "Very Good" || sub.grade === "Good") gradeBadgeColor = "border-indigo-200 text-indigo-700 bg-indigo-50";
    else if (sub.grade === "Pass") gradeBadgeColor = "border-amber-200 text-amber-700 bg-amber-50";
    else if (sub.grade === "Fail") gradeBadgeColor = "border-rose-200 text-rose-700 bg-rose-50";

    tr.innerHTML = `
      <td class="p-4">
        <div class="font-semibold text-zinc-800">${escapeHtml(sub.studentName)}</div>
      </td>
      <td class="p-4 max-w-[150px] truncate text-zinc-700 font-medium">${escapeHtml(sub.quizTitle)}</td>
      <td class="p-4 text-center font-mono font-bold text-zinc-800">${correctCount}/${totalQuestions}</td>
      <td class="p-4 text-center font-mono text-zinc-800 font-bold">${sub.percentage}%</td>
      <td class="p-4 text-center">
        <span class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${gradeBadgeColor}">
          ${sub.grade}
        </span>
      </td>
      <td class="p-4 text-zinc-500 font-medium">${dateStr}</td>
      <td class="p-4 text-right">
        <button 
          data-id="${sub.id}" 
          class="view-sub-btn px-3 py-1.5 rounded-lg text-[10px] font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 transition-all"
        >
          View Details
        </button>
      </td>
    `;

    submissionsTbody.appendChild(tr);
  });

  // Attach Details events
  document.querySelectorAll(".view-sub-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const subId = e.target.getAttribute("data-id");
      showSubmissionDetails(subId);
    });
  });
}

/**
 * Open Submission Detail Modal & Render Questions Comparison
 */
async function showSubmissionDetails(submissionId) {
  try {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    modalStudentName.textContent = escapeHtml(sub.studentName);
    modalStudentMeta.textContent = `${escapeHtml(sub.quizTitle)}`;
    modalAnswersContainer.innerHTML = '<div class="py-6 flex justify-center"><div class="animate-spin rounded-full h-6 w-6 border-2 border-zinc-300 border-t-indigo-600"></div></div>';
    
    // Set score and grade
    const totalQuestions = sub.answers ? sub.answers.length : 0;
    const correctCount = sub.score !== undefined ? sub.score : 0;
    modalCountCorrect.textContent = correctCount;
    modalCountWrong.textContent = totalQuestions - correctCount;
    modalBadgeGrade.textContent = sub.grade;

    // Apply grade styling
    modalBadgeGrade.className = "px-2.5 py-1 rounded-lg text-xs font-bold border ";
    if (sub.grade === "Excellent") modalBadgeGrade.classList.add("border-emerald-200", "text-emerald-700", "bg-emerald-50");
    else if (sub.grade === "Very Good" || sub.grade === "Good") modalBadgeGrade.classList.add("border-indigo-200", "text-indigo-700", "bg-indigo-50");
    else if (sub.grade === "Pass") modalBadgeGrade.classList.add("border-amber-200", "text-amber-700", "bg-amber-50");
    else if (sub.grade === "Fail") modalBadgeGrade.classList.add("border-rose-200", "text-rose-700", "bg-rose-50");

    modalSubmissionDetails.classList.remove("hidden");

    // Fetch quiz questions
    const quiz = await getQuizById(sub.quizId);
    modalAnswersContainer.innerHTML = "";

    if (!quiz) {
      modalAnswersContainer.innerHTML = `
        <div class="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs text-center font-medium">
          ⚠️ Source quiz document has been deleted. Questions review is unavailable.
        </div>
      `;
      return;
    }

    // Build question cards comparison
    quiz.questions.forEach((q, idx) => {
      const studentAnswerIdx = sub.answers[idx];
      const correctAnswerIdx = q.correctAnswerIndex;
      const isCorrect = studentAnswerIdx === correctAnswerIdx;

      const card = document.createElement("div");
      card.className = `p-4 rounded-xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'} space-y-3`;

      let optionsListHtml = "";
      q.options.forEach((opt, optIdx) => {
        let optStyle = "border-zinc-200 bg-white text-zinc-600";
        let statusBadge = "";

        if (optIdx === correctAnswerIdx) {
          optStyle = "border-emerald-300 bg-emerald-100 text-emerald-800 font-semibold";
          statusBadge = `<span class="text-[10px] text-emerald-700 font-bold ml-auto bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Correct Answer</span>`;
        } else if (optIdx === studentAnswerIdx && !isCorrect) {
          optStyle = "border-rose-300 bg-rose-100 text-rose-800 font-semibold";
          statusBadge = `<span class="text-[10px] text-rose-700 font-bold ml-auto bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Your Answer</span>`;
        } else if (optIdx === studentAnswerIdx && isCorrect) {
          statusBadge = `<span class="text-[10px] text-emerald-700 font-bold ml-auto bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Your Choice</span>`;
        }

        optionsListHtml += `
          <div class="flex items-center gap-2 p-2.5 rounded-xl border text-xs ${optStyle}">
            <span class="w-5 h-5 rounded bg-zinc-100 text-zinc-500 text-[10px] font-bold flex items-center justify-center border border-zinc-200 flex-shrink-0">
              ${String.fromCharCode(65 + optIdx)}
            </span>
            <span class="truncate">${escapeHtml(opt)}</span>
            ${statusBadge}
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
        <div class="grid grid-cols-1 gap-2 mt-2">
          ${optionsListHtml}
        </div>
      `;

      modalAnswersContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error showing submission details:", error);
    toast.show("Failed to load submission comparison.", "error");
  }
}

function hideSubmissionModal() {
  modalSubmissionDetails.classList.add("hidden");
}

/**
 * Escapes HTML characters for security
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

// Kickstart Dashboard
init();

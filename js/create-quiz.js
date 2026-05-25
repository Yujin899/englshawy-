// Quiz Creator Controller (Light Mode UI - with JSON Import)
import { initAuthGuard } from "./auth.js";
import { getQuizById, createQuiz, updateQuiz } from "./db.js";
import { showLoader, hideLoader, toast } from "./ui.js";

// Global state
let editQuizId = null;
let questionCounter = 0; // Ensures unique names for radio groups

// DOM Elements
const pageTitle = document.getElementById("page-title");
const quizBuilderForm = document.getElementById("quiz-builder-form");
const quizTitleInput = document.getElementById("quiz-title");
const quizDescriptionInput = document.getElementById("quiz-description");
const quizTimeLimitInput = document.getElementById("quiz-timelimit");
const questionsListContainer = document.getElementById("questions-list-container");
const addQuestionBtn = document.getElementById("add-question-btn");
const submitFormBtn = document.getElementById("submit-form-btn");
const questionsCountBadge = document.getElementById("questions-count-badge");

// Import JSON Modal Elements
const importJsonBtn = document.getElementById("import-json-btn");
const modalImportJson = document.getElementById("modal-import-json");
const modalImportClose = document.getElementById("modal-import-close");
const modalImportCancelBtn = document.getElementById("modal-import-cancel-btn");
const modalImportSubmitBtn = document.getElementById("modal-import-submit-btn");
const importJsonTextarea = document.getElementById("import-json-textarea");
const copyFormulaBtn = document.getElementById("copy-formula-btn");
const jsonFormulaBlock = document.getElementById("json-formula-block");

/**
 * Initialize Creator Page
 */
async function init() {
  // 1. Route guard check
  await initAuthGuard(true);

  // 2. Check for edit mode
  const urlParams = new URLSearchParams(window.location.search);
  editQuizId = urlParams.get("edit");

  if (editQuizId) {
    pageTitle.textContent = "Edit Quiz";
    submitFormBtn.querySelector("span").textContent = "Update Quiz";
    await loadQuizDataForEdit(editQuizId);
  } else {
    pageTitle.textContent = "Create New Quiz";
    submitFormBtn.querySelector("span").textContent = "Save Quiz";
    // Populate with 1 empty question by default
    addQuestionDOM();
  }

  // 3. Setup event listeners
  addQuestionBtn.addEventListener("click", () => addQuestionDOM());
  quizBuilderForm.addEventListener("submit", handleSubmitForm);

  // 4. JSON Import modal event listeners
  importJsonBtn.addEventListener("click", showImportModal);
  modalImportClose.addEventListener("click", hideImportModal);
  modalImportCancelBtn.addEventListener("click", hideImportModal);
  copyFormulaBtn.addEventListener("click", copyFormulaTemplate);
  modalImportSubmitBtn.addEventListener("click", handleJsonImport);
  modalImportJson.addEventListener("click", (e) => {
    if (e.target === modalImportJson) hideImportModal();
  });

  updateQuestionCountBadge();
}

/**
 * Load existing quiz data into form for editing
 */
async function loadQuizDataForEdit(quizId) {
  try {
    showLoader();
    const quiz = await getQuizById(quizId);
    
    if (!quiz) {
      toast.show("Quiz not found, redirecting to dashboard.", "error");
      setTimeout(() => {
        window.location.href = "/admin.html";
      }, 1500);
      return;
    }

    // Populate metadata
    quizTitleInput.value = quiz.title;
    quizDescriptionInput.value = quiz.description || "";
    quizTimeLimitInput.value = quiz.timeLimit || "";

    // Populate questions
    if (quiz.questions && quiz.questions.length > 0) {
      quiz.questions.forEach(q => {
        addQuestionDOM(q);
      });
    } else {
      addQuestionDOM();
    }

  } catch (error) {
    console.error("Error loading quiz for edit:", error);
    toast.show("Failed to load quiz details.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Generate a unique ID for radio buttons grouping
 */
function generateUniqueId() {
  return 'group_' + (++questionCounter) + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Add a Question card DOM element
 */
function addQuestionDOM(questionData = null) {
  const uniqueGroupId = generateUniqueId();
  
  const questionCard = document.createElement("div");
  questionCard.className = "question-card glass-panel p-6 rounded-2xl border-zinc-200 space-y-4 relative shadow-sm";
  
  questionCard.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-zinc-700">Question <span class="question-number"></span></h3>
      <button type="button" class="remove-question-btn text-zinc-400 hover:text-rose-600 transition-colors text-xs flex items-center gap-1 font-semibold">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        <span>Remove Question</span>
      </button>
    </div>
    
    <div>
      <label class="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Question Text</label>
      <textarea 
        placeholder="e.g. What is the output of typeof null?" 
        class="question-text w-full px-3.5 py-2.5 rounded-xl custom-input text-zinc-850 text-sm resize-none" 
        rows="2"
        required
      >${questionData ? escapeHtml(questionData.text) : ""}</textarea>
    </div>
    
    <div class="space-y-3">
      <label class="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Options & Correct Answer</label>
      <div class="options-container space-y-2">
        <!-- Options inputs go here -->
      </div>
      <button type="button" class="add-option-btn text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-2">
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
        <span>Add Option</span>
      </button>
    </div>
  `;

  const optionsContainer = questionCard.querySelector(".options-container");
  const addOptionBtn = questionCard.querySelector(".add-option-btn");
  const removeQuestionBtn = questionCard.querySelector(".remove-question-btn");

  // Populate options
  if (questionData && questionData.options) {
    questionData.options.forEach((opt, optIdx) => {
      addOptionRowDOM(optionsContainer, uniqueGroupId, opt, optIdx === questionData.correctAnswerIndex);
    });
  } else {
    // Populate with 4 empty options by default
    addOptionRowDOM(optionsContainer, uniqueGroupId, "", true); // first checked
    addOptionRowDOM(optionsContainer, uniqueGroupId, "", false);
    addOptionRowDOM(optionsContainer, uniqueGroupId, "", false);
    addOptionRowDOM(optionsContainer, uniqueGroupId, "", false);
  }

  // Event handlers
  addOptionBtn.addEventListener("click", () => {
    addOptionRowDOM(optionsContainer, uniqueGroupId);
    updateRemoveOptionButtonsVisibility(optionsContainer);
  });

  removeQuestionBtn.addEventListener("click", () => {
    questionCard.remove();
    updateQuestionNumbers();
    updateQuestionCountBadge();
  });

  questionsListContainer.appendChild(questionCard);
  updateQuestionNumbers();
  updateQuestionCountBadge();
  updateRemoveOptionButtonsVisibility(optionsContainer);
}

/**
 * Add an Option row inside a Question card
 */
function addOptionRowDOM(optionsContainer, groupId, value = "", isCorrect = false) {
  const optionRow = document.createElement("div");
  optionRow.className = "option-row flex items-center gap-3";
  
  optionRow.innerHTML = `
    <input 
      type="radio" 
      name="correct-radio-${groupId}" 
      class="correct-radio w-4 h-4 text-indigo-600 border-zinc-300 bg-white focus:ring-indigo-500 cursor-pointer" 
      ${isCorrect ? "checked" : ""}
      required
    >
    <input 
      type="text" 
      placeholder="Enter option..." 
      class="option-text flex-grow px-3.5 py-2 rounded-xl custom-input text-xs" 
      value="${escapeHtml(value)}" 
      required
    >
    <button type="button" class="remove-option-btn text-zinc-450 hover:text-rose-600 transition-colors p-1.5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  // Option delete event
  optionRow.querySelector(".remove-option-btn").addEventListener("click", () => {
    const wasChecked = optionRow.querySelector(".correct-radio").checked;
    optionRow.remove();
    
    // If we removed the checked radio, check the first remaining option radio
    if (wasChecked) {
      const firstRadio = optionsContainer.querySelector(".correct-radio");
      if (firstRadio) firstRadio.checked = true;
    }
    
    updateRemoveOptionButtonsVisibility(optionsContainer);
  });

  optionsContainer.appendChild(optionRow);
}

/**
 * Hide / Show remove option buttons (minimum 2 options per question)
 */
function updateRemoveOptionButtonsVisibility(optionsContainer) {
  const rows = optionsContainer.querySelectorAll(".option-row");
  rows.forEach(row => {
    const delBtn = row.querySelector(".remove-option-btn");
    if (rows.length <= 2) {
      delBtn.classList.add("hidden");
    } else {
      delBtn.classList.remove("hidden");
    }
  });
}

/**
 * Clean up and sequentialize question numbering display
 */
function updateQuestionNumbers() {
  const questionCards = questionsListContainer.querySelectorAll(".question-card");
  questionCards.forEach((card, idx) => {
    card.querySelector(".question-number").textContent = idx + 1;
  });
}

/**
 * Sync UI badge for total questions count
 */
function updateQuestionCountBadge() {
  const count = questionsListContainer.querySelectorAll(".question-card").length;
  questionsCountBadge.textContent = `${count} ${count === 1 ? 'Question' : 'Questions'}`;
}

/**
 * Open Import Modal
 */
function showImportModal() {
  modalImportJson.classList.remove("hidden");
  importJsonTextarea.focus();
}

/**
 * Close Import Modal
 */
function hideImportModal() {
  modalImportJson.classList.add("hidden");
  importJsonTextarea.value = "";
}

/**
 * Copy Formula Template to Clipboard
 */
function copyFormulaTemplate() {
  const code = jsonFormulaBlock.textContent;
  navigator.clipboard.writeText(code).then(() => {
    toast.show("JSON template copied to clipboard!", "success");
  }).catch(() => {
    toast.show("Failed to copy template.", "error");
  });
}

/**
 * Handle JSON Import submit action
 */
function handleJsonImport() {
  const text = importJsonTextarea.value.trim();

  if (!text) {
    toast.show("Please paste some JSON first.", "error");
    return;
  }

  try {
    let importedQuestions = JSON.parse(text);

    // 1. Validation Check: Must be an array
    if (!Array.isArray(importedQuestions)) {
      throw new Error("Pasted content is not a JSON Array.");
    }

    if (importedQuestions.length === 0) {
      throw new Error("Questions array is empty.");
    }

    // 2. Validation Check: Individual Question Objects
    importedQuestions.forEach((q, idx) => {
      if (typeof q.text !== "string" || !q.text.trim()) {
        throw new Error(`Question ${idx + 1} has invalid or missing 'text'.`);
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error(`Question ${idx + 1} ('${q.text.substring(0, 15)}...') must have at least 2 options.`);
      }
      
      q.options.forEach((opt, optIdx) => {
        if (typeof opt !== "string" || !opt.trim()) {
          throw new Error(`Question ${idx + 1} has invalid or empty option at index ${optIdx}.`);
        }
      });

      if (typeof q.correctAnswerIndex !== "number" || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        throw new Error(`Question ${idx + 1} has out-of-bounds or invalid 'correctAnswerIndex'.`);
      }
    });

    // 3. Clear initial single blank question if there is exactly 1 question and it has no text
    const currentCards = questionsListContainer.querySelectorAll(".question-card");
    if (currentCards.length === 1) {
      const firstCardText = currentCards[0].querySelector(".question-text").value.trim();
      const firstCardOptionTexts = Array.from(currentCards[0].querySelectorAll(".option-text")).map(inp => inp.value.trim());
      const hasOptionText = firstCardOptionTexts.some(txt => txt !== "");

      if (!firstCardText && !hasOptionText) {
        currentCards[0].remove();
      }
    }

    // 4. Build card elements
    importedQuestions.forEach(q => {
      addQuestionDOM(q);
    });

    toast.show(`Successfully imported ${importedQuestions.length} questions!`, "success");
    hideImportModal();

  } catch (error) {
    console.error("JSON Import Error:", error);
    toast.show(`Import error: ${error.message}`, "error", 5000);
  }
}

/**
 * Handle form submission
 */
async function handleSubmitForm(e) {
  e.preventDefault();

  const title = quizTitleInput.value.trim();
  const description = quizDescriptionInput.value.trim();
  const timeLimit = quizTimeLimitInput.value ? parseInt(quizTimeLimitInput.value) : null;

  const questionCards = questionsListContainer.querySelectorAll(".question-card");
  
  if (questionCards.length === 0) {
    toast.show("Please add at least one question to the quiz.", "error");
    return;
  }

  const parsedQuestions = [];

  for (let i = 0; i < questionCards.length; i++) {
    const card = questionCards[i];
    const text = card.querySelector(".question-text").value.trim();
    const optionRows = card.querySelectorAll(".option-row");
    
    const options = [];
    let correctAnswerIndex = -1;

    optionRows.forEach((row, optIdx) => {
      const optionVal = row.querySelector(".option-text").value.trim();
      const isCorrectRadio = row.querySelector(".correct-radio").checked;
      
      options.push(optionVal);
      if (isCorrectRadio) {
        correctAnswerIndex = optIdx;
      }
    });

    if (correctAnswerIndex === -1) {
      toast.show(`Please select a correct answer for Question ${i + 1}.`, "error");
      return;
    }

    parsedQuestions.push({
      text,
      options,
      correctAnswerIndex
    });
  }

  try {
    showLoader();
    submitFormBtn.disabled = true;
    submitFormBtn.querySelector("span").textContent = "Saving...";

    if (editQuizId) {
      await updateQuiz(editQuizId, title, description, parsedQuestions, timeLimit);
    } else {
      await createQuiz(title, description, parsedQuestions, timeLimit);
    }

    setTimeout(() => {
      window.location.href = "/admin.html";
    }, 1200);

  } catch (error) {
    console.error("Save error:", error);
    submitFormBtn.disabled = false;
    submitFormBtn.querySelector("span").textContent = editQuizId ? "Update Quiz" : "Save Quiz";
    hideLoader();
  }
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

// Kickstart Quiz Builder
init();

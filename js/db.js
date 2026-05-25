// Firestore Database Services
import { db } from "./config.js";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { toast } from "./ui.js";

const QUIZZES_COL = "quizzes";
const SUBMISSIONS_COL = "submissions";

/**
 * --- QUIZ SERVICES ---
 */

/**
 * Fetch all quizzes ordered by creation date (newest first)
 */
export async function getQuizzes() {
  try {
    const q = query(collection(db, QUIZZES_COL), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({ id: doc.id, ...doc.data() });
    });
    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    toast.show("Failed to fetch quizzes.", "error");
    throw error;
  }
}

/**
 * Fetch a single quiz by ID
 */
export async function getQuizById(quizId) {
  try {
    const docRef = doc(db, QUIZZES_COL, quizId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      toast.show("Quiz not found.", "error");
      return null;
    }
  } catch (error) {
    console.error("Error fetching quiz:", error);
    toast.show("Failed to load quiz details.", "error");
    throw error;
  }
}

/**
 * Create a new quiz
 */
export async function createQuiz(title, description, questions, timeLimit = null) {
  try {
    const quizData = {
      title,
      description,
      questions,
      timeLimit: timeLimit ? parseInt(timeLimit) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, QUIZZES_COL), quizData);
    toast.show("Quiz created successfully!", "success");
    return docRef.id;
  } catch (error) {
    console.error("Error creating quiz:", error);
    toast.show("Failed to create quiz.", "error");
    throw error;
  }
}

/**
 * Update an existing quiz
 */
export async function updateQuiz(quizId, title, description, questions, timeLimit = null) {
  try {
    const docRef = doc(db, QUIZZES_COL, quizId);
    const updateData = {
      title,
      description,
      questions,
      timeLimit: timeLimit ? parseInt(timeLimit) : null,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
    toast.show("Quiz updated successfully!", "success");
    return quizId;
  } catch (error) {
    console.error("Error updating quiz:", error);
    toast.show("Failed to update quiz.", "error");
    throw error;
  }
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(quizId) {
  try {
    const docRef = doc(db, QUIZZES_COL, quizId);
    await deleteDoc(docRef);
    toast.show("Quiz deleted successfully.", "success");
    return true;
  } catch (error) {
    console.error("Error deleting quiz:", error);
    toast.show("Failed to delete quiz.", "error");
    throw error;
  }
}

/**
 * Duplicate a quiz
 */
export async function duplicateQuiz(quizId) {
  try {
    const sourceQuiz = await getQuizById(quizId);
    if (!sourceQuiz) throw new Error("Quiz does not exist.");

    const duplicatedTitle = `${sourceQuiz.title} (Copy)`;
    const newId = await createQuiz(
      duplicatedTitle,
      sourceQuiz.description || "",
      sourceQuiz.questions || [],
      sourceQuiz.timeLimit || null
    );
    toast.show("Quiz duplicated successfully!", "success");
    return newId;
  } catch (error) {
    console.error("Error duplicating quiz:", error);
    toast.show("Failed to duplicate quiz.", "error");
    throw error;
  }
}

/**
 * --- SUBMISSION SERVICES ---
 */

/**
 * Fetch all student submissions ordered by submission date (newest first)
 */
export async function getSubmissions() {
  try {
    const q = query(collection(db, SUBMISSIONS_COL), orderBy("submittedAt", "desc"));
    const querySnapshot = await getDocs(q);
    const submissions = [];
    querySnapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() });
    });
    return submissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    toast.show("Failed to fetch submissions.", "error");
    throw error;
  }
}

/**
 * Fetch a single submission by ID
 */
export async function getSubmissionById(submissionId) {
  try {
    const docRef = doc(db, SUBMISSIONS_COL, submissionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      toast.show("Submission not found.", "error");
      return null;
    }
  } catch (error) {
    console.error("Error fetching submission:", error);
    toast.show("Failed to load result.", "error");
    throw error;
  }
}

/**
 * Create a new submission
 */
export async function addSubmission(submissionData) {
  try {
    const fullData = {
      ...submissionData,
      submittedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, SUBMISSIONS_COL), fullData);
    toast.show("Answers submitted successfully!", "success");
    return docRef.id;
  } catch (error) {
    console.error("Error saving submission:", error);
    toast.show("Failed to submit answers.", "error");
    throw error;
  }
}

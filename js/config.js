// Firebase Configuration & Initialization (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace these placeholder values with your actual Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyA7KKBt1LESJ-s9lBs52dyf39FtnflFEAc",
  authDomain: "learning-470d7.firebaseapp.com",
  projectId: "learning-470d7",
  storageBucket: "learning-470d7.firebasestorage.app",
  messagingSenderId: "446194359274",
  appId: "1:446194359274:web:41809c533ce6bc755c7093"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
export const TELEGRAM_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbylV6qL3Eq5XTBvDIyYAsPI8w-Fo5omttynWZg8lsOyQAoaww3E_jApcAJC7cb2r1Ie/exec";
export default app;

// Firebase Authentication Helpers
import { auth, db } from "./config.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { toast } from "./ui.js";

/**
 * Log in admin using email and password
 */
export async function loginAdmin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    toast.show("Welcome back, administrator!", "success");
    return userCredential.user;
  } catch (error) {
    console.error("Login error:", error);
    let errorMsg = "Failed to log in. Please check your credentials.";
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      errorMsg = "Invalid email or password.";
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = "Please enter a valid email address.";
    }
    toast.show(errorMsg, "error");
    throw error;
  }
}

/**
 * Register a new admin account and write user document to Firestore
 */
export async function signupAdmin(email, password) {
  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Write admin user details to Firestore 'users' collection
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      role: "admin",
      createdAt: serverTimestamp()
    });

    toast.show("Admin account registered successfully!", "success");
    return user;
  } catch (error) {
    console.error("Signup error:", error);
    let errorMsg = "Failed to register account.";
    if (error.code === 'auth/email-already-in-use') {
      errorMsg = "This email address is already registered.";
    } else if (error.code === 'auth/weak-password') {
      errorMsg = "Password is too weak. Must be at least 6 characters.";
    } else if (error.code === 'auth/invalid-email') {
      errorMsg = "Invalid email address format.";
    }
    toast.show(errorMsg, "error");
    throw error;
  }
}

/**
 * Log out admin
 */
export async function logoutAdmin() {
  try {
    await signOut(auth);
    toast.show("Logged out successfully.", "success");
    // Redirect to login page
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1000);
  } catch (error) {
    console.error("Logout error:", error);
    toast.show("Failed to log out. Try again.", "error");
  }
}

/**
 * Check if the user is authenticated, redirecting to /login.html if not.
 * If requireAuth is false, redirect to /admin.html if they ARE logged in.
 */
export function initAuthGuard(requireAuth = true) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      const currentPath = window.location.pathname;
      const isGuestPage = currentPath.includes("login") || currentPath.includes("signup");
      
      if (requireAuth) {
        if (!user) {
          window.location.href = "/login.html";
        } else {
          resolve(user);
        }
      } else {
        // We are on login or signup page, redirect to admin if logged in
        if (user && isGuestPage) {
          window.location.href = "/admin.html";
        } else {
          resolve(user);
        }
      }
    });
  });
}

/**
 * Simple auth state listener
 */
export function onAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

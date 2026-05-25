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

/**
 * Dynamically loads and parses the .env file at runtime to extract the Discord Webhook URL.
 */
export async function getDiscordConfig() {
  // 1. OPTIONAL: Paste your Discord Webhook URL directly below to bypass .env loading (highly useful for quick testing or file:// protocol)
  const HARDCODED_DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1508553076003438654/CYjtXHjja-WhXV-m-Fo5YsNxKEmGWNQWNzJZ4jA2VNHs3-P1RLZYODd_kkIW20jUZ0KE"; 

  if (HARDCODED_DISCORD_WEBHOOK_URL) {
    return { webhookUrl: HARDCODED_DISCORD_WEBHOOK_URL };
  }

  try {
    if (window.location.protocol === 'file:') {
      console.error("AuraQuiz local test error: Browser blocks reading /.env via file:// protocol. Run a local server (like VS Code Live Server or npm run dev) to test env variables, or paste your webhook directly into HARDCODED_DISCORD_WEBHOOK_URL in js/config.js.");
      return { webhookUrl: null, isFileProtocol: true };
    }
    const response = await fetch('/.env');
    if (!response.ok) {
      console.warn("Could not find or fetch the /.env file. Make sure it exists in the root folder.");
      return { webhookUrl: null };
    }
    const text = await response.text();
    const config = { webhookUrl: null };
    
    text.split(/\r?\n/).forEach(line => {
      const clean = line.trim();
      if (!clean || clean.startsWith('#')) return;
      
      const equalsIdx = clean.indexOf('=');
      if (equalsIdx !== -1) {
        const key = clean.substring(0, equalsIdx).trim();
        let val = clean.substring(equalsIdx + 1).trim();
        
        // Strip outer quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        
        if (key === 'DISCORD_WEBHOOK_URL') config.webhookUrl = val;
      }
    });
    
    return config;
  } catch (err) {
    console.error("Failed to parse .env file:", err);
    return { webhookUrl: null };
  }
}

export default app;

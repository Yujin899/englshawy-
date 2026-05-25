# englshawy — English Quiz Platform

A complete, production-ready serverless Quiz Platform built with HTML, CSS, Tailwind CSS, Vanilla JavaScript (ES6+), Firebase Firestore, Firebase Authentication, Firebase Hosting, and Firebase Cloud Functions.

---

## Folder Structure

```
/
├── index.html                 # Main Landing / Direct code joiner
├── login.html                 # Admin authentication screen
├── admin.html                 # Admin Dashboard: Stats & management logs
├── create-quiz.html           # Dynamic Quiz creator
├── quiz.html                  # Student quiz-taking page (with active timer)
├── results.html               # Student result scorecard (confetti + question reviews)
├── firebase.json              # Firebase Hosting / Functions configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexing configurations
├── css/
│   └── styles.css             # Core style sheets, custom scrollbars
├── js/
│   ├── config.js              # Firebase core client SDK config
│   ├── auth.js                # Router guards and logins helpers
│   ├── db.js                  # Quiz and Submission collections services
│   └── ui.js                  # Dynamic alerts, spinners, and confirms
└── functions/                 # Backend Node.js Cloud Functions trigger
    ├── index.js               # Firestore onDocumentCreated Telegram dispatch
    └── package.json           # Cloud function modules manifest
```

---

## Firebase Setup Instructions

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and follow the prompts to create a new project.
3. Once created, click the **Web Icon (</>)** to register a new Web App.
4. Copy the Firebase Configuration object values (`apiKey`, `authDomain`, etc.).

### 2. Configure Client SDK Settings
Open `js/config.js` and replace the placeholder keys in `firebaseConfig` with your actual Web App credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Enable Authentication (Email/Password)
1. In the Firebase Console left menu, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password** and toggle it to **Enabled**.
4. Click **Users** tab, then click **Add User** to create the admin login credentials (e.g. `admin@englshawy.com` and a strong password). You will use these details to sign in on the `/login.html` screen.

### 4. Create Firestore Database
1. Go to **Build > Firestore Database** in the console.
2. Click **Create Database**.
3. Select your location and choose **Start in test mode** or **production mode** (our security rules will overwrite this anyway upon deployment).

---

## Telegram Integration Setup

To securely deliver notifications to the administrator without exposing bot credentials:

1. Create a new Telegram Bot using [@BotFather](https://t.me/BotFather) and copy the **HTTP API Bot Token**.
2. Retrieve your Telegram **Chat ID** (or channel ID if sending to a channel) using [@userinfobot](https://t.me/userinfobot) or [@IDBot](https://t.me/IDBot).
3. Create a `.env` configuration file inside the `/functions` directory:
   ```bash
   # Create file: /functions/.env
   TELEGRAM_BOT_TOKEN="your_bot_token_here"
   TELEGRAM_CHAT_ID="your_chat_id_here"
   ```
   Firebase CLI automatically uploads this `.env` configuration file when deploying Cloud Functions, securely injecting these keys directly into the execution environment.

---

## Local Development & Emulators

If you wish to test Cloud Functions and Hosting locally, you can use the Firebase Emulators:

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Authenticate:
   ```bash
   firebase login
   ```
3. Run the emulator suite:
   ```bash
   firebase emulators:start
   ```
4. Access the hosting site locally at `http://localhost:5000`.

---

## Production Deployment

When ready to host live, execute the following commands in the project root:

1. Ensure your current terminal directory is in the root folder of this project.
2. Link the local repository to your Firebase project:
   ```bash
   firebase use --add YOUR_PROJECT_ID
   ```
3. Deploy all components (Hosting, Firestore rules/indexes, and Cloud Functions) with a single command:
   ```bash
   firebase deploy
   ```

A unique, production-ready web app link will be printed in your console. You are ready to share quizzes!

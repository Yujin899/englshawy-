// Cloud Function for sending Telegram notifications on Quiz Submission
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Admin SDK
admin.initializeApp();

/**
 * Triggers when a new document is written in /submissions/{submissionId}
 */
exports.sendTelegramNotification = onDocumentCreated("submissions/{submissionId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error("No data found in the Firestore creation event.");
    return;
  }

  const submission = snap.data();

  // Telegram Credentials retrieved securely via Cloud Functions Environment Variables/Secrets
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !telegramChatId) {
    logger.error(
      "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables. " +
      "Notification could not be dispatched."
    );
    return;
  }

  const score = submission.score !== undefined ? submission.score : 0;
  const total = submission.answers ? submission.answers.length : 0;
  const wrongCount = total - score;
  const percentage = submission.percentage !== undefined ? submission.percentage : 0;
  const grade = submission.grade || "Fail";
  
  // Format submission date nicely
  const submissionTime = submission.submittedAt
    ? new Date(submission.submittedAt.toDate()).toLocaleString("en-US", { timeZone: "UTC" }) + " UTC"
    : new Date().toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";

  // Build the Telegram message body matching the exact format requirement
  const message = `📚 *New Quiz Submission*

👤 *Student:*
${submission.studentName} (${submission.studentId || "No ID"})

📝 *Quiz:*
${submission.quizTitle}

✅ *Correct:*
${score}

❌ *Wrong:*
${wrongCount}

📊 *Score:*
${score}/${total}

📈 *Percentage:*
${percentage}%

🏆 *Grade:*
${grade}

⏰ *Time:*
${submissionTime}`;

  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: "Markdown"
      })
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      logger.error("Telegram API Error Response:", result);
    } else {
      logger.info(`Telegram notification successfully dispatched for student: ${submission.studentName}`);
    }

  } catch (error) {
    logger.error("Failed to send Telegram notification POST request:", error);
  }
});

// src/services/emailService.js
import validator from "validator";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ------------------------------------
// 🔹 Brevo API client
// ------------------------------------
const brevoClient = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: {
    "api-key": process.env.BREVO_API_KEY,
    "content-type": "application/json",
  },
});

// ------------------------------------
// 1️⃣ Validate Email
// ------------------------------------
export const validateEmail = async (email) => {
  try {
    if (!validator.isEmail(email)) {
      return { isValid: false, reason: "Invalid email format" };
    }

    const disposableDomains = [
      "tempmail.com",
      "guerrillamail.com",
      "mailinator.com",
      "10minutemail.com",
      "throwawaymail.com",
      "fakeinbox.com",
      "yopmail.com",
      "temp-mail.org",
      "trashmail.com",
    ];

    const domain = email.split("@")[1].toLowerCase();
    if (disposableDomains.some((d) => domain.includes(d))) {
      return {
        isValid: false,
        reason: "Disposable email addresses are not allowed",
      };
    }

    const fakePatterns = [
      /^test\d*@/i,
      /^demo\d*@/i,
      /^fake\d*@/i,
      /^temp\d*@/i,
      /^admin\d*@/i,
    ];
    if (fakePatterns.some((p) => p.test(email))) {
      return { isValid: false, reason: "Suspicious email pattern detected" };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, reason: "Email verification failed" };
  }
};

// ------------------------------------
// 🔹 Internal helper to send email
// ------------------------------------
const sendEmail = async ({ to, subject, html }) => {
  try {
    await brevoClient.post("/smtp/email", {
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Stoq",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    return true;
  } catch (error) {
    console.error(
      "❌ Brevo email failed:",
      error?.response?.data || error.message
    );
    return false;
  }
};

// ------------------------------------
// 2️⃣ Send Verification Email
// ------------------------------------
export const sendVerificationEmail = async (email, verificationToken) => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

  return sendEmail({
    to: email,
    subject: "Verify Your Stoq Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Verify your email</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${verificationUrl}"
           style="background:#2563eb;color:#fff;padding:12px 20px;
                  text-decoration:none;border-radius:6px;">
          Verify Email
        </a>
        <p>If the button doesn’t work, copy this link:</p>
        <p>${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });
};

// ------------------------------------
// 3️⃣ Send Admin Notification
// ------------------------------------
export const sendNewUserNotification = async (user) => {
  return sendEmail({
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_FROM,
    subject: "🎉 New User Registered on Stoq",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>New User Registered</h2>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>User ID:</strong> ${user._id}</p>
        <p><strong>Email Verified:</strong> ${
          user.isEmailVerified ? "Yes" : "No"
        }</p>
        <p><strong>Registered At:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `,
  });
};

// ------------------------------------
// 4️⃣ Send Welcome Email
// ------------------------------------
export const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: "Welcome to Stoq 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Welcome, ${user.name}! 🎉</h2>
        <p>Your account is ready.</p>
        <a href="${process.env.FRONTEND_URL}"
           style="background:#16a34a;color:#fff;padding:12px 20px;
                  text-decoration:none;border-radius:6px;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
};

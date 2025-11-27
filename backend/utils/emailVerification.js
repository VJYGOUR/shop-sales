import validator from "validator";
import nodemailer from "nodemailer";
import { configDotenv } from "dotenv";
configDotenv();

// ----------------------
// 1️⃣ Setup Brevo SMTP Transporter
// ----------------------
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER, // e.g. 9ca50a001@smtp-brevo.com
    pass: process.env.BREVO_SMTP_PASS, // your SMTP password
  },
});

// Test the SMTP connection on server start
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Failed:", error);
  } else {
    console.log("✅ SMTP Server Ready to Send Emails");
  }
});

// ----------------------
// 2️⃣ Validate Email (your original logic) — UNTOUCHED
// ----------------------
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
  } catch (error) {
    return { isValid: false, reason: "Email verification failed" };
  }
};

// ----------------------------------------------------
// 3️⃣ Send Verification Email (same logic, just SMTP)
// ----------------------------------------------------
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const msg = {
      from: process.env.SENDGRID_FROM_EMAIL, // Your FROM email stays same
      to: email,
      subject: "Verify Your Stoq Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Please verify Your Email to start using Stoq</h2>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    };

    await transporter.sendMail(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
};

// ----------------------------------------------------
// 4️⃣ Send Admin Notification Email (logic unchanged)
// ----------------------------------------------------
export const sendNewUserNotification = async (user) => {
  try {
    const msg = {
      to: process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "🎉 New User Registered on Stoq!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">New User Alert!</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Registered At:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>User ID:</strong> ${user._id}</p>
            <p><strong>Email Verified:</strong> ${
              user.isEmailVerified ? "Yes" : "No"
            }</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(msg);
    console.log(`📧 Admin notification sent for new user: ${user.email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
    return false;
  }
};

// ----------------------------------------------------
// 5️⃣ Send Welcome Email (logic unchanged)
// ----------------------------------------------------
export const sendWelcomeEmail = async (user) => {
  try {
    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Welcome to Stoq! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Welcome to Stoq, ${user.name}! 🎉</h2>
          <p>We're excited to have you on board.</p>
          <p>Ready to get started? <a href="${process.env.FRONTEND_URL}">Login to your account</a></p>
        </div>
      `,
    };

    await transporter.sendMail(msg);
    console.log(`✅ Welcome email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return false;
  }
};

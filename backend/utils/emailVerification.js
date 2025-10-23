import validator from "validator";
import nodemailer from "nodemailer";

// Check if email is valid and not disposable
export const validateEmail = async (email) => {
  try {
    // Basic email validation
    if (!validator.isEmail(email)) {
      return { isValid: false, reason: "Invalid email format" };
    }

    // Check for disposable emails
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
    if (disposableDomains.some((disposable) => domain.includes(disposable))) {
      return {
        isValid: false,
        reason: "Disposable email addresses are not allowed",
      };
    }

    // Check for common fake email patterns
    const fakePatterns = [
      /^test\d*@/i,
      /^demo\d*@/i,
      /^fake\d*@/i,
      /^temp\d*@/i,
      /^admin\d*@/i,
    ];

    if (fakePatterns.some((pattern) => pattern.test(email))) {
      return { isValid: false, reason: "Suspicious email pattern detected" };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, reason: "Email verification failed" };
  }
};

// Email transporter setup - FIXED: createTransporter to createTransport
export const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail", // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use app password for Gmail
    },
  });
};

// Send verification email
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    console.log("📧 Sending verification email:");
    console.log("   To:", email);
    console.log("   Token:", verificationToken);
    console.log("   Token length:", verificationToken.length);
    console.log("   URL:", verificationUrl);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email Address",
      html: `. <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
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

    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
};

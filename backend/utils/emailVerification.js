import validator from "validator";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Validate email format, disposable emails, and fake patterns
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

// Send verification email using SendGrid
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
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

    await sgMail.send(msg);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    return false;
  }
};

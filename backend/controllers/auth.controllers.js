import client from "../lib/redis.js";
import User from "../models/user.models.js";
import generateToken from "../utils/generateToken.js";
import setCookies from "../utils/setCookies.js";
import jwt from "jsonwebtoken";
import storeRefreshToken from "../utils/storeRefreshToken.js";
import crypto from "crypto";
import {
  validateEmail,
  sendVerificationEmail,
} from "../utils/emailVerification.js";

export const signup = async (req, res) => {
  // Extract user data from request body
  const { name, email, password } = req.body;
  try {
    // Check if user already exists in database
    const userExists = await User.findOne({ email });
    console.log("user exist", userExists);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "enter email or password" });
    }

    // ✅ UPDATED: Changed verifyEmail to validateEmail
    const emailVerification = await validateEmail(email);
    if (!emailVerification.isValid) {
      return res.status(400).json({
        message: emailVerification.reason || "Invalid email address",
      });
    }

    // ✅ ADDED: Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user in database with verification data
    const user = new User({
      name,
      email,
      password,
      plan: "free", // ← ADD THIS - default to free plan
      businessName: name + "'s Business",
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    await user.save();

    // ✅ ADDED: Send verification email
    const emailSent = await sendVerificationEmail(
      email,
      emailVerificationToken
    );

    // Send success response with user data
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan, // ← ADD THIS
        businessName: user.businessName, // ← ADD THIS
        isEmailVerified: user.isEmailVerified,
      },
      message:
        "User created successfully. Please check your email for verification.",
      verificationEmailSent: emailSent,
    });
  } catch (error) {
    // Handle any server errors
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "enter email and password" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ ADDED: Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        message: "Please verify your email before logging in",
      });
    }

    // Check password
    const isMatched = await user.checkPassword(password);
    if (!isMatched) {
      return res.status(401).json({ message: "password is incorrect" });
    }
    const { accessToken, refreshToken } = generateToken(user._id);
    // Store refresh token
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified, // ✅ ADDED
      message: "Login successful",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ ADDED: Email verification endpoint (this is the controller function)

// Verify email endpoint
export const verifyEmail = async (req, res) => {
  try {
    let { token } = req.query;
    if (!token)
      return res
        .status(400)
        .json({ message: "Verification token is required" });

    token = token.trim();

    // Atomic find-and-update
    const user = await User.findOneAndUpdate(
      {
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired verification token. Please request a new verification email.",
      });
    }

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("💥 Verification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ ADDED: Resend verification email endpoint
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(
      email,
      emailVerificationToken
    );

    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.status(200).json({
      message: "Verification email sent successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const logout = async (req, res) => {
  console.log(req.cookies.refreshToken);
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log(refreshToken);
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await client.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.send("logout successfulyy");
  } catch (err) {
    res.status(500).json({ message: "server error", error: err.message });
  }
};

//This will re-create the access-token
export const refreshToken = async (req, res) => {
  try {
    //GET REFRESHTOKEN
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refreshTOKEN Provided" });
    }
    //verify the idcard
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    //GET TOKEN FROM redis
    const storedToken = await client.get(`refresh_token:${decoded.userId}`);
    //check if both are same
    if (storedToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    //if same create accessIDcard
    const accessToken = jwt.sign(
      { userId: decoded.userId }, // payload
      process.env.ACCESS_TOKEN_SECRET, // secret key
      { expiresIn: "15m" } // token validity
    );
    //send idcard in cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.json({ message: "Token refreshed successfuly" });
  } catch (err) {
    console.log("error in refreshtoken controller", err.message);
    res.status(500).json({ message: "server error", errror: err.message });
  }
};

export const me = async (req, res) => {
  console.log("🔐 Me endpoint executed");

  try {
    const token = req.cookies.accessToken;
    console.log("📄 Token received:", token ? "Yes" : "No");

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("✅ Token decoded for user:", decoded.userId);

    // Get full user data from database (excluding password)
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ User data retrieved:", user.email);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        phoneNumber: user.phoneNumber,
        // ADD THESE TWO LINES:
        plan: user.plan || "free", // Default to 'free' if not set
        businessName: user.businessName || user.name + "'s Business",
        profileImage: user.profileImage || null, // Default if not set
        subscriptionId: user.subscriptionId,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err) {
    console.error("❌ Token verification error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// 🔥 IMMEDIATE DEBUG: Check all tokens
export const debugTokens = async (req, res) => {
  try {
    const users = await User.find({}).select(
      "email isEmailVerified emailVerificationToken emailVerificationExpires"
    );

    const result = users.map((user) => ({
      email: user.email,
      isVerified: user.isEmailVerified,
      hasToken: !!user.emailVerificationToken,
      token: user.emailVerificationToken,
      expires: user.emailVerificationExpires,
      isExpired: user.emailVerificationExpires
        ? user.emailVerificationExpires < new Date()
        : null,
    }));

    console.log("🔍 ALL USERS:", result);
    res.json({ users: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

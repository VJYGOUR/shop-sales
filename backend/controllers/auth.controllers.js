import client from "../lib/redis.js";
import User from "../models/user.models.js";
import generateToken from "../utils/generateToken.js";
import setCookies from "../utils/setCookies.js";
import jwt from "jsonwebtoken";
import storeRefreshToken from "../utils/storeRefreshToken.js";

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
    // Create new user in database
    const user = await User.create({ name, email, password });

    // Send success response with user data
    res.status(201).json({ user, message: "user created successfully" });
  } catch (error) {
    // Handle any server errors
    res.status(500).json({ message: error.message });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  //2)
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "enter email and password" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
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
      message: "LOgin successful",
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
        // Add any other user fields you want to expose
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

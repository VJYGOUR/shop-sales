import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const protect = async (req, res, next) => {
  try {
    // 1. Get tokens from cookies
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no tokens",
      });
    }

    let user;
    let newAccessToken;

    // 2. Try to verify access token first
    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET
        );
        user = await User.findById(decoded.userId).select("-password");
      } catch (accessError) {
        // Access token expired or invalid
        if (
          accessError.name === "TokenExpiredError" ||
          accessError.name === "JsonWebTokenError"
        ) {
          console.log("Access token invalid, trying refresh token...");
        }
      }
    }

    // 3. If no user from access token, try refresh token
    if (!user && refreshToken) {
      try {
        const refreshDecoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        user = await User.findById(refreshDecoded.userId).select("-password");

        if (user) {
          // Generate new access token
          newAccessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
          );

          // Set new access token in cookie
          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
          });
        }
      } catch (refreshError) {
        console.error("Refresh token invalid:", refreshError);
        // Clear invalid cookies
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.status(401).json({
          success: false,
          message: "Session expired, please login again",
        });
      }
    }

    // 4. If still no user, authentication failed
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // 5. Add user to request object
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =======================================
// PROTECT ROUTES (User/Admin Authentication)
// =======================================
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check for token in cookies (optional)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized. Please log in to continue.",
      });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in environment variables");
      return res.status(500).json({
        success: false,
        error: "Server configuration error. Please contact support.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token verified successfully for user:", decoded.id);
    } catch (jwtError) {
      // Handle specific JWT errors
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: "Invalid token. Please log in again.",
          details: "The token appears to be corrupted or tampered with."
        });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: "Session expired. Please log in again.",
          details: "Your session has expired for security reasons."
        });
      }
      if (jwtError.name === 'NotBeforeError') {
        return res.status(401).json({
          success: false,
          error: "Token not yet valid.",
          details: "Please try again in a moment."
        });
      }
      throw jwtError;
    }

    // Get user from database (exclude password)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found. Invalid token.",
      });
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated. Please contact support.",
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    req.token = token;

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed. Please log in again.",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =======================================
// ADMIN-ONLY MIDDLEWARE
// =======================================
export const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Admin privileges required.",
    });
  }

  next();
};

// =======================================
// OPTIONAL AUTH (Doesn't require auth, but attaches user if token exists)
// =======================================
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    if (!process.env.JWT_SECRET) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user && user.isActive !== false) {
      req.user = user;
      req.userId = user._id;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// =======================================
// VERIFY TOKEN UTILITY FUNCTION
// =======================================
export const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// =======================================
// REFRESH TOKEN MIDDLEWARE (Optional)
// =======================================
export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error",
      });
    }

    // Verify old token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      ignoreExpiration: true,
    });

    // Get user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new token
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token: newToken,
      expiresIn: "7d",
    });
  } catch (error) {
    console.error("REFRESH TOKEN ERROR:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

// =======================================
// LOGOUT MIDDLEWARE (Optional - for token blacklist)
// =======================================
// Note: For production, implement token blacklist with Redis
export const logout = async (req, res) => {
  try {
    // Clear token from cookies if used
    if (req.cookies) {
      res.clearCookie("token");
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};
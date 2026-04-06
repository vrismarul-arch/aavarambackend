// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =======================================
// Generate JWT Token
// =======================================
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined");
    throw new Error("JWT_SECRET not defined");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// =======================================
// REGISTER USER
// =======================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, contact, password } = req.body;

    console.log("Registration attempt:", { name, email, contact });

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false,
        error: "Full name is required" 
      });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters long" 
      });
    }
    
    // Validate contact method
    if (!email && !contact) {
      return res.status(400).json({ 
        success: false,
        error: "Either email or phone number is required" 
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Please enter a valid email address" 
      });
    }

    // Validate phone format if provided
    if (contact && !/^[0-9]{10}$/.test(contact)) {
      return res.status(400).json({ 
        success: false,
        error: "Please enter a valid 10-digit phone number" 
      });
    }

    // Check existing user by email
    if (email) {
      const existingEmail = await User.findOne({ email: email.trim() });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          error: "User already exists with this email address" 
        });
      }
    }

    // Check existing user by phone
    if (contact) {
      const existingPhone = await User.findOne({ contact: contact.trim() });
      if (existingPhone) {
        return res.status(400).json({ 
          success: false,
          error: "User already exists with this phone number" 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate avatar from name
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=17422f&color=fff&bold=true&length=2`;

    // Create user object
    const userData = {
      name: name.trim(),
      password: hashedPassword,
      authProvider: "email",
      avatar: avatarUrl,
      role: "user",
    };
    
    // Add optional fields
    if (email && email.trim()) {
      userData.email = email.trim();
    }
    if (contact && contact.trim()) {
      userData.contact = contact.trim();
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user._id);

    console.log("User registered successfully:", user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to Aavaaram.",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        avatar: user.avatar,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    
    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        error: `${field === 'email' ? 'Email' : 'Phone number'} already exists` 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Registration failed. Please try again." 
    });
  }
};

// =======================================
// LOGIN USER (Email or Phone)
// =======================================
export const loginUser = async (req, res) => {
  try {
    const { email, contact, password } = req.body;

    if (!email && !contact) {
      return res.status(400).json({ 
        success: false,
        error: "Email or phone number is required" 
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: "Password is required" 
      });
    }

    let user = null;
    
    if (email) {
      user = await User.findOne({ email: email.trim() });
    }
    
    if (!user && contact) {
      user = await User.findOne({ contact: contact.trim() });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid credentials" 
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({ 
        success: false,
        error: "This account is registered with Google. Please sign in with Google." 
      });
    }

    if (!user.password) {
      return res.status(400).json({ 
        success: false,
        error: "This account has no password set. Please use Google login." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid password" 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful!",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        avatar: user.avatar,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Login failed" 
    });
  }
};

// =======================================
// LOGIN WITH PHONE ONLY
// =======================================
export const loginWithPhone = async (req, res) => {
  try {
    const { contact, password } = req.body;

    if (!contact) {
      return res.status(400).json({ 
        success: false,
        error: "Phone number is required" 
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        error: "Password is required" 
      });
    }

    const user = await User.findOne({ contact: contact.trim() });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: "No account found with this phone number" 
      });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({ 
        success: false,
        error: "This account is registered with Google. Please sign in with Google." 
      });
    }

    if (!user.password) {
      return res.status(400).json({ 
        success: false,
        error: "This account has no password set." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: "Invalid password" 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful!",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        avatar: user.avatar,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("PHONE LOGIN ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Login failed" 
    });
  }
};

// =======================================
// GOOGLE LOGIN
// =======================================
export const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ 
        success: false,
        error: "Email and Google ID are required" 
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (picture) {
          user.picture = picture;
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      const userName = name || email.split('@')[0];
      const avatarUrl = picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=17422f&color=fff&bold=true&length=2`;
      
      user = await User.create({
        name: userName,
        email: email,
        googleId: googleId,
        picture: picture || "",
        avatar: avatarUrl,
        authProvider: "google",
        role: "user",
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Google login successful!",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        picture: user.picture,
        avatar: user.avatar,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message || "Google login failed" 
    });
  }
};

// =======================================
// GET USER PROFILE
// =======================================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        picture: user.picture,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      }
    });

  } catch (error) {
    console.error("PROFILE ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// =======================================
// UPDATE USER PROFILE
// =======================================
export const updateUserProfile = async (req, res) => {
  try {
    const { name, contact, address } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    // Check if contact is being changed and if it already exists
    if (contact && contact !== user.contact) {
      const existingUser = await User.findOne({ contact });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ 
          success: false,
          error: "Phone number already in use" 
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (contact) user.contact = contact;
    if (address) user.address = address;

    // Update avatar if name changed
    if (name && name !== user.name) {
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=17422f&color=fff&bold=true&length=2`;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// =======================================
// CHECK USER EXISTS (By Email or Phone)
// =======================================
export const checkUserExists = async (req, res) => {
  try {
    const { email, contact } = req.query;
    
    if (!email && !contact) {
      return res.status(400).json({ 
        success: false,
        error: "Email or phone number is required" 
      });
    }
    
    let user = null;
    
    if (email) {
      user = await User.findOne({ email: email.trim() }).select("-password");
    }
    
    if (!user && contact) {
      user = await User.findOne({ contact: contact.trim() }).select("-password");
    }
    
    res.json({
      success: true,
      exists: !!user,
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        authProvider: user.authProvider,
        role: user.role,
      } : null
    });
    
  } catch (error) {
    console.error("CHECK USER ERROR:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};  
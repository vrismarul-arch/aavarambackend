import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// =======================================
// Generate JWT Token
// =======================================
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined in .env");
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

    // Validate
    if (!name || !email || !contact || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check existing user
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate avatar from name
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7a2e00&color=fff&bold=true&length=2`;

    // Create user
    const user = await User.create({
      name,
      email,
      contact,
      password: hashedPassword,
      authProvider: "email",
      avatar: avatarUrl,
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        avatar: user.avatar,
        picture: user.picture,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// LOGIN USER
// =======================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if user signed up with Google
    if (user.authProvider === "google") {
      return res.status(400).json({ 
        error: "This email is registered with Google. Please sign in with Google." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        avatar: user.avatar,
        picture: user.picture,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// GOOGLE LOGIN
// =======================================
export const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        user.picture = picture || user.picture;
        // Generate avatar if not exists
        if (!user.avatar && !picture) {
          user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7a2e00&color=fff&bold=true&length=2`;
        } else if (picture) {
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      // Create new user with Google data
      const avatarUrl = picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=7a2e00&color=fff&bold=true&length=2`;
      
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        picture: picture || "",
        avatar: avatarUrl,
        authProvider: "google",
        contact: "",
        password: "",
      });
    }

    res.json({
      message: "Google login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        picture: user.picture,
        avatar: user.avatar,
      },
    });

  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// GET PROFILE (Protected Route)
// =======================================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);

  } catch (error) {
    console.error("PROFILE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// UPDATE PROFILE (Protected Route)
// =======================================
export const updateUserProfile = async (req, res) => {
  try {
    const { name, contact, address } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (contact) user.contact = contact;
    if (address) user.address = address;

    // Update avatar if name changed
    if (name && name !== user.name) {
      user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7a2e00&color=fff&bold=true&length=2`;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        address: user.address,
        avatar: user.avatar,
        picture: user.picture,
      },
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================================
// UPLOAD AVATAR (Protected Route)
// =======================================
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the uploaded file URL from your storage service
    // If using local storage:
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    
    // If using Supabase (like your categories):
    // const { data } = supabase.storage.from("avatars").getPublicUrl(req.file.filename);
    // const avatarUrl = data.publicUrl;

    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });

  } catch (error) {
    console.error("UPLOAD AVATAR ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
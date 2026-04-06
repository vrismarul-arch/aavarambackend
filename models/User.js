import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name must be less than 50 characters"],
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
  },
  contact: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
  },
  password: {
    type: String,
    default: null,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  picture: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },
  address: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// ✅ SIMPLIFIED - NO pre-save middleware, validate in controller instead
// Remove the pre-save middleware entirely

const User = mongoose.model("User", userSchema);
export default User;
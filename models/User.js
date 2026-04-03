import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    default: "",
  },
  googleId: {
    type: String,
    sparse: true,
  },
  picture: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,  // URL for uploaded avatar image
    default: "",
  },
  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    default: "",
  },
}, {
  timestamps: true,
});

const User = mongoose.model("User", userSchema);
export default User;
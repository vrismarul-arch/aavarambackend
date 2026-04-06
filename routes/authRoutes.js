// routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  loginWithPhone,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  checkUserExists,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// =======================================
// PUBLIC ROUTES
// =======================================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/login/phone", loginWithPhone);
router.post("/google-login", googleLogin);
router.get("/check-user", checkUserExists);

// =======================================
// PROTECTED ROUTES (require authentication)
// =======================================
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

export default router;
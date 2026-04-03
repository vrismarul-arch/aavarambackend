import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  googleLogin,
  updateUserProfile,
  uploadAvatar
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);

export default router;
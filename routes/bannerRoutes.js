// routes/bannerRoutes.js
import express from "express";
import {
  addBanner,
  getBanners,
  getBannerById,
  getActiveBanners,  // ✅ Import the new function
  deleteBanner,
  updateBanner,
} from "../controllers/bannerController.js";
import { bannerUpload, handleUploadError, validateFiles } from "../middleware/upload.js ";

const router = express.Router();

// ✅ Public routes (no authentication required)
router.get("/active", getActiveBanners);  // Move this BEFORE the /:id route

// Admin routes (add your auth middleware if needed)
router.get("/", getBanners);
router.get("/:id", getBannerById);
router.post("/", bannerUpload, validateFiles(["desktopImage", "mobileImage"]), handleUploadError, addBanner);
router.put("/:id", bannerUpload, handleUploadError, updateBanner);
router.delete("/:id", deleteBanner);

export default router;
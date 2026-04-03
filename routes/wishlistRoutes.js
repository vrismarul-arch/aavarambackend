import express from "express";
import { 
  toggleWishlist, 
  getUserWishlist, 
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkInWishlist
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes (require authentication)
router.get("/", protect, getUserWishlist);
router.post("/toggle", protect, toggleWishlist);
router.post("/add", protect, addToWishlist);
router.delete("/:productId", protect, removeFromWishlist);
router.delete("/clear/all", protect, clearWishlist);
router.get("/check/:productId", protect, checkInWishlist);

export default router;
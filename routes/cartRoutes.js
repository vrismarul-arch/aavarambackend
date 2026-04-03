import express from "express";
import { 
  addToCart, 
  getUserCart, 
  increaseQuantity, 
  decreaseQuantity,
  removeCartItem,
  clearCart  // ✅ ADD THIS IMPORT
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", protect, addToCart);
router.post("/increase", protect, increaseQuantity);
router.post("/decrease", protect, decreaseQuantity);
router.delete("/:productId", protect, removeCartItem);
router.delete("/clear/all", protect, clearCart);  // ✅ ADD CLEAR CART ROUTE
router.get("/", protect, getUserCart);

export default router;
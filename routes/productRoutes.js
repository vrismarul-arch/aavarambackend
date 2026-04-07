// routes/productRoutes.js
import express from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  getProductsByHealthType,
  getBestsellers,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  deleteReview,
  searchProducts,
  bulkDeleteProducts,
} from "../controllers/productController.js";

// ✅ FIXED: import uploadMultiple directly (not as a factory)
import { uploadMultiple } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/bestsellers", getBestsellers);
router.get("/health-type/:type", getProductsByHealthType);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

// ✅ FIXED: uploadMultiple used directly as middleware
router.post("/", uploadMultiple, createProduct);
router.put("/:id", uploadMultiple, updateProduct);
router.delete("/:id", deleteProduct);
router.post("/bulk-delete", bulkDeleteProducts);

// Review routes
router.post("/:id/review", addReview);
router.delete("/:productId/review/:reviewId", deleteReview);

export default router;
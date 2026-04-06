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
  bulkDeleteProducts
} from "../controllers/productController.js";

import { uploadMultiple } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/bestsellers", getBestsellers);
router.get("/health-type/:type", getProductsByHealthType);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

// Protected routes (add your auth middleware)
router.post("/", uploadMultiple, createProduct);
router.put("/:id", uploadMultiple, updateProduct);
router.delete("/:id", deleteProduct);
router.post("/bulk-delete", bulkDeleteProducts);

// Review routes
router.post("/:id/review", addReview);
router.delete("/:productId/review/:reviewId", deleteReview);

export default router;
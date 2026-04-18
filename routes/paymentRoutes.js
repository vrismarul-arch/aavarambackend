import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  createCODOrder,
} from "../controllers/paymentController.js";

const router = express.Router();

// IMPORTANT: These routes must match the frontend API calls
router.post("/razorpay", createRazorpayOrder);  // ✅ Frontend calls this
router.post("/verify", verifyPayment);          // ✅ Frontend calls this
router.post("/cod", createCODOrder);            // ✅ Frontend calls this

export default router;
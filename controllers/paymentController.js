import Razorpay from "razorpay";
import Order from "../models/Order.js";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ========== CREATE RAZORPAY ORDER ==========
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid amount" 
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    console.log("Creating Razorpay order with options:", options);
    
    const order = await razorpay.orders.create(options);
    
    console.log("Razorpay order created:", order);

    res.status(200).json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay Order Error Details:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error
    });
    
    res.status(500).json({
      success: false,
      message: error.error?.description || "Failed to create payment order",
    });
  }
};

// ========== VERIFY PAYMENT ==========
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    console.log("Verifying payment:", { razorpay_order_id, razorpay_payment_id });

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error("Invalid payment signature");
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Save order to database
    const newOrder = await Order.create({
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      paymentMethod: "ONLINE",
      paymentStatus: "Paid",
      customer: {
        firstName: orderData.customer.firstName,
        lastName: orderData.customer.lastName,
        email: orderData.customer.email,
        phone: orderData.customer.phone,
        address: orderData.customer.address,
        city: orderData.customer.city,
        state: orderData.customer.state,
        pincode: orderData.customer.pincode,
      },
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

// ========== CASH ON DELIVERY ==========
export const createCODOrder = async (req, res) => {
  try {
    const { items, totalAmount, customer, paymentMethod } = req.body;

    // Validate required fields
    if (!items || !totalAmount || !customer) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const newOrder = await Order.create({
      items: items,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Pending",
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      },
    });

    res.status(200).json({
      success: true,
      message: "COD order created successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("COD Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create COD order",
    });
  }
};
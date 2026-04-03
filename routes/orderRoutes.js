import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/* GET ORDER STATISTICS - ADD THIS MISSING ROUTE */
router.get("/stats", async (req, res) => {
  try {
    const orders = await Order.find();
    
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      pendingOrders: orders.filter(o => o.paymentStatus === "Pending").length,
      confirmedOrders: orders.filter(o => o.paymentStatus === "Confirmed").length,
      paidOrders: orders.filter(o => o.paymentStatus === "Paid").length,
      shippedOrders: orders.filter(o => o.paymentStatus === "Shipped").length,
      deliveredOrders: orders.filter(o => o.paymentStatus === "Delivered").length,
      cancelledOrders: orders.filter(o => o.paymentStatus === "Cancelled").length
    };
    
    res.json(stats);
  } catch (err) {
    console.error("Error fetching order stats:", err);
    res.status(500).json({ message: "Failed to fetch order statistics" });
  }
});

/* GET ALL ORDERS */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* GET USER ORDERS */
router.get("/user/:email", async (req, res) => {
  try {
    const orders = await Order.find({
      "customer.email": req.params.email,
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
});

/* UPDATE ORDER STATUS */
router.put("/:id/status", async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const updateData = { 
      paymentStatus: status,
    };
    
    if (status === "Cancelled") {
      updateData.cancelReason = reason || "No reason provided";
      updateData.cancelledAt = new Date();
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Status update failed" });
  }
});

/* CANCEL ORDER */
router.put("/cancel/:id", async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: "Cancelled",
        cancelReason: reason || "No reason provided",
        cancelledAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancel failed" });
  }
});

/* DELETE ORDER - ADD THIS IF YOU NEED IT */
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

/* GET SINGLE ORDER - KEEP THIS LAST */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

export default router;
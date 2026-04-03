import Order from "../models/Order.js";

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req, res) => {
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
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const updateData = { 
      paymentStatus: status,
    };
    
    // If status is cancelled, add cancellation reason and date
    if (status === "Cancelled") {
      updateData.cancelReason = reason || "No reason provided";
      updateData.cancelledAt = new Date();
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Status update failed" });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      "customer.email": req.params.email,
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Failed to fetch user orders" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: "Cancelled",
        cancelReason: reason || "No reason provided",
        cancelledAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ message: "Cancel failed" });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    
    const totalRevenueResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    
    const pendingOrders = await Order.countDocuments({ paymentStatus: "Pending" });
    const confirmedOrders = await Order.countDocuments({ paymentStatus: "Confirmed" });
    const paidOrders = await Order.countDocuments({ paymentStatus: "Paid" });
    const shippedOrders = await Order.countDocuments({ paymentStatus: "Shipped" });
    const deliveredOrders = await Order.countDocuments({ paymentStatus: "Delivered" });
    const cancelledOrders = await Order.countDocuments({ paymentStatus: "Cancelled" });
    
    res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      confirmedOrders,
      paidOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, status, reason } = req.body;
    
    if (!orderIds || !orderIds.length) {
      return res.status(400).json({ message: "No order IDs provided" });
    }
    
    const updateData = { paymentStatus: status };
    
    if (status === "Cancelled") {
      updateData.cancelReason = reason || "Bulk cancellation";
      updateData.cancelledAt = new Date();
    }
    
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      updateData
    );
    
    res.json({ 
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Error in bulk update:", err);
    res.status(500).json({ message: "Bulk update failed" });
  }
};

export const deleteOrder = async (req, res) => {
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
};
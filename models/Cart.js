import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  discount: {
    code: String,
    amount: Number,
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model("Cart", cartSchema);
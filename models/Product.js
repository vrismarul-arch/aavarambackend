import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: String,
    rating: Number,
    comment: String,
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },

    // Main Image
    mainImage: { type: String, default: "" },

    // Legacy support for old products
    image: { type: String, default: "" },

    // Sub Images Array
    subImages: [{ type: String }],

    /* ===== TEXT CONTENT ===== */
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    ingredients: { type: String, default: "" },
    usage: { type: String, default: "" },
    disclaimer: { type: String, default: "" },

    /* ===== ADDITIONAL INFO ===== */
    weight: { type: String, default: "" },
    dimensions: { type: String, default: "" },

    /* ===== CATEGORIES (multi) ===== */
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    // Legacy single category (backward compat)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    bestSeller: { type: Boolean, default: false },

    /* ===== HEALTH TYPES (multi) ===== */
    healthTypes: [
      {
        type: String,
        enum: ["bestseller", "combo", "health"],
      },
    ],

    // Legacy single healthType (backward compat)
    healthType: {
      type: String,
      enum: ["bestseller", "combo", "health"],
      default: "health",
    },

    /* ===== REVIEWS ===== */
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
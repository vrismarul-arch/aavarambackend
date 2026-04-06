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

    /* ===== CATEGORY ===== */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    bestSeller: { type: Boolean, default: false },
    
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
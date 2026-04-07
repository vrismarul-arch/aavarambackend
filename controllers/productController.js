import Product from "../models/Product.js";
import supabase from "../config/supabase.js";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const formatProduct = (product) => ({
  ...product.toObject(),
  mainImage: product.mainImage || product.image || "",
  subImages: product.subImages || [],
  allImages: [product.mainImage || product.image, ...(product.subImages || [])].filter(Boolean),
  // Normalize: always expose arrays
  categories: product.categories?.length
    ? product.categories
    : product.category
    ? [product.category]
    : [],
  healthTypes: product.healthTypes?.length
    ? product.healthTypes
    : product.healthType
    ? [product.healthType]
    : ["health"],
});

const uploadToSupabase = async (file, folder) => {
  const fileExt = file.originalname.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(fileName, file.buffer, { contentType: file.mimetype, cacheControl: "3600" });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from("products").getPublicUrl(fileName);
  return data.publicUrl;
};

const populateProduct = (query) =>
  query.populate("category").populate("categories");

/* ─────────────────────────────────────────
   GET ALL PRODUCTS
───────────────────────────────────────── */
export const getProducts = async (req, res) => {
  try {
    const products = await populateProduct(
      Product.find().sort({ createdAt: -1 })
    );
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET SINGLE PRODUCT
───────────────────────────────────────── */
export const getProductById = async (req, res) => {
  try {
    const product = await populateProduct(Product.findById(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET BY CATEGORY
───────────────────────────────────────── */
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await populateProduct(
      Product.find({
        $or: [
          { categories: req.params.categoryId },
          { category: req.params.categoryId },
        ],
      })
    );
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET BESTSELLERS
───────────────────────────────────────── */
export const getBestsellers = async (req, res) => {
  try {
    const products = await populateProduct(
      Product.find({ bestSeller: true }).limit(10)
    );
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET BY HEALTH TYPE
───────────────────────────────────────── */
export const getProductsByHealthType = async (req, res) => {
  try {
    const products = await populateProduct(
      Product.find({
        $or: [
          { healthTypes: req.params.type },
          { healthType: req.params.type },
        ],
      }).limit(20)
    );
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   PARSE MULTI-VALUE FIELDS
───────────────────────────────────────── */
const parseArrayField = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return fallback;
  }
};

/* ─────────────────────────────────────────
   CREATE PRODUCT
───────────────────────────────────────── */
export const createProduct = async (req, res) => {
  try {
    const {
      name, price, category, healthType,
      shortDescription, description,
      ingredients, usage, disclaimer,
      weight, dimensions, bestSeller,
    } = req.body;

    // Parse multi-value fields; fall back to legacy single values
    const categoriesArr  = parseArrayField(req.body.categories,  category   ? [category]   : []);
    const healthTypesArr = parseArrayField(req.body.healthTypes, healthType ? [healthType] : ["health"]);

    // Validation
    if (!name || !price || !description) {
      return res.status(400).json({ message: "Name, price and description are required." });
    }
    if (categoriesArr.length === 0) {
      return res.status(400).json({ message: "At least one category is required." });
    }

    // Upload main image
    let mainImageUrl = "";
    if (req.files?.mainImage?.[0]) {
      mainImageUrl = await uploadToSupabase(req.files.mainImage[0], "main");
    }

    // Upload sub images
    let subImagesUrls = [];
    if (req.files?.subImages?.length) {
      for (const file of req.files.subImages) {
        subImagesUrls.push(await uploadToSupabase(file, "sub"));
      }
    }

    const product = await Product.create({
      name: name.trim(),
      price: Number(price),

      // Multi
      categories:  categoriesArr,
      healthTypes: healthTypesArr,

      // Legacy single (for old API consumers)
      category:   categoriesArr[0]  || null,
      healthType: healthTypesArr[0] || "health",

      shortDescription: shortDescription || "",
      description,
      ingredients:  ingredients  || "",
      usage:        usage        || "",
      disclaimer:   disclaimer   || "",
      weight:       weight       || "",
      dimensions:   dimensions   || "",
      mainImage:    mainImageUrl,
      image:        mainImageUrl,
      subImages:    subImagesUrls,
      bestSeller:   bestSeller === "true" || bestSeller === true,
    });

    const populated = await populateProduct(Product.findById(product._id));
    res.status(201).json(formatProduct(populated));
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   UPDATE PRODUCT
───────────────────────────────────────── */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name, price, category, healthType,
      shortDescription, description,
      ingredients, usage, disclaimer,
      weight, dimensions, bestSeller, existingSubImages,
    } = req.body;

    // Update text fields
    if (name)                           product.name             = name.trim();
    if (price)                          product.price            = Number(price);
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (description)                    product.description      = description;
    if (ingredients !== undefined)      product.ingredients      = ingredients;
    if (usage !== undefined)            product.usage            = usage;
    if (disclaimer !== undefined)       product.disclaimer       = disclaimer;
    if (weight !== undefined)           product.weight           = weight;
    if (dimensions !== undefined)       product.dimensions       = dimensions;
    if (bestSeller !== undefined)       product.bestSeller       = bestSeller === "true" || bestSeller === true;

    // Multi categories
    if (req.body.categories !== undefined) {
      const arr = parseArrayField(req.body.categories, category ? [category] : []);
      product.categories = arr;
      product.category   = arr[0] || product.category; // keep legacy in sync
    } else if (category) {
      product.category   = category;
      product.categories = [category];
    }

    // Multi health types
    if (req.body.healthTypes !== undefined) {
      const arr = parseArrayField(req.body.healthTypes, healthType ? [healthType] : []);
      product.healthTypes = arr;
      product.healthType  = arr[0] || product.healthType; // keep legacy in sync
    } else if (healthType) {
      product.healthType  = healthType;
      product.healthTypes = [healthType];
    }

    // Keep existing sub images that weren't removed in UI
    if (existingSubImages !== undefined) {
      try {
        product.subImages = JSON.parse(existingSubImages);
      } catch {
        product.subImages = [];
      }
    }

    // Upload new main image
    if (req.files?.mainImage?.[0]) {
      const url = await uploadToSupabase(req.files.mainImage[0], "main");
      product.mainImage = url;
      product.image     = url;
    }

    // Append new sub images
    if (req.files?.subImages?.length) {
      for (const file of req.files.subImages) {
        product.subImages.push(await uploadToSupabase(file, "sub"));
      }
    }

    const updated   = await product.save();
    const populated = await populateProduct(Product.findById(updated._id));
    res.json(formatProduct(populated));
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   DELETE PRODUCT
───────────────────────────────────────── */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const imagesToDelete = [];
    const extractPath = (url) => {
      const parts = url.split("/storage/v1/object/public/products/");
      return parts[1] || null;
    };

    if (product.mainImage) {
      const p = extractPath(product.mainImage);
      if (p) imagesToDelete.push(p);
    }
    (product.subImages || []).forEach((img) => {
      const p = extractPath(img);
      if (p) imagesToDelete.push(p);
    });

    if (imagesToDelete.length > 0) {
      const { error } = await supabase.storage.from("products").remove(imagesToDelete);
      if (error) console.error("Storage delete error:", error.message);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   ADD REVIEW
───────────────────────────────────────── */
export const addReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, rating, comment } = req.body;
    if (!name || !rating || !comment)
      return res.status(400).json({ message: "Name, rating, and comment are required" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    product.reviews.push({ name: name.trim(), rating: Number(rating), comment: comment.trim() });

    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = total / product.reviews.length;

    await product.save();
    res.json({ message: "Review added successfully", reviews: product.reviews, averageRating: product.averageRating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   DELETE REVIEW
───────────────────────────────────────── */
export const deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const idx = product.reviews.findIndex((r) => r._id.toString() === req.params.reviewId);
    if (idx === -1) return res.status(404).json({ message: "Review not found" });

    product.reviews.splice(idx, 1);
    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.averageRating = product.reviews.length ? total / product.reviews.length : 0;

    await product.save();
    res.json({ message: "Review deleted successfully", reviews: product.reviews, averageRating: product.averageRating });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   SEARCH PRODUCTS
───────────────────────────────────────── */
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Search query is required" });

    const products = await populateProduct(
      Product.find({
        $or: [
          { name:             { $regex: q, $options: "i" } },
          { description:      { $regex: q, $options: "i" } },
          { ingredients:      { $regex: q, $options: "i" } },
          { shortDescription: { $regex: q, $options: "i" } },
        ],
      }).limit(50)
    );

    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────
   BULK DELETE
───────────────────────────────────────── */
export const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0)
      return res.status(400).json({ message: "productIds array is required" });

    const products = await Product.find({ _id: { $in: productIds } });

    const imagesToDelete = [];
    products.forEach((p) => {
      const extractPath = (url) => {
        const parts = url.split("/storage/v1/object/public/products/");
        return parts[1] || null;
      };
      if (p.mainImage) {
        const path = extractPath(p.mainImage);
        if (path) imagesToDelete.push(path);
      }
      (p.subImages || []).forEach((img) => {
        const path = extractPath(img);
        if (path) imagesToDelete.push(path);
      });
    });

    if (imagesToDelete.length > 0) {
      const { error } = await supabase.storage.from("products").remove(imagesToDelete);
      if (error) console.error("Bulk storage delete error:", error.message);
    }

    await Product.deleteMany({ _id: { $in: productIds } });
    res.json({ message: `${productIds.length} products deleted successfully`, deletedCount: productIds.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
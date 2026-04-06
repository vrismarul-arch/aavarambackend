import Product from "../models/Product.js";
import supabase from "../config/supabase.js";

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ createdAt: -1 });
    
    // Format products for backward compatibility
    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || [],
      allImages: [product.mainImage || product.image, ...(product.subImages || [])].filter(Boolean)
    }));
    
    res.json(formattedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET SINGLE PRODUCT ================= */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const formattedProduct = {
      ...product.toObject(),
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || [],
      allImages: [product.mainImage || product.image, ...(product.subImages || [])].filter(Boolean)
    };

    res.json(formattedProduct);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET PRODUCTS BY CATEGORY ================= */
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
    }).populate("category");

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || [],
      allImages: [product.mainImage || product.image, ...(product.subImages || [])].filter(Boolean)
    }));

    res.json(formattedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET BESTSELLERS ================= */
export const getBestsellers = async (req, res) => {
  try {
    const products = await Product.find({ bestSeller: true })
      .populate("category")
      .limit(10);

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || []
    }));

    res.json(formattedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET PRODUCTS BY HEALTH TYPE ================= */
export const getProductsByHealthType = async (req, res) => {
  try {
    const { type } = req.params;
    const products = await Product.find({ healthType: type })
      .populate("category")
      .limit(20);

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || []
    }));

    res.json(formattedProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      shortDescription,
      description,
      ingredients,
      usage,
      disclaimer,
      weight,
      dimensions,
      bestSeller,
      healthType,
    } = req.body;

    let mainImageUrl = "";
    let subImagesUrls = [];

    /* ===== UPLOAD MAIN IMAGE ===== */
    if (req.files && req.files.mainImage) {
      const file = req.files.mainImage[0];
      const fileExt = file.originalname.split('.').pop();
      const fileName = `main/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error, data } = await supabase.storage
        .from("products")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600'
        });

      if (error) {
        console.error("Main image upload error:", error);
        return res.status(500).json({ message: `Main image upload failed: ${error.message}` });
      }

      const { data: publicUrlData } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      mainImageUrl = publicUrlData.publicUrl;
    }

    /* ===== UPLOAD SUB IMAGES ===== */
    if (req.files && req.files.subImages && req.files.subImages.length > 0) {
      for (let i = 0; i < req.files.subImages.length; i++) {
        const file = req.files.subImages[i];
        const fileExt = file.originalname.split('.').pop();
        const fileName = `sub/${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error } = await supabase.storage
          .from("products")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);
          subImagesUrls.push(publicUrlData.publicUrl);
        } else {
          console.error(`Sub image ${i} upload error:`, error);
        }
      }
    }

    const product = await Product.create({
      name: name.trim(),
      price: Number(price),
      category,
      shortDescription: shortDescription || "",
      description: description || "",
      ingredients: ingredients || "",
      usage: usage || "",
      disclaimer: disclaimer || "",
      weight: weight || "",
      dimensions: dimensions || "",
      mainImage: mainImageUrl,
      image: mainImageUrl, // Backward compatibility
      subImages: subImagesUrls,
      bestSeller: bestSeller === "true" || bestSeller === true,
      healthType: healthType || "health",
    });

    const populatedProduct = await Product.findById(product._id).populate("category");
    
    res.status(201).json({
      ...populatedProduct.toObject(),
      mainImage: populatedProduct.mainImage || populatedProduct.image,
      subImages: populatedProduct.subImages || []
    });

  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      price,
      category,
      shortDescription,
      description,
      ingredients,
      usage,
      disclaimer,
      weight,
      dimensions,
      bestSeller,
      healthType,
      existingSubImages,
      removeMainImage
    } = req.body;

    // Update basic fields
    if (name) product.name = name.trim();
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (description) product.description = description;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (usage !== undefined) product.usage = usage;
    if (disclaimer !== undefined) product.disclaimer = disclaimer;
    if (weight !== undefined) product.weight = weight;
    if (dimensions !== undefined) product.dimensions = dimensions;
    
    if (bestSeller !== undefined) {
      product.bestSeller = bestSeller === "true" || bestSeller === true;
    }
    
    if (healthType) product.healthType = healthType;

    // Handle main image removal
    if (removeMainImage === "true") {
      product.mainImage = "";
      product.image = "";
    }

    // Handle existing sub images
    if (existingSubImages) {
      try {
        const parsedExisting = JSON.parse(existingSubImages);
        product.subImages = parsedExisting;
      } catch (e) {
        product.subImages = [];
      }
    }

    /* ===== UPDATE MAIN IMAGE ===== */
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const file = req.files.mainImage[0];
      const fileExt = file.originalname.split('.').pop();
      const fileName = `main/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600'
        });

      if (!error) {
        const { data: publicUrlData } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
        
        product.mainImage = publicUrlData.publicUrl;
        product.image = publicUrlData.publicUrl;
      } else {
        console.error("Main image update error:", error);
      }
    }

    /* ===== ADD NEW SUB IMAGES ===== */
    if (req.files && req.files.subImages && req.files.subImages.length > 0) {
      for (let i = 0; i < req.files.subImages.length; i++) {
        const file = req.files.subImages[i];
        const fileExt = file.originalname.split('.').pop();
        const fileName = `sub/${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error } = await supabase.storage
          .from("products")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600'
          });

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from("products")
            .getPublicUrl(fileName);
          product.subImages.push(publicUrlData.publicUrl);
        }
      }
    }

    const updatedProduct = await product.save();
    const populatedProduct = await Product.findById(updatedProduct._id).populate("category");

    res.json({
      ...populatedProduct.toObject(),
      mainImage: populatedProduct.mainImage || populatedProduct.image,
      subImages: populatedProduct.subImages || []
    });

  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete images from Supabase storage
    const imagesToDelete = [];
    
    if (product.mainImage) {
      const mainImagePath = product.mainImage.split('/').pop();
      imagesToDelete.push(`main/${mainImagePath}`);
    }
    
    if (product.subImages && product.subImages.length > 0) {
      product.subImages.forEach(image => {
        const imagePath = image.split('/').pop();
        imagesToDelete.push(`sub/${imagePath}`);
      });
    }

    // Delete images from storage
    if (imagesToDelete.length > 0) {
      const { error } = await supabase.storage
        .from("products")
        .remove(imagesToDelete);
      
      if (error) {
        console.error("Error deleting images from storage:", error);
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });

  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= ADD REVIEW ================= */
export const addReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({ message: "Name, rating, and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    product.reviews.push({
      name: name.trim(),
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Calculate new average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.averageRating = totalRating / product.reviews.length;

    await product.save();

    res.json({
      message: "Review added successfully",
      reviews: product.reviews,
      averageRating: product.averageRating
    });

  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE REVIEW ================= */
export const deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviewIndex = product.reviews.findIndex(
      review => review._id.toString() === req.params.reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" });
    }

    product.reviews.splice(reviewIndex, 1);

    // Recalculate average rating
    if (product.reviews.length > 0) {
      const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
      product.averageRating = totalRating / product.reviews.length;
    } else {
      product.averageRating = 0;
    }

    await product.save();

    res.json({
      message: "Review deleted successfully",
      reviews: product.reviews,
      averageRating: product.averageRating
    });

  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= SEARCH PRODUCTS ================= */
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { ingredients: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } }
      ]
    }).populate("category").limit(50);

    const formattedProducts = products.map(product => ({
      ...product.toObject(),
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || []
    }));

    res.json(formattedProducts);

  } catch (err) {
    console.error("Search products error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= BULK DELETE PRODUCTS ================= */
export const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    
    // Collect all image paths for deletion
    const imagesToDelete = [];
    
    products.forEach(product => {
      if (product.mainImage) {
        const mainImagePath = product.mainImage.split('/').pop();
        imagesToDelete.push(`main/${mainImagePath}`);
      }
      
      if (product.subImages && product.subImages.length > 0) {
        product.subImages.forEach(image => {
          const imagePath = image.split('/').pop();
          imagesToDelete.push(`sub/${imagePath}`);
        });
      }
    });

    // Delete images from storage
    if (imagesToDelete.length > 0) {
      const { error } = await supabase.storage
        .from("products")
        .remove(imagesToDelete);
      
      if (error) {
        console.error("Error deleting bulk images:", error);
      }
    }

    // Delete products from database
    await Product.deleteMany({ _id: { $in: productIds } });

    res.json({ 
      message: `${productIds.length} products deleted successfully`,
      deletedCount: productIds.length
    });

  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ message: err.message });
  }
};
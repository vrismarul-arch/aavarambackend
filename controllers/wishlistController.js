import Wishlist from "../models/Wishlist.js";

// ✅ TOGGLE WISHLIST (Add/Remove)
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [productId],
      });
    } else {
      const exists = wishlist.products.includes(productId);

      if (exists) {
        wishlist.products = wishlist.products.filter(
          (id) => id.toString() !== productId
        );
      } else {
        wishlist.products.push(productId);
      }

      await wishlist.save();
    }

    // Populate products before sending response
    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: exists ? "Removed from wishlist" : "Added to wishlist",
      wishlist
    });

  } catch (error) {
    console.error("WISHLIST ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Wishlist error",
      error: error.message 
    });
  }
};

// ✅ GET USER WISHLIST
export const getUserWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate("products");

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        wishlist: { products: [], user: req.user._id }
      });
    }

    res.status(200).json({
      success: true,
      wishlist
    });

  } catch (error) {
    console.error("GET WISHLIST ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching wishlist",
      error: error.message 
    });
  }
};

// ✅ ADD TO WISHLIST (explicit add)
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [productId],
      });
    } else {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }

    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: "Added to wishlist",
      wishlist
    });

  } catch (error) {
    console.error("ADD TO WISHLIST ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Error adding to wishlist",
      error: error.message 
    });
  }
};

// ✅ REMOVE FROM WISHLIST (DELETE endpoint)
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: "Wishlist not found" 
      });
    }

    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(
      (id) => id.toString() !== productId
    );

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found in wishlist" 
      });
    }

    await wishlist.save();
    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      wishlist
    });

  } catch (error) {
    console.error("REMOVE FROM WISHLIST ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Error removing from wishlist",
      error: error.message 
    });
  }
};

// ✅ CLEAR ENTIRE WISHLIST
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false,
        message: "Wishlist not found" 
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      wishlist
    });

  } catch (error) {
    console.error("CLEAR WISHLIST ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Error clearing wishlist",
      error: error.message 
    });
  }
};

// ✅ CHECK IF PRODUCT IS IN WISHLIST
export const checkInWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });

    const isInWishlist = wishlist ? wishlist.products.includes(productId) : false;

    res.status(200).json({
      success: true,
      isInWishlist
    });

  } catch (error) {
    console.error("CHECK WISHLIST ERROR:", error);
    res.status(500).json({ 
      success: false,
      message: "Error checking wishlist",
      error: error.message 
    });
  }
};
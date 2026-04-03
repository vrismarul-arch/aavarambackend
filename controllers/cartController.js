import Cart from "../models/Cart.js";

// ✅ ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, qty: 1 }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].qty += 1;
      } else {
        cart.items.push({ product: productId, qty: 1 });
      }

      await cart.save();
    }

    await cart.populate("items.product");
    res.status(200).json(cart);

  } catch (error) {
    console.error("ADD CART ERROR:", error);
    res.status(500).json({ message: "Cart error" });
  }
};

// ✅ GET USER CART
export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product");

    res.status(200).json(cart);

  } catch (error) {
    console.error("GET CART ERROR:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
};

// ✅ INCREASE QUANTITY
export const increaseQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].qty += 1;
      await cart.save();
      await cart.populate("items.product");
      return res.status(200).json(cart);
    }

    return res.status(404).json({ message: "Item not found in cart" });

  } catch (error) {
    console.error("INCREASE QUANTITY ERROR:", error);
    res.status(500).json({ message: "Error increasing quantity" });
  }
};

// ✅ DECREASE QUANTITY
export const decreaseQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      if (cart.items[itemIndex].qty > 1) {
        cart.items[itemIndex].qty -= 1;
        await cart.save();
      } else {
        // Remove item if quantity becomes 0
        cart.items.splice(itemIndex, 1);
        await cart.save();
      }
      
      await cart.populate("items.product");
      return res.status(200).json(cart);
    }

    return res.status(404).json({ message: "Item not found in cart" });

  } catch (error) {
    console.error("DECREASE QUANTITY ERROR:", error);
    res.status(500).json({ message: "Error decreasing quantity" });
  }
};

// ✅ REMOVE CART ITEM
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json(cart);

  } catch (error) {
    console.error("REMOVE CART ITEM ERROR:", error);
    res.status(500).json({ message: "Error removing item" });
  }
};

// ✅ CLEAR ENTIRE CART - NEW FUNCTION
export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Clear all items from cart
    cart.items = [];
    await cart.save();

    res.status(200).json({ 
      message: "Cart cleared successfully",
      cart: { items: [], user: userId }
    });

  } catch (error) {
    console.error("CLEAR CART ERROR:", error);
    res.status(500).json({ message: "Error clearing cart" });
  }
};
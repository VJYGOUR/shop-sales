import Product from "../models/product.models.js";

// @desc    Create a product
// @route   POST /api/products
// @access  Private 🔑 CHANGED FROM PUBLIC
export const createProduct = async (req, res) => {
  try {
    // 🔑 ADD USER TO THE PRODUCT DATA
    const productData = {
      ...req.body,
      user: req.user._id, // THIS LINKS PRODUCT TO LOGGED-IN USER
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all products FOR LOGGED-IN USER
// @route   GET /api/products
// @access  Private 🔑 CHANGED FROM PUBLIC
export const getProducts = async (req, res) => {
  try {
    // 🔑 ONLY GET PRODUCTS THAT BELONG TO THE LOGGED-IN USER
    const products = await Product.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single product (only if user owns it)
// @route   GET /api/products/:id
// @access  Private 🔑 CHANGED FROM PUBLIC
export const getProduct = async (req, res) => {
  try {
    // 🔑 CHECK THAT PRODUCT BELONGS TO LOGGED-IN USER
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update product (only if user owns it)
// @route   PUT /api/products/:id
// @access  Private 🔑 CHANGED FROM PUBLIC
export const updateProduct = async (req, res) => {
  try {
    // 🔑 CHECK OWNERSHIP BEFORE UPDATING
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res) => {
  try {
    // 🔑 CHECK OWNERSHIP BEFORE DELETING
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
//
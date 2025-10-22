import Sale from "../models/sales.models.js";
import Product from "../models/product.models.js";

// @desc    Get all sales FOR LOGGED-IN USER
// @route   GET /api/sales
// @access  Private 🔑 CHANGED FROM PUBLIC
export const getSales = async (req, res) => {
  try {
    // 🔑 ONLY GET SALES THAT BELONG TO THE LOGGED-IN USER
    const sales = await Sale.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create a sale
// @route   POST /api/sales
// @access  Private 🔑 CHANGED FROM PUBLIC
export const createSale = async (req, res) => {
  try {
    const { productId, quantity, totalAmount, notes } = req.body;

    // 🔑 CHECK THAT PRODUCT BELONGS TO LOGGED-IN USER
    const product = await Product.findOne({
      _id: productId,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Not enough stock. Only ${product.stock} available.`,
      });
    }

    // Calculate values
    const salePrice = totalAmount / quantity;
    const costPrice = product.costPrice;
    const profit = totalAmount - costPrice * quantity;

    // Create sale WITH USER ID
    const sale = new Sale({
      productId,
      productName: product.name,
      quantity,
      totalAmount,
      salePrice,
      costPrice,
      profit,
      notes,
      user: req.user._id, // 🔑 ADD USER TO SALE
    });

    const savedSale = await sale.save();

    // Update stock
    product.stock -= quantity;
    await product.save();

    res.status(201).json({
      success: true,
      data: savedSale,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete a sale
// @route   DELETE /api/sales/:id
// @access  Private 🔑 CHANGED FROM PUBLIC
export const deleteSale = async (req, res) => {
  try {
    // 🔑 CHECK THAT SALE BELONGS TO LOGGED-IN USER
    const sale = await Sale.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: "Sale not found",
      });
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
export const getSale = async (req, res) => {
  try {
    // 🔑 CHECK THAT SALE BELONGS TO LOGGED-IN USER
    const sale = await Sale.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: "Sale not found",
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update a sale
// @route   PUT /api/sales/:id
// @access  Private
export const updateSale = async (req, res) => {
  try {
    // 🔑 CHECK THAT SALE BELONGS TO LOGGED-IN USER
    const sale = await Sale.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: "Sale not found",
      });
    }

    const updatedSale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: updatedSale,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

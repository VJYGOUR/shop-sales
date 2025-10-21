import Sale from "../models/sales.models.js";
import Product from "../models/product.models.js";
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });

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
export const createSale = async (req, res) => {
  try {
    const { productId, quantity, totalAmount, notes } = req.body;

    // Get the product
    const product = await Product.findById(productId);
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

    // Create sale
    const sale = new Sale({
      productId,
      productName: product.name,
      quantity,
      totalAmount,
      salePrice,
      costPrice,
      profit,
      notes,
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
// @access  Public
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

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

// Add this to your routes

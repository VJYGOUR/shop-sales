import React, { useState, useEffect } from "react";
import type { Product, ScanResult } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import BarcodeScanner from "../components/barcode/BarcodeScanner";

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number; // Optional custom price
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null); // Track which item is being edited
  const [tempPrice, setTempPrice] = useState<string>(""); // Temporary price input

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await productAPI.getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Handle barcode scan
  const handleScan = async (result: ScanResult) => {
    setShowScanner(false);

    if (result.success && result.product) {
      // Find the actual product from our database
      const actualProduct = products.find(
        (p) => p.sku === result.product?.sku || p._id === result.product?._id
      );

      if (actualProduct) {
        addToCart(actualProduct);
      } else {
        alert("❌ Product not found in inventory");
      }
    }
  };

  // Add product to cart (reusable function)
  const addToCart = (product: Product, customPrice?: number) => {
    // Check if product already in cart
    const existingItem = cart.find((item) => item.product._id === product._id);

    if (existingItem) {
      // Increase quantity
      setCart(
        cart.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                customPrice:
                  customPrice !== undefined ? customPrice : item.customPrice,
              }
            : item
        )
      );
    } else {
      // Add new item to cart
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          customPrice: customPrice !== undefined ? customPrice : undefined,
        },
      ]);
    }

    alert(`✅ Added: ${product.name} - ₹${customPrice || product.salePrice}`);
  };

  // Start editing price
  const startEditPrice = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setTempPrice(currentPrice.toString());
  };

  // Save edited price
  const savePrice = (productId: string) => {
    const price = parseFloat(tempPrice);
    if (isNaN(price) || price < 0) {
      alert("Please enter a valid price");
      return;
    }

    setCart(
      cart.map((item) =>
        item.product._id === productId ? { ...item, customPrice: price } : item
      )
    );
    setEditingPrice(null);
    setTempPrice("");
  };

  // Cancel editing price
  const cancelEditPrice = () => {
    setEditingPrice(null);
    setTempPrice("");
  };

  // Get final price for an item (custom or original)
  const getItemPrice = (item: CartItem): number => {
    return item.customPrice !== undefined
      ? item.customPrice
      : item.product.salePrice;
  };

  // Get final total for an item
  const getItemTotal = (item: CartItem): number => {
    return getItemPrice(item) * item.quantity;
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product._id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);

  const totalProfit = cart.reduce((sum, item) => {
    const cost = item.product.costPrice * item.quantity;
    const revenue = getItemTotal(item);
    return sum + (revenue - cost);
  }, 0);

  // Complete sale
  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      // Create sale records and update inventory
      for (const item of cart) {
        const finalPrice = getItemPrice(item);
        const saleData = {
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          salePrice: finalPrice, // Use custom price if set
          costPrice: item.product.costPrice,
          totalAmount: getItemTotal(item),
          profit: (finalPrice - item.product.costPrice) * item.quantity,
          notes:
            finalPrice !== item.product.salePrice
              ? `Custom price applied: ₹${finalPrice} (Original: ₹${item.product.salePrice})`
              : undefined,
        };

        // Record sale
        await saleAPI.createSale(saleData);

        // Update product stock (reduce inventory)
        const updatedProduct = {
          ...item.product,
          stock: item.product.stock - item.quantity,
        };
        await productAPI.updateProduct(item.product._id, updatedProduct);
      }

      alert(`✅ Sale completed! Total: ₹${subtotal.toFixed(2)}`);
      setCart([]); // Clear cart
      setEditingPrice(null);

      // Refresh products to get updated stock
      const updatedProducts = await productAPI.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("❌ Error completing sale");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Point of Sale
        </h1>
        <p className="text-gray-600">Scan barcodes to sell products</p>
      </div>

      {/* Scanner Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Barcode Scanner
            </h2>
            <p className="text-gray-600">Scan products to add to cart</p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            📱 Scan Product
          </button>
        </div>

        {/* Manual Product Selection (Backup) */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or select product manually:
          </label>
          <select
            onChange={(e) => {
              const product = products.find((p) => p._id === e.target.value);
              if (product) {
                addToCart(product);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a product...</option>
            {products.map((product) => (
              <option
                key={product._id}
                value={product._id}
                disabled={product.stock === 0}
              >
                {product.name} - ₹{product.salePrice}{" "}
                {product.stock === 0
                  ? "(Out of Stock)"
                  : `(${product.stock} available)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shopping Cart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Shopping Cart
        </h2>

        {cart.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">🛒</div>
            <p className="text-gray-600">Cart is empty</p>
            <p className="text-gray-500 text-sm">
              Scan products or select manually
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, index) => {
              const itemPrice = getItemPrice(item);
              const itemTotal = getItemTotal(item);
              const isCustomPrice = item.customPrice !== undefined;

              return (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {item.product.name}
                      {isCustomPrice && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          CUSTOM PRICE
                        </span>
                      )}
                    </p>

                    {/* Price Display/Edit */}
                    <div className="flex items-center space-x-2 mt-1">
                      {editingPrice === item.product._id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Enter price"
                            min="0"
                            step="0.01"
                          />
                          <button
                            onClick={() => savePrice(item.product._id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            ✅
                          </button>
                          <button
                            onClick={cancelEditPrice}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ❌
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            ₹{itemPrice.toFixed(2)} × {item.quantity} = ₹
                            {itemTotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() =>
                              startEditPrice(item.product._id, itemPrice)
                            }
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Edit price"
                          >
                            ✏️
                          </button>
                          {isCustomPrice && (
                            <button
                              onClick={() => {
                                setCart(
                                  cart.map((cartItem) =>
                                    cartItem.product._id === item.product._id
                                      ? { ...cartItem, customPrice: undefined }
                                      : cartItem
                                  )
                                );
                              }}
                              className="text-gray-600 hover:text-gray-800 text-xs"
                              title="Reset to original price"
                            >
                              🔄
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      Original: ₹{item.product.salePrice} | Stock:{" "}
                      {item.product.stock} →{" "}
                      {item.product.stock - item.quantity} | Cost: ₹
                      {item.product.costPrice}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            setCart(
                              cart.map((cartItem) =>
                                cartItem.product._id === item.product._id
                                  ? {
                                      ...cartItem,
                                      quantity: cartItem.quantity - 1,
                                    }
                                  : cartItem
                              )
                            );
                          }
                        }}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => {
                          if (item.quantity < item.product.stock) {
                            setCart(
                              cart.map((cartItem) =>
                                cartItem.product._id === item.product._id
                                  ? {
                                      ...cartItem,
                                      quantity: cartItem.quantity + 1,
                                    }
                                  : cartItem
                              )
                            );
                          } else {
                            alert("Not enough stock available!");
                          }
                        }}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Estimated Profit:</span>
                <span className="font-bold">₹{totalProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={completeSale}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mt-4"
            >
              ✅ Complete Sale (₹{subtotal.toFixed(2)})
            </button>
          </div>
        )}
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Sales;

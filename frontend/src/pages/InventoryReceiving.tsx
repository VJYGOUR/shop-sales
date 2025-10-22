import React, { useState, useEffect } from "react";
import type { Product, ScanResult } from "../types/index";
import { productAPI } from "../services/api";
import BarcodeScanner from "../components/barcode/BarcodeScanner";

const InventoryReceiving: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [receivingItems, setReceivingItems] = useState<
    { product: Product; quantity: number }[]
  >([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Handle barcode scan for receiving
  const handleScan = async (result: ScanResult) => {
    setShowScanner(false);

    if (result.success && result.product) {
      // Find the actual product from our database
      const actualProduct = products.find(
        (p) => p.sku === result.product?.sku || p._id === result.product?._id
      );

      if (actualProduct) {
        // Check if product already in receiving list
        const existingItem = receivingItems.find(
          (item) => item.product._id === actualProduct._id
        );

        if (existingItem) {
          // Increase quantity
          setReceivingItems(
            receivingItems.map((item) =>
              item.product._id === actualProduct._id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          );
        } else {
          // Add new item to receiving list
          setReceivingItems([
            ...receivingItems,
            { product: actualProduct, quantity: 1 },
          ]);
        }

        alert(`✅ Added to receiving: ${actualProduct.name}`);
      } else {
        alert("❌ Product not found in system. Please add product first.");
      }
    }
  };

  // Remove item from receiving list
  const removeFromReceiving = (productId: string) => {
    setReceivingItems(
      receivingItems.filter((item) => item.product._id !== productId)
    );
  };

  // Complete receiving - Add stock to inventory
  const completeReceiving = async () => {
    if (receivingItems.length === 0) {
      alert("No items to receive!");
      return;
    }

    try {
      // Update inventory for each item
      for (const item of receivingItems) {
        const updatedProduct = {
          ...item.product,
          stock: item.product.stock + item.quantity,
        };

        await productAPI.updateProduct(item.product._id, updatedProduct);
      }

      alert(
        `✅ Stock received! Added ${receivingItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        )} items to inventory`
      );
      setReceivingItems([]); // Clear receiving list

      // Refresh products to get updated stock
      const updatedProducts = await productAPI.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error("Error receiving stock:", error);
      alert("❌ Error receiving stock");
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
          Inventory Receiving
        </h1>
        <p className="text-gray-600">Scan products to add stock to inventory</p>
      </div>

      {/* Scanner Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Barcode Scanner
            </h2>
            <p className="text-gray-600">
              Scan products to add to receiving list
            </p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="mt-4 sm:mt-0 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            📱 Scan Incoming Stock
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
                const existingItem = receivingItems.find(
                  (item) => item.product._id === product._id
                );
                if (existingItem) {
                  setReceivingItems(
                    receivingItems.map((item) =>
                      item.product._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                    )
                  );
                } else {
                  setReceivingItems([
                    ...receivingItems,
                    { product, quantity: 1 },
                  ]);
                }
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select a product...</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name} - Current Stock: {product.stock}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Receiving List */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Receiving List
        </h2>

        {receivingItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-600">No items to receive</p>
            <p className="text-gray-500 text-sm">
              Scan products or select manually
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {receivingItems.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {item.product.stock} →{" "}
                    {item.product.stock + item.quantity}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) {
                          setReceivingItems(
                            receivingItems.map((receivingItem) =>
                              receivingItem.product._id === item.product._id
                                ? {
                                    ...receivingItem,
                                    quantity: receivingItem.quantity - 1,
                                  }
                                : receivingItem
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
                        setReceivingItems(
                          receivingItems.map((receivingItem) =>
                            receivingItem.product._id === item.product._id
                              ? {
                                  ...receivingItem,
                                  quantity: receivingItem.quantity + 1,
                                }
                              : receivingItem
                          )
                        );
                      }}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromReceiving(item.product._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {/* Complete Receiving Button */}
            <button
              onClick={completeReceiving}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mt-4"
            >
              ✅ Add Stock to Inventory (Auto-Increase Stock)
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

export default InventoryReceiving;

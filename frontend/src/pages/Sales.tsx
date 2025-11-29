import React, { useState, useEffect, useRef } from "react";
import type { Product, ScanResult } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import BarcodeScanner from "../components/barcode/BarcodeScanner";

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

const Sales: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await productAPI.getProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Search + Autocomplete
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProducts(filtered);
    setSuggestions(filtered.slice(0, 8));
    setShowSuggestions(true);
  }, [searchTerm, products]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scan handler
  const handleScan = async (result: ScanResult) => {
    setShowScanner(false);

    if (result.success && result.product) {
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

  // Add to cart
  const addToCart = (product: Product, customPrice?: number) => {
    const existingItem = cart.find((item) => item.product._id === product._id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                customPrice: customPrice ?? item.customPrice,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          customPrice: customPrice,
        },
      ]);
    }

    alert(`✅ Added: ${product.name} - ₹${customPrice || product.salePrice}`);
  };

  // Price editing
  const startEditPrice = (productId: string, currentPrice: number) => {
    setEditingPrice(productId);
    setTempPrice(currentPrice.toString());
  };

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

  const cancelEditPrice = () => {
    setEditingPrice(null);
    setTempPrice("");
  };

  const getItemPrice = (item: CartItem): number =>
    item.customPrice ?? item.product.salePrice;

  const getItemTotal = (item: CartItem): number =>
    getItemPrice(item) * item.quantity;

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product._id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemTotal(item), 0);

  const totalProfit = cart.reduce((sum, item) => {
    const cost = item.product.costPrice * item.quantity;
    const revenue = getItemTotal(item);
    return sum + (revenue - cost);
  }, 0);

  const completeSale = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    try {
      for (const item of cart) {
        const finalPrice = getItemPrice(item);

        const saleData = {
          productId: item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          salePrice: finalPrice,
          costPrice: item.product.costPrice,
          totalAmount: getItemTotal(item),
          profit: (finalPrice - item.product.costPrice) * item.quantity,
          notes:
            finalPrice !== item.product.salePrice
              ? `Custom price: ₹${finalPrice} (Original: ₹${item.product.salePrice})`
              : undefined,
        };

        await saleAPI.createSale(saleData);

        const updatedProduct = {
          ...item.product,
          stock: item.product.stock - item.quantity,
        };
        await productAPI.updateProduct(item.product._id, updatedProduct);
      }

      alert(`✅ Sale completed! Total: ₹${subtotal.toFixed(2)}`);
      setCart([]);
      setEditingPrice(null);

      setProducts(await productAPI.getProducts());
    } catch (error) {
      console.error("Error completing sale:", error);
      alert("❌ Error completing sale");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-cyan-200 font-medium">
            Loading POS...
          </div>
          <div className="text-sm text-cyan-400 mt-2">
            Getting your products ready
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Point of Sale
          </h1>
          <p className="text-gray-300 mt-2">
            Scan barcodes to sell products quickly
          </p>
        </div>

        {/* Scanner Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Barcode Scanner</h2>
              <p className="text-gray-300">
                Scan products to add to cart instantly
              </p>
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
            >
              📱 Scan Product
            </button>
          </div>

          {/* Search + Autocomplete */}
          <div className="space-y-6" ref={searchRef}>
            <div className="relative">
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Search Products
              </label>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, SKU, or category..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                onFocus={() => searchTerm && setShowSuggestions(true)}
              />

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((product) => (
                    <li
                      key={product._id}
                      onClick={() => {
                        addToCart(product);
                        setSearchTerm("");
                        setShowSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-b-0"
                    >
                      <span className="text-white">{product.name}</span>
                      <span className="text-cyan-400 text-sm font-medium">
                        ₹{product.salePrice}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {searchTerm && (
                <p className="text-sm text-cyan-400 mt-2">
                  Found {filteredProducts.length} product
                  {filteredProducts.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Manual Selection */}
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Select product manually
              </label>
              <select
                onChange={(e) => {
                  const product = products.find(
                    (p) => p._id === e.target.value
                  );
                  if (product) {
                    addToCart(product);
                    setSearchTerm("");
                  }
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
              >
                <option value="" className="bg-slate-800">
                  Select a product...
                </option>
                {filteredProducts.map((product) => (
                  <option
                    key={product._id}
                    value={product._id}
                    disabled={product.stock === 0}
                    className="bg-slate-800"
                  >
                    {product.name} - ₹{product.salePrice}{" "}
                    {product.stock === 0
                      ? "(Out of Stock)"
                      : `(${product.stock} available)`}{" "}
                    {product.sku && ` - SKU: ${product.sku}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Add Buttons */}
            {filteredProducts.length > 0 && filteredProducts.length <= 10 && (
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  Quick Add
                </label>
                <div className="flex flex-wrap gap-3">
                  {filteredProducts.slice(0, 6).map((product) => (
                    <button
                      key={product._id}
                      onClick={() => {
                        addToCart(product);
                        setSearchTerm("");
                      }}
                      disabled={product.stock === 0}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all duration-300 ${
                        product.stock === 0
                          ? "bg-gray-800/50 text-gray-500 border-gray-600 cursor-not-allowed"
                          : "bg-cyan-600/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-600/30 hover:border-cyan-400 hover:scale-105"
                      }`}
                    >
                      {product.name}{" "}
                      {product.stock > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          ({product.stock})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white mb-6">
            Shopping Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
          </h2>

          {cart.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <div className="text-6xl mb-4 opacity-50">🛒</div>
              <p className="text-gray-400 text-lg mb-2">Cart is empty</p>
              <p className="text-gray-500 text-sm">
                Scan products or select manually to get started
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
                    key={`${item.product._id}-${index}`}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-white text-lg">
                              {item.product.name}
                              {isCustomPrice && (
                                <span className="ml-3 text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                                  CUSTOM PRICE
                                </span>
                              )}
                            </p>

                            <div className="flex items-center space-x-3 mt-2">
                              {editingPrice === item.product._id ? (
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="number"
                                    value={tempPrice}
                                    onChange={(e) =>
                                      setTempPrice(e.target.value)
                                    }
                                    className="w-28 px-3 py-2 bg-white/5 border border-cyan-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => savePrice(item.product._id)}
                                    className="text-green-400 hover:text-green-300 text-lg transition-colors"
                                  >
                                    ✅
                                  </button>
                                  <button
                                    onClick={cancelEditPrice}
                                    className="text-red-400 hover:text-red-300 text-lg transition-colors"
                                  >
                                    ❌
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-3">
                                  <span className="text-cyan-300 font-medium">
                                    ₹{itemPrice.toFixed(2)} × {item.quantity} =
                                    ₹{itemTotal.toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() =>
                                      startEditPrice(
                                        item.product._id,
                                        itemPrice
                                      )
                                    }
                                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                  >
                                    ✏️ Edit Price
                                  </button>
                                  {isCustomPrice && (
                                    <button
                                      onClick={() =>
                                        setCart(
                                          cart.map((cartItem) =>
                                            cartItem.product._id ===
                                            item.product._id
                                              ? {
                                                  ...cartItem,
                                                  customPrice: undefined,
                                                }
                                              : cartItem
                                          )
                                        )
                                      }
                                      className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                                    >
                                      🔄 Reset
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            <p className="text-sm text-gray-400 mt-2">
                              Original: ₹{item.product.salePrice} | Stock:{" "}
                              {item.product.stock} →{" "}
                              {item.product.stock - item.quantity} | Cost: ₹
                              {item.product.costPrice}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end space-x-4">
                        <div className="flex items-center space-x-3">
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
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                          >
                            -
                          </button>

                          <span className="font-bold text-white w-8 text-center text-lg">
                            {item.quantity}
                          </span>

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
                            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${item.product.name} from cart?`
                              )
                            ) {
                              removeFromCart(item.product._id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 p-2 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-300">Subtotal:</span>
                  <span className="font-bold text-white">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-green-400">Estimated Profit:</span>
                  <span className="font-bold text-green-400">
                    ₹{totalProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t border-white/10 pt-3">
                  <span className="text-white">Total:</span>
                  <span className="text-cyan-400">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Complete Sale Button */}
              <button
                onClick={completeSale}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/25 hover:scale-105 transition-all duration-300 shadow-lg mt-6"
              >
                ✅ Complete Sale - ₹{subtotal.toFixed(2)}
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
    </div>
  );
};

export default Sales;

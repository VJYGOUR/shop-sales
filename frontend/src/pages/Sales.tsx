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

  // NEW — Autocomplete state
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
    setSuggestions(filtered.slice(0, 8)); // Show only top 8 like Google
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

        {/* Search + Google Autocomplete */}
        <div className="space-y-4" ref={searchRef}>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products:
            </label>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU, or category..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onFocus={() => searchTerm && setShowSuggestions(true)}
            />

            {/* GOOGLE-STYLE AUTOCOMPLETE */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                {suggestions.map((product) => (
                  <li
                    key={product._id}
                    onClick={() => {
                      addToCart(product);
                      setSearchTerm("");
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <span>{product.name}</span>
                    <span className="text-gray-500 text-sm">
                      ₹{product.salePrice}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {searchTerm && (
              <p className="text-sm text-gray-500 mt-1">
                Found {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Manual Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select product manually:
            </label>
            <select
              onChange={(e) => {
                const product = products.find((p) => p._id === e.target.value);
                if (product) {
                  addToCart(product);
                  setSearchTerm("");
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a product...</option>
              {filteredProducts.map((product) => (
                <option
                  key={product._id}
                  value={product._id}
                  disabled={product.stock === 0}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Add:
              </label>
              <div className="flex flex-wrap gap-2">
                {filteredProducts.slice(0, 6).map((product) => (
                  <button
                    key={product._id}
                    onClick={() => {
                      addToCart(product);
                      setSearchTerm("");
                    }}
                    disabled={product.stock === 0}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      product.stock === 0
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                    }`}
                  >
                    {product.name}{" "}
                    {product.stock > 0 && (
                      <span className="ml-1 text-xs">({product.stock})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------ CART + TOTALS + SCANNER MODAL (UNCHANGED) ------ */}
      {/* (Your full cart code continues exactly as before — unchanged) */}

      {/* Shopping Cart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Shopping Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
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
                  key={`${item.product._id}-${index}`}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 border border-gray-200 rounded-lg gap-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.product.name}
                          {isCustomPrice && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              CUSTOM PRICE
                            </span>
                          )}
                        </p>

                        <div className="flex items-center space-x-2 mt-1">
                          {editingPrice === item.product._id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                autoFocus
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
                              >
                                ✏️
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
                                  className="text-gray-600 hover:text-gray-800 text-xs"
                                >
                                  🔄
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Original: ₹{item.product.salePrice} | Stock:{" "}
                          {item.product.stock} →{" "}
                          {item.product.stock - item.quantity} | Cost: ₹
                          {item.product.costPrice}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
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

                      <span className="font-medium w-8 text-center">
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
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
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
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}

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

            <button
              onClick={completeSale}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 mt-4"
            >
              ✅ Complete Sale (₹{subtotal.toFixed(2)})
            </button>
          </div>
        )}
      </div>

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

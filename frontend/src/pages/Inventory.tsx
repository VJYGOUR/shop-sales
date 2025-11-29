import React, { useState, useEffect, useCallback } from "react";
import type { Product } from "../types/index";
import { exportToCSV, formatInventoryForExport } from "../utils/exportUtils";
import { productAPI } from "../services/api";
import { Link } from "react-router-dom";

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const loadInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      const productsData = await productAPI.getProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.category === categoryFilter
      );
    }

    if (stockFilter !== "all") {
      switch (stockFilter) {
        case "out-of-stock":
          filtered = filtered.filter((product) => product.stock === 0);
          break;
        case "low-stock":
          filtered = filtered.filter(
            (product) => product.stock > 0 && product.stock <= 5
          );
          break;
        case "in-stock":
          filtered = filtered.filter((product) => product.stock > 5);
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return {
        status: "Out of Stock",
        color: "bg-red-500/20 text-red-300 border-red-500/30",
      };
    if (stock <= 5)
      return {
        status: "Low Stock",
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      };
    return {
      status: "In Stock",
      color: "bg-green-500/20 text-green-300 border-green-500/30",
    };
  };

  const getCategories = () => {
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    return categories;
  };

  const getTotalInventoryValue = () => {
    return products.reduce(
      (total, product) => total + product.stock * product.costPrice,
      0
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-cyan-200 font-medium">
            Loading inventory...
          </div>
          <div className="text-sm text-cyan-400 mt-2">
            Counting your products
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Inventory Management
              </h1>
              <p className="text-gray-300">
                Manage your products and stock levels
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Add New Product
              </Link>
              <button
                onClick={() =>
                  exportToCSV(formatInventoryForExport(products), "inventory")
                }
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Products",
              value: products.length,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
              icon: "📦",
            },
            {
              label: "Inventory Value",
              value: `₹${getTotalInventoryValue().toFixed(2)}`,
              color: "text-green-400",
              bg: "bg-green-500/10",
              border: "border-green-500/20",
              icon: "💰",
            },
            {
              label: "Low Stock Items",
              value: products.filter((p) => p.stock > 0 && p.stock <= 5).length,
              color: "text-yellow-400",
              bg: "bg-yellow-500/10",
              border: "border-yellow-500/20",
              icon: "⚠️",
            },
            {
              label: "Out of Stock",
              value: products.filter((p) => p.stock === 0).length,
              color: "text-red-400",
              bg: "bg-red-500/10",
              border: "border-red-500/20",
              icon: "❌",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-all duration-300 ${stat.bg} ${stat.border}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className={`text-xl font-bold ${stat.color} mt-2`}>
                    {stat.value}
                  </p>
                </div>
                <div className="text-2xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
              >
                <option value="all" className="bg-slate-800">
                  All Categories
                </option>
                {getCategories().map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-slate-800"
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
              >
                <option value="all" className="bg-slate-800">
                  All Stock
                </option>
                <option value="in-stock" className="bg-slate-800">
                  In Stock
                </option>
                <option value="low-stock" className="bg-slate-800">
                  Low Stock
                </option>
                <option value="out-of-stock" className="bg-slate-800">
                  Out of Stock
                </option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStockFilter("all");
                }}
                className="w-full bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/10"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-xl font-bold text-white">
              Products ({filteredProducts.length})
            </h3>
            <span className="text-sm text-gray-400">
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {product.name}
                            </div>
                            {product.sku && (
                              <div className="text-sm text-gray-400">
                                SKU: {product.sku}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300">
                          {product.category || "Uncategorized"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {product.stock}
                            </span>
                            {product.stock <= 5 && product.stock > 0 && (
                              <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                                Low
                              </span>
                            )}
                            {product.stock === 0 && (
                              <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded-full border border-red-500/30">
                                Out
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300">
                          ₹{product.costPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-300">
                          ₹{product.salePrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}
                          >
                            {stockStatus.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-500 mb-4">📦</div>
              <p className="text-gray-400 text-lg mb-2">No products found</p>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or add new products
              </p>
              <Link
                to="/products"
                className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Add Your First Product
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;

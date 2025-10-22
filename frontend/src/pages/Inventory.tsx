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
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (stock <= 5)
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Inventory Management
            </h1>
            <p className="text-gray-600">
              Manage your products and stock levels
            </p>
          </div>
          <Link
            to="/products"
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add New Product
          </Link>

          <button
            onClick={() =>
              exportToCSV(formatInventoryForExport(products), "inventory")
            }
            className="mt-4 sm:mt-0 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors ml-2"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {products.length}
              </p>
            </div>
            <div className="text-2xl text-blue-500">📦</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Inventory Value
              </p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{getTotalInventoryValue().toFixed(2)}
              </p>
            </div>
            <div className="text-2xl text-green-500">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {products.filter((p) => p.stock > 0 && p.stock <= 5).length}
              </p>
            </div>
            <div className="text-2xl text-yellow-500">⚠️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-800">
                {products.filter((p) => p.stock === 0).length}
              </p>
            </div>
            <div className="text-2xl text-red-500">❌</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {getCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Status
            </label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setStockFilter("all");
              }}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Products ({filteredProducts.length})
          </h3>
          <span className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </span>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.sku && (
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.category || "Uncategorized"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {product.stock}
                          </span>
                          {product.stock <= 5 && product.stock > 0 && (
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                              Low
                            </span>
                          )}
                          {product.stock === 0 && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                              Out
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.costPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.salePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
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
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-2">No products found</p>
            <p className="text-gray-400 mb-4">
              Try adjusting your search or add new products
            </p>
            <Link
              to="/products"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;

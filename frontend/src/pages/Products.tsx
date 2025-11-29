import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import type { Product, CreateProductData } from "../types/index";
import { productAPI } from "../services/api";
import Button from "../components/ui/Button";
import { usePlanLimits } from "../utils/usePlanLimits";

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockUpdate, setStockUpdate] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");

  const { checkProductLimit } = usePlanLimits();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductData>();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Filter products based on search term
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

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

  const onSubmit = async (data: CreateProductData) => {
    try {
      if (!checkProductLimit(products.length)) {
        alert(
          `Free plan limit reached! Upgrade to add more than ${products.length} products.`
        );
        return;
      }

      await productAPI.createProduct(data);
      setShowForm(false);
      reset();
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product: " + (error as Error).message);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await productAPI.deleteProduct(productId);
      setDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product: " + (error as Error).message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    reset();
  };

  const handleAddStock = (productId: string) => {
    setEditingStock(productId);
    setStockUpdate(0);
  };

  const handleStockUpdate = async (productId: string) => {
    try {
      const product = products.find((p) => p._id === productId);
      if (!product) return;

      const newStock = product.stock + stockUpdate;
      if (newStock < 0) {
        alert("Stock cannot be negative");
        return;
      }

      await productAPI.updateProduct(productId, { stock: newStock });
      setEditingStock(null);
      setStockUpdate(0);
      loadProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Error updating stock: " + (error as Error).message);
    }
  };

  const handleCancelStockUpdate = () => {
    setEditingStock(null);
    setStockUpdate(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-cyan-200 font-medium">
            Loading products...
          </div>
          <div className="text-sm text-cyan-400 mt-2">
            Getting your inventory ready
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Product Inventory
              </h1>
              <p className="text-gray-300">
                Manage your Stoq inventory and track stock levels
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  placeholder="Search products by name, category, or SKU..."
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <Button
                onClick={() => {
                  reset();
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                + Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">
              Add New Product
            </h2>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="flex flex-col">
                <label className="mb-3 font-medium text-cyan-300 text-sm">
                  Product Name *
                </label>
                <input
                  {...register("name", {
                    required: "Product name is required",
                  })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <span className="text-red-400 text-sm mt-2">
                    {errors.name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-3 font-medium text-cyan-300 text-sm">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  {...register("stock", {
                    required: "Stock quantity is required",
                    min: { value: 0, message: "Stock cannot be negative" },
                  })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  placeholder="0"
                />
                {errors.stock && (
                  <span className="text-red-400 text-sm mt-2">
                    {errors.stock.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-3 font-medium text-cyan-300 text-sm">
                  Category (Optional)
                </label>
                <input
                  {...register("category")}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  placeholder="Enter category"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-3 font-medium text-cyan-300 text-sm">
                  Cost Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("costPrice", {
                    required: "Cost price is required",
                    min: { value: 0, message: "Cost price cannot be negative" },
                  })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  placeholder="0.00"
                />
                {errors.costPrice && (
                  <span className="text-red-400 text-sm mt-2">
                    {errors.costPrice.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-3 font-medium text-cyan-300 text-sm">
                  Sale Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("salePrice", {
                    required: "Sale price is required",
                    min: { value: 0, message: "Sale price cannot be negative" },
                  })}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  placeholder="0.00"
                />
                {errors.salePrice && (
                  <span className="text-red-400 text-sm mt-2">
                    {errors.salePrice.message}
                  </span>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Create Product
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 hover:scale-105 transition-all duration-300 border border-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          {/* Search Results Info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-cyan-300 font-medium">
                {searchTerm ? (
                  <>
                    Found {filteredProducts.length} product
                    {filteredProducts.length !== 1 ? "s" : ""} matching "
                    {searchTerm}"
                  </>
                ) : (
                  <>Total Products: {filteredProducts.length}</>
                )}
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 sm:mt-0 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Sale
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProducts.map((product) => (
                  <tr
                    key={product._id}
                    className={`hover:bg-white/5 transition-colors ${
                      product.stock === 0 ? "bg-red-500/10" : ""
                    }`}
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={
                            product.images.find((img) => img.isPrimary)?.url ||
                            product.images[0].url
                          }
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                      {product.sku && (
                        <div className="text-sm text-gray-400">
                          {product.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {editingStock === product._id ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <input
                            type="number"
                            value={stockUpdate}
                            onChange={(e) =>
                              setStockUpdate(Number(e.target.value))
                            }
                            className="w-full sm:w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            placeholder="+/- stock"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleStockUpdate(product._id)}
                              className="px-3 py-2 text-xs bg-cyan-600 hover:bg-cyan-700"
                            >
                              Update
                            </Button>
                            <Button
                              onClick={handleCancelStockUpdate}
                              className="px-3 py-2 text-xs bg-white/10 hover:bg-white/20"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              product.stock === 0
                                ? "bg-red-500/20 text-red-300"
                                : product.stock <= 5
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-green-500/20 text-green-300"
                            }`}
                          >
                            {product.stock} {product.stock === 0 ? "(Out)" : ""}
                          </span>
                          <Button
                            onClick={() => handleAddStock(product._id)}
                            className="px-3 py-1 text-xs bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30"
                          >
                            Add Stock
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                      ₹{product.costPrice.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
                      ₹{product.salePrice.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {product.category || "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          to={`/products/edit/${product._id}`}
                          className="inline-flex items-center px-4 py-2 border border-cyan-500/30 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                        >
                          Edit
                        </Link>
                        <Button
                          onClick={() => setDeleteConfirm(product._id)}
                          className="px-4 py-2 text-xs bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📦</div>
              <div className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm ? "No products found" : "No products yet"}
              </div>
              <div className="text-sm text-gray-500">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Add your first product to get started"}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 max-w-sm w-full">
              <h3 className="text-lg font-bold text-white mb-2">
                Confirm Delete
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this product? This action cannot
                be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import type { Product, CreateProductData } from "../types/index";
import { productAPI } from "../services/api";
import Button from "../components/ui/Button";
import { usePlanLimits } from "../utils/usePlanLimits";

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockUpdate, setStockUpdate] = useState<number>(0);

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
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Products
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your Stoq inventory
          </p>
        </div>
        <Button
          onClick={() => {
            reset();
            setShowForm(true);
          }}
          className="w-full sm:w-auto text-center"
        >
          Add Product
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Product Name *
              </label>
              <input
                {...register("name", { required: "Product name is required" })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter product name"
              />
              {errors.name && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                SKU (Optional)
              </label>
              <input
                {...register("sku")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter SKU"
              />
            </div> */}

            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Stock Quantity *
              </label>
              <input
                type="number"
                {...register("stock", {
                  required: "Stock quantity is required",
                  min: { value: 0, message: "Stock cannot be negative" },
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0"
              />
              {errors.stock && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.stock.message}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Category (Optional)
              </label>
              <input
                {...register("category")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter category"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Cost Price *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("costPrice", {
                  required: "Cost price is required",
                  min: { value: 0, message: "Cost price cannot be negative" },
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
              />
              {errors.costPrice && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.costPrice.message}
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Sale Price *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("salePrice", {
                  required: "Sale price is required",
                  min: { value: 0, message: "Sale price cannot be negative" },
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
              />
              {errors.salePrice && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.salePrice.message}
                </span>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button type="submit" className="w-full sm:w-auto text-center">
                Create Product
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                className="w-full sm:w-auto text-center"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr
                  key={product._id}
                  className={product.stock === 0 ? "bg-red-50" : ""}
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={
                          product.images.find((img) => img.isPrimary)?.url ||
                          product.images[0].url
                        }
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    {product.sku && (
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {editingStock === product._id ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="number"
                          value={stockUpdate}
                          onChange={(e) =>
                            setStockUpdate(Number(e.target.value))
                          }
                          className="w-full sm:w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="+/- stock"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleStockUpdate(product._id)}
                            className="px-2 py-1 text-xs flex-1"
                          >
                            Update
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handleCancelStockUpdate}
                            className="px-2 py-1 text-xs flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stock === 0
                              ? "bg-red-100 text-red-800"
                              : product.stock <= 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {product.stock} {product.stock === 0 ? "(Out)" : ""}
                        </span>
                        <Button
                          onClick={() => handleAddStock(product._id)}
                          className="px-2 py-1 text-xs"
                        >
                          Add Stock
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs.{product.costPrice.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs.{product.salePrice.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category || "-"}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                      <Button
                        onClick={() => setDeleteConfirm(product._id)}
                        variant="danger"
                        className="px-3 py-1 text-xs"
                      >
                        Delete
                      </Button>
                    </div>

                    {deleteConfirm === product._id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-4">
                          <h3 className="text-lg font-semibold mb-2">
                            Confirm Delete
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Are you sure you want to delete "{product.name}"?
                            This action cannot be undone.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleDelete(product._id)}
                              variant="danger"
                              className="flex-1"
                            >
                              Delete
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirm(null)}
                              variant="secondary"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;

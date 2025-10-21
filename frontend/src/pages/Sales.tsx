import React, { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Sale, Product } from "../types";
import { saleAPI, productAPI } from "../services/api";
import Button from "../components/ui/Button";

interface SaleFormData {
  productId: string;
  quantity: number;
  totalAmount: number;
  notes?: string;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SaleFormData>();

  const watchQuantity = useWatch({
    control,
    name: "quantity",
    defaultValue: 1,
  });
  const watchTotalAmount = useWatch({
    control,
    name: "totalAmount",
    defaultValue: 0,
  });
  const watchProductId = useWatch({ control, name: "productId" });

  useEffect(() => {
    console.log("🔄 Sales component mounted, loading data...");
    loadData();
  }, []);

  useEffect(() => {
    if (watchProductId && products.length > 0) {
      const product = products.find((p) => p._id === watchProductId);
      setSelectedProduct(product || null);
    }
  }, [watchProductId, products]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("📡 Fetching data...");

      const productsData = await productAPI.getProducts();
      setProducts(productsData);
      console.log("✅ Products loaded:", productsData.length);

      try {
        const salesData = await saleAPI.getSales();
        setSales(salesData);
        console.log("💰 Sales loaded:", salesData.length);
      } catch (salesError) {
        console.log("⚠️ Sales API not available yet", salesError);
        setSales([]);
      }
    } catch (error) {
      console.error("❌ Error in loadData:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SaleFormData) => {
    try {
      if (!selectedProduct) {
        alert("Please select a product");
        return;
      }

      if (data.quantity > selectedProduct.stock) {
        alert(`Not enough stock! Only ${selectedProduct.stock} available.`);
        return;
      }

      await saleAPI.createSale(data);
      setShowForm(false);
      reset();
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Error creating sale: " + (error as Error).message);
    }
  };

  // Add delete sale function
  const handleDeleteSale = async (saleId: string) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      try {
        // You'll need to add this to your saleAPI
        await saleAPI.deleteSale(saleId);
        loadData(); // Reload data after deletion
      } catch (error) {
        console.error("Error deleting sale:", error);
        alert("Error deleting sale: " + (error as Error).message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    reset();
    setSelectedProduct(null);
  };

  const calculateProfit = () => {
    if (!selectedProduct || !watchQuantity || !watchTotalAmount) return 0;
    const totalCost = selectedProduct.costPrice * (watchQuantity || 0);
    return (watchTotalAmount || 0) - totalCost;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading sales...</div>
      </div>
    );
  }

  console.log("🎯 Rendering - Products:", products.length);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Sales</h1>
          <p className="text-gray-600 text-sm sm:text-base">Record and view your sales</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto text-center"
        >
          Record Sale
        </Button>
      </div>

      {/* Record Sale Form */}
      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <h2 className="text-xl font-semibold mb-4">Record New Sale</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Product Selection */}
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Product *
              </label>
              <select
                {...register("productId", { required: "Product is required" })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} (Stock: {product.stock}) - Rs.
                    {product.salePrice}
                  </option>
                ))}
              </select>
              {errors.productId && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.productId.message}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Quantity *
              </label>
              <input
                type="number"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="1"
              />
              {errors.quantity && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.quantity.message}
                </span>
              )}
            </div>

            {/* Total Amount (Manual Entry) */}
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Total Sale Amount *
              </label>
              <input
                type="number"
                step="0.01"
                {...register("totalAmount", {
                  required: "Total amount is required",
                  min: { value: 0, message: "Amount cannot be negative" },
                })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
              />
              {errors.totalAmount && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.totalAmount.message}
                </span>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col">
              <label className="mb-2 font-medium text-gray-700 text-sm sm:text-base">
                Notes (Optional)
              </label>
              <input
                {...register("notes")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Any notes about this sale"
              />
            </div>

            {/* Calculation Display */}
            {selectedProduct && (
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Sale Calculation</h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>Cost per item:</div>
                  <div>${selectedProduct.costPrice.toFixed(2)}</div>
                  <div>Total Cost:</div>
                  <div>
                    $
                    {(selectedProduct.costPrice * (watchQuantity || 0)).toFixed(
                      2
                    )}
                  </div>
                  <div>Total Sale:</div>
                  <div>Rs.{Number(watchTotalAmount || 0).toFixed(2)}</div>
                  <div className="font-semibold">Profit:</div>
                  <div
                    className={`font-semibold ${
                      calculateProfit() >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    Rs.{Number(calculateProfit()).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button type="submit" className="w-full sm:w-auto text-center">
                Record Sale
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

      {/* Sales List with Delete Button */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {sale.productName}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.quantity}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rs.{sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span
                      className={
                        sale.profit >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      Rs.{sale.profit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteSale(sale._id)}
                      className="px-2 sm:px-3 py-1 text-xs"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sales recorded yet. Record your first sale to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
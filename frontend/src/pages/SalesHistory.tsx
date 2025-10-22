import React, { useState, useEffect } from "react";
import type { Sale, Product } from "../types/index";
import { saleAPI, productAPI } from "../services/api";

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load sales and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [salesData, productsData] = await Promise.all([
          saleAPI.getSales(),
          productAPI.getProducts(),
        ]);
        setSales(salesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Delete sale and restore inventory
  const deleteSale = async (sale: Sale) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this sale?\n${sale.productName} - ${sale.quantity} units`
      )
    ) {
      return;
    }

    setDeletingId(sale._id);

    try {
      // 1. Restore product inventory
      const product = products.find((p) => p._id === sale.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock + sale.quantity,
        };
        await productAPI.updateProduct(product._id, updatedProduct);
      }

      // 2. Delete the sale record
      await saleAPI.deleteSale(sale._id);

      // 3. Update local state
      setSales(sales.filter((s) => s._id !== sale._id));

      // 4. Refresh products to show updated stock
      const updatedProducts = await productAPI.getProducts();
      setProducts(updatedProducts);

      alert(`✅ Sale deleted and inventory restored!`);
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("❌ Error deleting sale");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading sales history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Sales History
        </h1>
        <p className="text-gray-600">
          View and manage all sales. Delete sales to restore inventory.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800">{sales.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(
              sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
            )}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <p className="text-sm font-medium text-gray-600">Total Profit</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(sales.reduce((sum, sale) => sum + sale.profit, 0))}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
          <p className="text-sm font-medium text-gray-600">Items Sold</p>
          <p className="text-2xl font-bold text-gray-800">
            {sales.reduce((sum, sale) => sum + sale.quantity, 0)}
          </p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Recent Sales ({sales.length})
          </h3>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💰</div>
            <p className="text-gray-500 text-lg mb-2">No sales yet</p>
            <p className="text-gray-400">Start making sales to see them here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {sale.productName}
                        </div>
                        {sale.notes && (
                          <div className="text-xs text-gray-500">
                            {sale.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.date || sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sale.salePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {formatCurrency(sale.profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => deleteSale(sale)}
                        disabled={deletingId === sale._id}
                        className={`text-red-600 hover:text-red-800 font-medium ${
                          deletingId === sale._id
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {deletingId === sale._id ? "Deleting..." : "🗑️ Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          ⚠️ Important Information
        </h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>
            • Deleting a sale will restore the product inventory automatically
          </li>
          <li>• This action cannot be undone</li>
          <li>• Use this for correcting mistakes or returns</li>
          <li>• Sales reports will update immediately after deletion</li>
        </ul>
      </div>
    </div>
  );
};

export default SalesHistory;

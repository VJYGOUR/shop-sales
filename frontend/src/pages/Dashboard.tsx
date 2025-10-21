import React, { useState, useEffect } from "react";
import type { DashboardStats, Product } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import Button from "../components/ui/Button";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalProfit: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // For MVP, we'll calculate stats from products and sales
      const [products, sales] = await Promise.all([
        productAPI.getProducts(),
        saleAPI.getSales(),
      ]);

      // Calculate stats
      const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
      const outOfStockCount = products.filter((p) => p.stock === 0).length;
      const lowStockProducts = products.filter(
        (p) => p.stock > 0 && p.stock <= 5
      );

      setStats({
        totalSales,
        totalProfit,
        outOfStockCount,
        lowStockCount: lowStockProducts.length,
      });
      setLowStockProducts(lowStockProducts);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Overview of your sales and inventory
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">
            Total Sales
          </h3>
          <p className="text-xl sm:text-3xl font-bold text-gray-800">
            Rs.{stats.totalSales.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">
            Total Profit
          </h3>
          <p className="text-xl sm:text-3xl font-bold text-gray-800">
            Rs.{stats.totalProfit.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">
            Out of Stock
          </h3>
          <p className="text-xl sm:text-3xl font-bold text-gray-800">
            {stats.outOfStockCount}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">
            Low Stock
          </h3>
          <p className="text-xl sm:text-3xl font-bold text-gray-800">
            {stats.lowStockCount}
          </p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 sm:mb-4">
            ⚠️ Low Stock Alert
          </h3>
          <div className="grid gap-2">
            {lowStockProducts.map((product) => (
              <div
                key={product._id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"
              >
                <span className="font-medium text-sm sm:text-base">
                  {product.name}
                </span>
                <span className="text-yellow-700 text-sm sm:text-base">
                  Only {product.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            onClick={() => (window.location.href = "/sales")}
            className="w-full sm:w-auto text-center"
          >
            Record New Sale
          </Button>
          <Button
            onClick={() => (window.location.href = "/products")}
            variant="secondary"
            className="w-full sm:w-auto text-center"
          >
            Manage Products
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

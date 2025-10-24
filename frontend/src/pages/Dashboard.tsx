import React, { useState, useEffect, useCallback } from "react";
import type { DashboardStats, Product, Sale } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import { Link } from "react-router-dom";
import ChartsContainer from "../components/charts/ChartsContainer";
import { useAuth } from "../utils/AuthContext"; // ADD THIS
import { PLANS } from "../utils/plans"; // ADD THIS

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalProfit: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    dailySales: 0,
    monthlySales: 0,
    dailyProfit: 0,
    monthlyProfit: 0,
  });
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(true);

  // ADD THIS HOOK
  const { user } = useAuth();

  const calculateDailyAndMonthlyStats = (sales: Sale[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailySales = sales
      .filter((sale) => {
        const saleDate = new Date(sale.date || sale.createdAt);
        return saleDate >= today;
      })
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    const monthlySales = sales
      .filter((sale) => {
        const saleDate = new Date(sale.date || sale.createdAt);
        return saleDate >= firstDayOfMonth;
      })
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    const dailyProfit = sales
      .filter((sale) => {
        const saleDate = new Date(sale.date || sale.createdAt);
        return saleDate >= today;
      })
      .reduce((sum, sale) => sum + sale.profit, 0);

    const monthlyProfit = sales
      .filter((sale) => {
        const saleDate = new Date(sale.date || sale.createdAt);
        return saleDate >= firstDayOfMonth;
      })
      .reduce((sum, sale) => sum + sale.profit, 0);

    return { dailySales, monthlySales, dailyProfit, monthlyProfit };
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [products, sales] = await Promise.all([
        productAPI.getProducts(),
        saleAPI.getSales(),
      ]);

      setAllProducts(products);
      setAllSales(sales);

      const { dailySales, monthlySales, dailyProfit, monthlyProfit } =
        calculateDailyAndMonthlyStats(sales);

      const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
      const outOfStockCount = products.filter((p) => p.stock === 0).length;
      const lowStockCount = products.filter(
        (p) => p.stock > 0 && p.stock <= 5
      ).length;

      setStats({
        totalSales,
        totalProfit,
        outOfStockCount,
        lowStockCount,
        dailySales,
        monthlySales,
        dailyProfit,
        monthlyProfit,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
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
              Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of your business performance
            </p>
          </div>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {showCharts ? "Hide Charts" : "Show Charts"}
          </button>
        </div>
      </div>

      {/* ADD PLAN STATUS SECTION */}
      {user && user.plan && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div
            className={`p-4 rounded-lg ${
              user.plan === "free"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3
                  className={`font-semibold ${
                    user.plan === "free" ? "text-yellow-800" : "text-green-800"
                  }`}
                >
                  Current Plan: {PLANS[user.plan]?.name || user.plan}
                </h3>
                <p
                  className={`text-sm ${
                    user.plan === "free" ? "text-yellow-700" : "text-green-700"
                  }`}
                >
                  {user.plan === "free"
                    ? `Limit: ${PLANS.free.limits.maxProducts} products • Upgrade for more features`
                    : "Full access to all features"}
                </p>
              </div>
              {user.plan === "free" && (
                <Link
                  to="/billing"
                  className="mt-2 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - YOUR EXISTING CODE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₹{stats.dailySales.toFixed(2)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Profit: ₹{stats.dailyProfit.toFixed(2)}
              </p>
            </div>
            <div className="text-2xl text-blue-500">📊</div>
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₹{stats.monthlySales.toFixed(2)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Profit: ₹{stats.monthlyProfit.toFixed(2)}
              </p>
            </div>
            <div className="text-2xl text-green-500">💰</div>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Alerts</p>
              <div className="flex space-x-4 mt-2">
                <div>
                  <p className="text-xl font-bold text-gray-800">
                    {stats.outOfStockCount}
                  </p>
                  <p className="text-xs text-gray-500">Out of Stock</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">
                    {stats.lowStockCount}
                  </p>
                  <p className="text-xs text-gray-500">Low Stock</p>
                </div>
              </div>
            </div>
            <div className="text-2xl text-red-500">⚠️</div>
          </div>
        </div>

        {/* Total Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">All Time</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                ₹{stats.totalSales.toFixed(2)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Profit: ₹{stats.totalProfit.toFixed(2)}
              </p>
            </div>
            <div className="text-2xl text-purple-500">🎯</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {showCharts && allSales.length > 0 && (
        <ChartsContainer sales={allSales} products={allProducts} />
      )}

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>
        <div className="space-y-3">
          <Link
            to="/sales"
            className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl mr-3">💰</span>
            <span className="font-medium text-blue-800">Record Sale</span>
          </Link>
          <Link
            to="/products"
            className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-xl mr-3">📦</span>
            <span className="font-medium text-green-800">Add Product</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

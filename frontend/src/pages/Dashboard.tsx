import React, { useState, useEffect, useCallback } from "react";
import type { DashboardStats, Product, Sale } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import { Link } from "react-router-dom";
import ChartsContainer from "../components/charts/ChartsContainer";
import { useAuth } from "../utils/AuthContext";
import { PLANS } from "../utils/plans";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-cyan-200 font-medium">
            Loading your dashboard...
          </div>
          <div className="text-sm text-cyan-400 mt-2">
            Crunching the numbers
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Enhanced Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Business Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Real-time overview of your business performance
              </p>
            </div>
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="mt-4 sm:mt-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
            >
              {showCharts ? "📊 Hide Charts" : "📈 Show Charts"}
            </button>
          </div>
        </div>

        {/* Enhanced Plan Status Section */}
        {user && user.plan && (
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl p-1 shadow-2xl border border-white/10">
            <div
              className={`rounded-xl p-6 ${
                user.plan === "free"
                  ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-400/30"
                  : "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full animate-pulse ${
                        user.plan === "free" ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    ></div>
                    <h3
                      className={`text-xl font-bold ${
                        user.plan === "free"
                          ? "text-amber-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {PLANS[user.plan]?.name || user.plan} Plan
                    </h3>
                  </div>
                  <p
                    className={`text-sm ${
                      user.plan === "free"
                        ? "text-amber-400/80"
                        : "text-emerald-400/80"
                    }`}
                  >
                    {user.plan === "free"
                      ? `Limited to ${PLANS.free.limits.maxProducts} products • Upgrade to unlock advanced features`
                      : "✨ Full access to all premium features"}
                  </p>
                </div>
                {user.plan === "free" && (
                  <Link
                    to="/billing"
                    className="mt-4 sm:mt-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    🚀 Upgrade Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Sales */}
          <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 hover:border-cyan-400/30 hover:scale-105 transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-cyan-300 uppercase tracking-wide">
                  Today's Sales
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹{stats.dailySales.toFixed(2)}
                </p>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
                  ₹{stats.dailyProfit.toFixed(2)} profit
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                📊
              </div>
            </div>
          </div>

          {/* Monthly Sales */}
          <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 hover:border-green-400/30 hover:scale-105 transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-green-300 uppercase tracking-wide">
                  This Month
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹{stats.monthlySales.toFixed(2)}
                </p>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
                  ₹{stats.monthlyProfit.toFixed(2)} profit
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                💰
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 hover:border-red-400/30 hover:scale-105 transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-red-300 uppercase tracking-wide">
                  Stock Alerts
                </p>
                <div className="flex space-x-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {stats.outOfStockCount}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      Out of Stock
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">
                      {stats.lowStockCount}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      Low Stock
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                ⚠️
              </div>
            </div>
          </div>

          {/* Total Performance */}
          <div className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 hover:border-purple-400/30 hover:scale-105 transition-all duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
                  All Time
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹{stats.totalSales.toFixed(2)}
                </p>
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
                  ₹{stats.totalProfit.toFixed(2)} profit
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                🎯
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Charts Section */}
        {showCharts && allSales.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
            <ChartsContainer sales={allSales} products={allProducts} />
          </div>
        )}

        {/* Enhanced Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/sales"
              className="group bg-gradient-to-r from-blue-600 to-cyan-700 text-white p-6 rounded-xl hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-500 shadow-lg border border-cyan-500/20"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
                  💰
                </div>
                <div>
                  <div className="font-semibold text-lg">Record Sale</div>
                  <div className="text-cyan-200 text-sm">
                    Add new sales transaction
                  </div>
                </div>
                <div className="ml-auto text-white/60 group-hover:translate-x-1 transition-transform duration-300">
                  →
                </div>
              </div>
            </Link>

            <Link
              to="/products"
              className="group bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-xl hover:shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 transition-all duration-500 shadow-lg border border-emerald-500/20"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
                  📦
                </div>
                <div>
                  <div className="font-semibold text-lg">Add Product</div>
                  <div className="text-emerald-200 text-sm">
                    Manage your inventory
                  </div>
                </div>
                <div className="ml-auto text-white/60 group-hover:translate-x-1 transition-transform duration-300">
                  →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

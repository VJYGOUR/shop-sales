import React, { useState, useEffect, useCallback } from "react";
import type { DashboardStats, Product, Sale } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import { Link } from "react-router-dom";

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
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [products, sales] = await Promise.all([
        productAPI.getProducts(),
        saleAPI.getSales(),
      ]);

      const { dailySales, monthlySales, dailyProfit, monthlyProfit } =
        calculateDailyAndMonthlyStats(sales);

      const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
      const outOfStockCount = products.filter((p) => p.stock === 0).length;
      const lowStockProducts = products.filter(
        (p) => p.stock > 0 && p.stock <= 5
      );
      const recentSales = sales.slice(0, 5); // Get last 5 sales

      setStats({
        totalSales,
        totalProfit,
        outOfStockCount,
        lowStockCount: lowStockProducts.length,
        dailySales,
        monthlySales,
        dailyProfit,
        monthlyProfit,
      });
      setLowStockProducts(lowStockProducts);
      setRecentSales(recentSales);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-600">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
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

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Recent Sales
            </h3>
            <Link
              to="/sales"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          {recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale._id}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {sale.productName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(sale.date || sale.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      ₹{sale.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600">
                      Profit: ₹{sale.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-gray-500 mb-2">No recent sales</p>
              <Link
                to="/sales"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Record your first sale
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar - Low Stock & Quick Actions */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Low Stock Alert
            </h3>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
                  >
                    <span className="font-medium text-sm">{product.name}</span>
                    <span className="text-yellow-700 text-sm font-semibold">
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                All products are well stocked! 🎉
              </p>
            )}
            <Link
              to="/products"
              className="block mt-4 text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Manage Products →
            </Link>
          </div>

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
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect, useCallback } from "react";
import type { Sale, Product } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import {
  exportToCSV,
  exportToJSON,
  formatSalesForExport,
  formatInventoryForExport,
  formatCustomersForExport,
} from "../utils/exportUtils";

// Add this interface for best selling product
interface BestSellingProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface ReportData {
  totalSales: number;
  totalProfit: number;
  totalProducts: number;
  avgSaleValue: number;
  bestSellingProduct: BestSellingProduct | null;
  salesTrend: { date: string; sales: number; profit: number }[];
}

// Customer interface
interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  firstPurchase: string;
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalProfit: 0,
    totalProducts: 0,
    avgSaleValue: 0,
    bestSellingProduct: null,
    salesTrend: [],
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [dateRange, setDateRange] = useState("all");

  const loadReportsData = useCallback(async () => {
    try {
      const [salesData, productsData] = await Promise.all([
        saleAPI.getSales(),
        productAPI.getProducts(),
      ]);

      setSales(salesData);
      setProducts(productsData);

      // Generate customer data from sales
      const customerMap = new Map<string, CustomerData>();
      let customerId = 1;

      salesData.forEach((sale) => {
        const customerName = `Customer ${customerId}`;
        const customerEmail = `customer${customerId}@example.com`;

        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, {
            id: customerName,
            name: customerName,
            email: customerEmail,
            phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            totalSpent: 0,
            totalOrders: 0,
            lastPurchase: sale.date || sale.createdAt,
            firstPurchase: sale.date || sale.createdAt,
          });
          customerId++;
        }

        const customer = customerMap.get(customerName);
        if (customer) {
          customer.totalSpent += sale.totalAmount;
          customer.totalOrders += 1;

          const saleDate = new Date(sale.date || sale.createdAt);
          const lastPurchaseDate = new Date(customer.lastPurchase);
          if (saleDate > lastPurchaseDate) {
            customer.lastPurchase = sale.date || sale.createdAt;
          }

          const firstPurchaseDate = new Date(customer.firstPurchase);
          if (saleDate < firstPurchaseDate) {
            customer.firstPurchase = sale.date || sale.createdAt;
          }
        }
      });

      setCustomers(Array.from(customerMap.values()));

      // Filter sales based on date range
      const now = new Date();
      let filteredSales = salesData;

      if (dateRange !== "all") {
        let startDate = new Date();

        switch (dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }

        filteredSales = salesData.filter((sale) => {
          const saleDate = new Date(sale.date || sale.createdAt);
          return saleDate >= startDate;
        });
      }

      // Calculate report data
      const totalSales = filteredSales.reduce(
        (sum, sale) => sum + sale.totalAmount,
        0
      );
      const totalProfit = filteredSales.reduce(
        (sum, sale) => sum + sale.profit,
        0
      );
      const totalProducts = productsData.length;
      const avgSaleValue =
        filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

      // Find best selling product
      const productSales = filteredSales.reduce((acc, sale) => {
        if (!acc[sale.productName]) {
          acc[sale.productName] = { quantity: 0, revenue: 0 };
        }
        acc[sale.productName].quantity += sale.quantity;
        acc[sale.productName].revenue += sale.totalAmount;
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number }>);

      let bestSellingProduct: BestSellingProduct | null = null;
      Object.entries(productSales).forEach(([name, data]) => {
        if (
          !bestSellingProduct ||
          data.quantity > bestSellingProduct.quantity
        ) {
          bestSellingProduct = { name, ...data };
        }
      });

      // Generate sales trend (last 7 days)
      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const daySales = filteredSales.filter((sale) => {
          const saleDate = new Date(sale.date || sale.createdAt);
          return saleDate.toDateString() === date.toDateString();
        });

        const dayTotal = daySales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        );
        const dayProfit = daySales.reduce((sum, sale) => sum + sale.profit, 0);

        salesTrend.push({
          date: dateStr,
          sales: dayTotal,
          profit: dayProfit,
        });
      }

      setReportData({
        totalSales,
        totalProfit,
        totalProducts,
        avgSaleValue,
        bestSellingProduct,
        salesTrend,
      });
    } catch (error) {
      console.error("Error loading reports:", error);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Export handlers
  const handleExportSales = (format: "csv" | "json") => {
    const salesData = formatSalesForExport(sales);
    if (format === "csv") {
      exportToCSV(salesData, "sales_report");
    } else {
      exportToJSON(salesData, "sales_report");
    }
  };

  const handleExportInventory = (format: "csv" | "json") => {
    const inventoryData = formatInventoryForExport(products);
    if (format === "csv") {
      exportToCSV(inventoryData, "inventory_report");
    } else {
      exportToJSON(inventoryData, "inventory_report");
    }
  };

  const handleExportCustomers = (format: "csv" | "json") => {
    const customerData = formatCustomersForExport(customers);
    if (format === "csv") {
      exportToCSV(customerData, "customer_report");
    } else {
      exportToJSON(customerData, "customer_report");
    }
  };

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
                Business Reports
              </h1>
              <p className="text-gray-300">
                Comprehensive analytics and insights
              </p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
            >
              <option value="all" className="bg-slate-800">
                All Time
              </option>
              <option value="today" className="bg-slate-800">
                Today
              </option>
              <option value="week" className="bg-slate-800">
                Last 7 Days
              </option>
              <option value="month" className="bg-slate-800">
                This Month
              </option>
              <option value="year" className="bg-slate-800">
                This Year
              </option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: formatCurrency(reportData.totalSales),
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
              icon: "💰",
            },
            {
              label: "Total Profit",
              value: formatCurrency(reportData.totalProfit),
              color: "text-green-400",
              bg: "bg-green-500/10",
              border: "border-green-500/20",
              icon: "📈",
            },
            {
              label: "Avg Sale Value",
              value: formatCurrency(reportData.avgSaleValue),
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
              icon: "📊",
            },
            {
              label: "Products",
              value: reportData.totalProducts.toString(),
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              border: "border-orange-500/20",
              icon: "📦",
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
                  <p className={`text-lg font-bold ${stat.color} mt-2`}>
                    {stat.value}
                  </p>
                </div>
                <div className="text-2xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">
              Sales Trend (Last 7 Days)
            </h3>
            <div className="space-y-4">
              {reportData.salesTrend.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 w-16">{day.date}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            (day.sales /
                              Math.max(
                                ...reportData.salesTrend.map(
                                  (d) => d.sales || 1
                                )
                              )) *
                              100,
                            5
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white w-20 text-right">
                    {formatCurrency(day.sales)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">
              Performance Highlights
            </h3>
            <div className="space-y-4">
              {reportData.bestSellingProduct ? (
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cyan-300">
                        Best Selling Product
                      </p>
                      <p className="text-lg font-bold text-white">
                        {reportData.bestSellingProduct.name}
                      </p>
                      <p className="text-sm text-cyan-400">
                        {reportData.bestSellingProduct.quantity} units sold
                      </p>
                    </div>
                    <div className="text-3xl text-cyan-400">🏆</div>
                  </div>
                  <div className="mt-2 text-sm text-cyan-300">
                    Revenue:{" "}
                    {formatCurrency(reportData.bestSellingProduct.revenue)}
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                  <div className="text-3xl mb-2 text-gray-500">📊</div>
                  <p className="text-gray-400">No sales data available</p>
                </div>
              )}

              {/* Profit Margin */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-300">
                      Profit Margin
                    </p>
                    <p className="text-lg font-bold text-white">
                      {reportData.totalSales > 0
                        ? `${(
                            (reportData.totalProfit / reportData.totalSales) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </div>
                  <div className="text-3xl text-emerald-400">💹</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Insights */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">
            Business Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-cyan-400">
                {reportData.totalSales > 0
                  ? Math.round(
                      (reportData.totalProfit / reportData.totalSales) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-400">Gross Margin</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-purple-400">
                {reportData.avgSaleValue > 0
                  ? Math.round(reportData.totalSales / reportData.avgSaleValue)
                  : 0}
              </div>
              <div className="text-sm text-gray-400">Total Transactions</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-2xl font-bold text-green-400">
                {formatCurrency(reportData.totalProfit / 30)}
              </div>
              <div className="text-sm text-gray-400">Avg Daily Profit</div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">Export Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sales Export */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300">
              <h4 className="font-semibold text-white mb-3">Sales Report</h4>
              <p className="text-sm text-gray-400 mb-4">
                Export all sales data with detailed information
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportSales("csv")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExportSales("json")}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all duration-300"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Inventory Export */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300">
              <h4 className="font-semibold text-white mb-3">
                Inventory Report
              </h4>
              <p className="text-sm text-gray-400 mb-4">
                Export product inventory with stock levels
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportInventory("csv")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExportInventory("json")}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all duration-300"
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Customers Export */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-orange-500/30 transition-all duration-300">
              <h4 className="font-semibold text-white mb-3">Customer Report</h4>
              <p className="text-sm text-gray-400 mb-4">
                Export customer data and purchase history
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportCustomers("csv")}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExportCustomers("json")}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all duration-300"
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

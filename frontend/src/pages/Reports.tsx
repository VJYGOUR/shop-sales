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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Business Reports
            </h1>
            <p className="text-gray-600">
              Comprehensive analytics and insights
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(reportData.totalSales)}
              </p>
            </div>
            <div className="text-2xl text-blue-500">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(reportData.totalProfit)}
              </p>
            </div>
            <div className="text-2xl text-green-500">📈</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg Sale Value
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(reportData.avgSaleValue)}
              </p>
            </div>
            <div className="text-2xl text-purple-500">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-800">
                {reportData.totalProducts}
              </p>
            </div>
            <div className="text-2xl text-orange-500">📦</div>
          </div>
        </div>
      </div>

      {/* Charts and Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Sales Trend (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {reportData.salesTrend.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-16">{day.date}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.max(
                          (day.sales /
                            Math.max(
                              ...reportData.salesTrend.map((d) => d.sales || 1)
                            )) *
                            100,
                          5
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">
                  {formatCurrency(day.sales)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Best Selling Product */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Performance Highlights
          </h3>
          <div className="space-y-4">
            {reportData.bestSellingProduct ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Best Selling Product
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {reportData.bestSellingProduct.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      {reportData.bestSellingProduct.quantity} units sold
                    </p>
                  </div>
                  <div className="text-3xl text-blue-500">🏆</div>
                </div>
                <div className="mt-2 text-sm text-blue-600">
                  Revenue:{" "}
                  {formatCurrency(reportData.bestSellingProduct.revenue)}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-gray-600">No sales data available</p>
              </div>
            )}

            {/* Profit Margin */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Profit Margin
                  </p>
                  <p className="text-lg font-bold text-green-900">
                    {reportData.totalSales > 0
                      ? `${(
                          (reportData.totalProfit / reportData.totalSales) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </p>
                </div>
                <div className="text-3xl text-green-500">💹</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Business Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {reportData.totalSales > 0
                ? Math.round(
                    (reportData.totalProfit / reportData.totalSales) * 100
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">Gross Margin</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {reportData.avgSaleValue > 0
                ? Math.round(reportData.totalSales / reportData.avgSaleValue)
                : 0}
            </div>
            <div className="text-sm text-gray-600">Total Transactions</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">
              {formatCurrency(reportData.totalProfit / 30)}
            </div>
            <div className="text-sm text-gray-600">Avg Daily Profit</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Export Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sales Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Sales Report</h4>
            <p className="text-sm text-gray-600 mb-3">
              Export all sales data with detailed information
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportSales("csv")}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExportSales("json")}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Inventory Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              Inventory Report
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Export product inventory with stock levels
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportInventory("csv")}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExportInventory("json")}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Customers Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              Customer Report
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Export customer data and purchase history
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportCustomers("csv")}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                CSV
              </button>
              <button
                onClick={() => handleExportCustomers("json")}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
              >
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

import React, { useState, useMemo, useCallback } from "react";
import type { Sale } from "../types";

interface AdvancedAnalyticsProps {
  sales: Sale[];
  dateRange: { start: string; end: string };
}

interface SalesTrend {
  date: string;
  revenue: number;
  profit: number;
  quantity: number;
  orders: number;
}

interface ProductPerformance {
  productName: string;
  revenue: number;
  profit: number;
  quantity: number;
  profitMargin: number;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  sales,
  dateRange,
}) => {
  const [activeTab, setActiveTab] = useState<
    "trends" | "products" | "comparison"
  >("trends");
  const [comparisonRange, setComparisonRange] = useState<
    "previous_period" | "previous_year" | "custom"
  >("previous_period");

  // Formatting functions
  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount),
    []
  );

  const formatPercent = useCallback((value: number) => {
    if (!isFinite(value)) return "N/A";
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  }, []);

  const getGrowthColor = useCallback((value: number) => {
    if (!isFinite(value)) return "text-gray-600";
    return value > 0
      ? "text-green-600"
      : value < 0
      ? "text-red-600"
      : "text-gray-600";
  }, []);

  const formatDate = useCallback(
    (dateString: string) =>
      new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  // Get sales date
  const getSaleDate = useCallback((sale: Sale): Date => {
    return new Date(sale.date);
  }, []);

  // Get week number for a date (ISO week)
  const getWeekNumber = useCallback((date: Date) => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }, []);

  // Get start and end of week for a date
  const getWeekRange = useCallback((date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, []);

  // Get all sales grouped by week
  const weeklySales = useMemo(() => {
    const groups: Record<
      string,
      { sales: Sale[]; label: string; startDate: Date; endDate: Date }
    > = {};

    sales.forEach((sale) => {
      const saleDate = getSaleDate(sale);
      const weekNumber = getWeekNumber(saleDate);
      const year = saleDate.getFullYear();
      const weekKey = `${year}-W${String(weekNumber).padStart(2, "0")}`;

      if (!groups[weekKey]) {
        const weekRange = getWeekRange(saleDate);
        groups[weekKey] = {
          sales: [],
          label: `Week ${weekNumber} (${formatDate(
            weekRange.start.toISOString().split("T")[0]
          )} - ${formatDate(weekRange.end.toISOString().split("T")[0])})`,
          startDate: weekRange.start,
          endDate: weekRange.end,
        };
      }
      groups[weekKey].sales.push(sale);
    });

    return groups;
  }, [sales, getSaleDate, getWeekNumber, getWeekRange, formatDate]);

  // Get available weeks for comparison
  const availableWeeks = useMemo(() => {
    return Object.entries(weeklySales)
      .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
      .map(([key, data]) => ({ key, ...data }));
  }, [weeklySales]);

  // Current period sales
  const currentPeriodSales = useMemo(() => {
    const currentStart = new Date(dateRange.start);
    const currentEnd = new Date(dateRange.end);
    currentEnd.setHours(23, 59, 59);

    const filteredSales = sales.filter((sale) => {
      const saleDate = getSaleDate(sale);
      return saleDate >= currentStart && saleDate <= currentEnd;
    });

    console.log("📊 Current Period Analysis:", {
      period: `${dateRange.start} to ${dateRange.end}`,
      salesCount: filteredSales.length,
      availableWeeks: availableWeeks.map((w) => ({
        key: w.key,
        label: w.label,
        salesCount: w.sales.length,
      })),
    });

    return filteredSales;
  }, [sales, dateRange, getSaleDate, availableWeeks]);

  // SIMPLE AND RELIABLE COMPARISON: Direct date-based comparison
  const comparisonData = useMemo(() => {
    // Current period stats
    const currentPeriod = {
      revenue: currentPeriodSales.reduce(
        (sum, sale) => sum + sale.totalAmount,
        0
      ),
      profit: currentPeriodSales.reduce((sum, sale) => sum + sale.profit, 0),
      orders: currentPeriodSales.length,
      quantity: currentPeriodSales.reduce(
        (sum, sale) => sum + sale.quantity,
        0
      ),
      avgOrder: currentPeriodSales.length
        ? currentPeriodSales.reduce((sum, sale) => sum + sale.totalAmount, 0) /
          currentPeriodSales.length
        : 0,
    };

    let previousData: Sale[] = [];
    let periodLabel = "";
    let comparisonType = "";

    // Calculate previous period dates
    const currentStart = new Date(dateRange.start);
    const currentEnd = new Date(dateRange.end);

    // Calculate period length in days
    const periodLengthMs = currentEnd.getTime() - currentStart.getTime();
    const periodLengthDays =
      Math.floor(periodLengthMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end

    // Calculate previous period dates
    const previousStart = new Date(currentStart);
    const previousEnd = new Date(currentEnd);
    previousStart.setDate(previousStart.getDate() - periodLengthDays);
    previousEnd.setDate(previousEnd.getDate() - periodLengthDays);

    // Get sales for previous period
    previousData = sales.filter((sale) => {
      const saleDate = getSaleDate(sale);
      return saleDate >= previousStart && saleDate <= previousEnd;
    });

    periodLabel = `${formatDate(
      previousStart.toISOString().split("T")[0]
    )} to ${formatDate(previousEnd.toISOString().split("T")[0])}`;
    comparisonType = "Previous Period";

    console.log("🔍 Comparison Analysis:", {
      currentPeriod: {
        dates: `${dateRange.start} to ${dateRange.end}`,
        sales: currentPeriodSales.length,
      },
      previousPeriod: {
        dates: `${previousStart.toISOString().split("T")[0]} to ${
          previousEnd.toISOString().split("T")[0]
        }`,
        sales: previousData.length,
      },
      periodLengthDays,
      allSalesDates: sales
        .map((s) => getSaleDate(s).toISOString().split("T")[0])
        .slice(0, 10),
    });

    // Previous period stats
    const previousPeriod = {
      revenue: previousData.reduce((sum, sale) => sum + sale.totalAmount, 0),
      profit: previousData.reduce((sum, sale) => sum + sale.profit, 0),
      orders: previousData.length,
      quantity: previousData.reduce((sum, sale) => sum + sale.quantity, 0),
      avgOrder: previousData.length
        ? previousData.reduce((sum, sale) => sum + sale.totalAmount, 0) /
          previousData.length
        : 0,
    };

    return {
      current: currentPeriod,
      previous: previousPeriod,
      periodLabel,
      comparisonType,
      hasComparisonData: previousData.length > 0,
    };
  }, [currentPeriodSales, dateRange, sales, getSaleDate, formatDate]);

  // Sales trends data
  const salesTrends = useMemo((): SalesTrend[] => {
    const trends: Record<string, SalesTrend> = {};
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    // Initialize all dates in the range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      trends[dateStr] = {
        date: dateStr,
        revenue: 0,
        profit: 0,
        quantity: 0,
        orders: 0,
      };
    }

    // Aggregate sales data
    currentPeriodSales.forEach((sale) => {
      const saleDate = getSaleDate(sale);
      const dateStr = saleDate.toISOString().split("T")[0];

      if (trends[dateStr]) {
        trends[dateStr].revenue += sale.totalAmount;
        trends[dateStr].profit += sale.profit;
        trends[dateStr].quantity += sale.quantity;
        trends[dateStr].orders += 1;
      }
    });

    return Object.values(trends)
      .filter((day) => day.revenue > 0 || day.orders > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentPeriodSales, dateRange, getSaleDate]);

  // Product performance
  const productPerformance = useMemo((): ProductPerformance[] => {
    const performance: Record<string, ProductPerformance> = {};

    currentPeriodSales.forEach((sale) => {
      if (!performance[sale.productName]) {
        performance[sale.productName] = {
          productName: sale.productName,
          revenue: 0,
          profit: 0,
          quantity: 0,
          profitMargin: 0,
        };
      }

      performance[sale.productName].revenue += sale.totalAmount;
      performance[sale.productName].profit += sale.profit;
      performance[sale.productName].quantity += sale.quantity;
    });

    // Calculate profit margins
    Object.values(performance).forEach((product) => {
      product.profitMargin =
        product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
    });

    return Object.values(performance);
  }, [currentPeriodSales]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          📊 Advanced Analytics Dashboard
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "trends" as const, label: "Sales Trends", icon: "📈" },
            { id: "products" as const, label: "Product Analysis", icon: "📦" },
            {
              id: "comparison" as const,
              label: "Performance Comparison",
              icon: "⚖️",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TRENDS TAB */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Revenue",
                value: salesTrends.reduce((sum, day) => sum + day.revenue, 0),
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Total Profit",
                value: salesTrends.reduce((sum, day) => sum + day.profit, 0),
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Total Orders",
                value: salesTrends.reduce((sum, day) => sum + day.orders, 0),
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Units Sold",
                value: salesTrends.reduce((sum, day) => sum + day.quantity, 0),
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
            ].map((metric, index) => (
              <div key={index} className={`p-4 rounded-xl ${metric.bg} border`}>
                <div className="text-sm text-gray-600 mb-1">{metric.label}</div>
                <div className={`text-xl font-bold ${metric.color}`}>
                  {typeof metric.value === "number" &&
                  (metric.label.includes("Revenue") ||
                    metric.label.includes("Profit"))
                    ? formatCurrency(metric.value)
                    : metric.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Trend Chart */}
          <div className="p-4 border rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-4">
              Daily Revenue Trend
            </h3>
            {salesTrends.length > 0 ? (
              <div className="h-64">
                <div className="flex items-end justify-between h-48 gap-1">
                  {salesTrends.map((day) => {
                    const maxRevenue = Math.max(
                      ...salesTrends.map((d) => d.revenue)
                    );
                    const height =
                      maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center group relative"
                      >
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
                          <div>{formatDate(day.date)}</div>
                          <div className="font-semibold">
                            {formatCurrency(day.revenue)}
                          </div>
                        </div>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(day.date).getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sales data available for the selected period
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products by Revenue */}
            <div className="p-4 border rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">
                🏆 Top Products by Revenue
              </h3>
              {productPerformance.length > 0 ? (
                <div className="space-y-3">
                  {productPerformance
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 8)
                    .map((product, index) => (
                      <div
                        key={product.productName}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0
                                ? "bg-yellow-500"
                                : index === 1
                                ? "bg-gray-500"
                                : index === 2
                                ? "bg-orange-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm">
                            {product.productName}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(product.revenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.quantity} units
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No product data available
                </div>
              )}
            </div>

            {/* Profitability Leaders */}
            <div className="p-4 border rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">
                💰 Profitability Leaders
              </h3>
              {productPerformance.length > 0 ? (
                <div className="space-y-3">
                  {productPerformance
                    .sort((a, b) => b.profitMargin - a.profitMargin)
                    .slice(0, 8)
                    .map((product, index) => (
                      <div
                        key={product.productName}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm">
                            {product.productName}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {product.profitMargin.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(product.profit)} profit
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No product data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON TAB */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            {[
              { id: "previous_period" as const, label: "Vs Previous Period" },
              { id: "previous_year" as const, label: "Vs Previous Year" },
              { id: "custom" as const, label: "Custom Comparison" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setComparisonRange(option.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  comparisonRange === option.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Available Data Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              <strong>Current Period:</strong> {formatDate(dateRange.start)} to{" "}
              {formatDate(dateRange.end)}
              <br />
              <strong>Comparison Period:</strong> {comparisonData.periodLabel}
              <br />
              <strong>Comparison Type:</strong> {comparisonData.comparisonType}
              <br />
              <strong>Available Weeks:</strong> {availableWeeks.length} week(s)
              {!comparisonData.hasComparisonData && (
                <div className="text-orange-600 font-medium mt-1">
                  ⚠️ No sales data found in comparison period
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Revenue",
                current: comparisonData.current.revenue,
                previous: comparisonData.previous.revenue,
              },
              {
                label: "Profit",
                current: comparisonData.current.profit,
                previous: comparisonData.previous.profit,
              },
              {
                label: "Orders",
                current: comparisonData.current.orders,
                previous: comparisonData.previous.orders,
              },
              {
                label: "Avg Order Value",
                current: comparisonData.current.avgOrder,
                previous: comparisonData.previous.avgOrder,
              },
            ].map((metric, index) => {
              const growth =
                metric.previous > 0
                  ? ((metric.current - metric.previous) / metric.previous) * 100
                  : metric.current > 0
                  ? 100
                  : 0;

              return (
                <div key={index} className="p-4 border rounded-xl">
                  <div className="text-sm text-gray-600 mb-2">
                    {metric.label}
                  </div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {metric.label.includes("Revenue") ||
                    metric.label.includes("Profit") ||
                    metric.label.includes("Avg Order")
                      ? formatCurrency(metric.current)
                      : metric.current.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Prev:{" "}
                      {metric.label.includes("Revenue") ||
                      metric.label.includes("Profit") ||
                      metric.label.includes("Avg Order")
                        ? formatCurrency(metric.previous)
                        : metric.previous.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs font-medium ${getGrowthColor(
                        growth
                      )}`}
                    >
                      {formatPercent(growth)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Data Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Period Sales:</span>
                <span className="font-semibold ml-2">
                  {comparisonData.current.orders} transactions
                </span>
              </div>
              <div>
                <span className="text-gray-600">Comparison Period Sales:</span>
                <span className="font-semibold ml-2">
                  {comparisonData.previous.orders} transactions
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { Sale } from "../../types/index";

interface SalesTrendChartProps {
  sales: Sale[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ sales }) => {
  // Process data for sales trend - Create continuous timeline
  const processSalesData = () => {
    // Get last 7 days including today
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i)); // Last 7 days including today
      date.setHours(0, 0, 0, 0);
      return date;
    });

    // Create data for all 7 days with sales data
    return last7Days.map((date) => {
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const daySales = sales.filter((sale) => {
        const saleDate = new Date(sale.date || sale.createdAt);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === date.getTime();
      });

      return {
        date: dateStr,
        fullDate: date.toISOString().split("T")[0],
        revenue: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        sales: daySales.length,
        profit: daySales.reduce((sum, sale) => sum + sale.profit, 0),
      };
    });
  };

  const chartData = processSalesData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Calculate trend metrics
  const totalRevenue = chartData.reduce((sum, day) => sum + day.revenue, 0);
  const hasPositiveTrend =
    chartData.length > 1 &&
    chartData[chartData.length - 1].revenue > chartData[0].revenue;

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
          <span className="text-sm text-gray-500">Last 7 Days</span>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No sales data available for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
          <p className="text-sm text-gray-500">Last 7 days performance</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full ${
            hasPositiveTrend
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <span className="text-sm font-medium">
            {hasPositiveTrend ? "📈 Growing" : "📉 Declining"}
          </span>
        </div>
      </div>

      {/* Area Chart for Revenue Trend */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            className="opacity-30"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatCurrency}
            width={60}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "revenue") return [formatCurrency(value), "Revenue"];
              if (name === "profit") return [formatCurrency(value), "Profit"];
              return [value, "Sales"];
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            fill="url(#revenueGradient)"
            strokeWidth={3}
            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#1D4ED8" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Line Chart for Sales Count Trend */}
      <ResponsiveContainer width="100%" height={150} className="mt-4">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="opacity-30"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [value, "Sales Count"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, fill: "#047857" }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-3 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 font-medium">Total Revenue</p>
          <p className="text-sm font-bold text-blue-800">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 font-medium">Total Sales</p>
          <p className="text-sm font-bold text-green-800">
            {chartData.reduce((sum, day) => sum + day.sales, 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-600 font-medium">Peak Day</p>
          <p className="text-sm font-bold text-purple-800">
            {formatCurrency(Math.max(...chartData.map((day) => day.revenue)))}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-orange-600 font-medium">Avg Daily</p>
          <p className="text-sm font-bold text-orange-800">
            {formatCurrency(totalRevenue / chartData.length)}
          </p>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-600">
        <span>Start: {formatCurrency(chartData[0]?.revenue || 0)}</span>
        <span>
          End: {formatCurrency(chartData[chartData.length - 1]?.revenue || 0)}
        </span>
        <span className={hasPositiveTrend ? "text-green-600" : "text-red-600"}>
          {hasPositiveTrend ? "↗️ Upward" : "↘️ Downward"}
        </span>
      </div>
    </div>
  );
};

export default SalesTrendChart;

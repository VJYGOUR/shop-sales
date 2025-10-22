import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Sale } from "../../types/index";

interface ProfitMarginChartProps {
  sales: Sale[];
}

const ProfitMarginChart: React.FC<ProfitMarginChartProps> = ({ sales }) => {
  // Process data for profit margin analysis
  const processMarginData = () => {
    const marginByDate = sales.reduce((acc, sale) => {
      const date = new Date(sale.date || sale.createdAt).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );

      if (!acc[date]) {
        acc[date] = { date, revenue: 0, profit: 0, margin: 0 };
      }

      acc[date].revenue += sale.totalAmount;
      acc[date].profit += sale.profit;
      acc[date].margin = (acc[date].profit / acc[date].revenue) * 100;

      return acc;
    }, {} as Record<string, { date: string; revenue: number; profit: number; margin: number }>);

    return Object.values(marginByDate).slice(-7); // Last 7 days
  };

  const chartData = processMarginData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Profit Margin Analysis
        </h3>
        <span className="text-sm text-gray-500">Last 7 Days</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={formatPercent}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "revenue" || name === "profit")
                return [
                  formatCurrency(value),
                  name === "revenue" ? "Revenue" : "Profit",
                ];
              return [formatPercent(value), "Margin %"];
            }}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            name="Revenue"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="profit"
            stackId="2"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.3}
            name="Profit"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="margin"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.1}
            strokeWidth={2}
            name="Margin %"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Avg Margin</p>
          <p className="text-lg font-bold text-blue-800">
            {formatPercent(
              chartData.reduce((sum, day) => sum + day.margin, 0) /
                chartData.length || 0
            )}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Best Margin</p>
          <p className="text-lg font-bold text-green-800">
            {formatPercent(Math.max(...chartData.map((day) => day.margin)))}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">
            Avg Daily Profit
          </p>
          <p className="text-lg font-bold text-purple-800">
            {formatCurrency(
              chartData.reduce((sum, day) => sum + day.profit, 0) /
                chartData.length || 0
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfitMarginChart;

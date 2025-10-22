import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Sale } from '../../types/index';

interface SalesTrendChartProps {
  sales: Sale[];
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ sales }) => {
  // Process data for the chart
  const processChartData = () => {
    const salesByDate = sales.reduce((acc, sale) => {
      const date = new Date(sale.date || sale.createdAt).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );

      if (!acc[date]) {
        acc[date] = { date, sales: 0, profit: 0 };
      }

      acc[date].sales += sale.totalAmount;
      acc[date].profit += sale.profit;

      return acc;
    }, {} as Record<string, { date: string; sales: number; profit: number }>);

    return Object.values(salesByDate).slice(-7); // Last 7 days
  };

  const chartData = processChartData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Sales Trend</h3>
        <span className="text-sm text-gray-500">Last 7 Days</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
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
            tick={{ fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), "Amount"]}
            labelFormatter={(label) => `Date: ${label}`}
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
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#1D4ED8" }}
            name="Sales Revenue"
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#10B981"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#047857" }}
            name="Profit"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Sales</p>
          <p className="text-lg font-bold text-blue-800">
            {formatCurrency(chartData.reduce((sum, day) => sum + day.sales, 0))}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Total Profit</p>
          <p className="text-lg font-bold text-green-800">
            {formatCurrency(
              chartData.reduce((sum, day) => sum + day.profit, 0)
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesTrendChart;

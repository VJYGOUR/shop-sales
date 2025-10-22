import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Sale } from "../../types/index";

interface ProductPerformanceChartProps {
  sales: Sale[];
}

const ProductPerformanceChart: React.FC<ProductPerformanceChartProps> = ({
  sales,
}) => {
  // Process data for product performance
  const processProductData = () => {
    const productPerformance = sales.reduce((acc, sale) => {
      if (!acc[sale.productName]) {
        acc[sale.productName] = {
          name:
            sale.productName.length > 15
              ? sale.productName.substring(0, 15) + "..."
              : sale.productName,
          revenue: 0,
          profit: 0,
          quantity: 0,
        };
      }

      acc[sale.productName].revenue += sale.totalAmount;
      acc[sale.productName].profit += sale.profit;
      acc[sale.productName].quantity += sale.quantity;

      return acc;
    }, {} as Record<string, { name: string; revenue: number; profit: number; quantity: number }>);

    return Object.values(productPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products
  };

  const chartData = processProductData();

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
        <h3 className="text-lg font-semibold text-gray-800">
          Top Performing Products
        </h3>
        <span className="text-sm text-gray-500">By Revenue</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "revenue") return [formatCurrency(value), "Revenue"];
              if (name === "profit") return [formatCurrency(value), "Profit"];
              return [value, "Quantity"];
            }}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />
          <Bar
            dataKey="revenue"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            name="Revenue"
          />
          <Bar
            dataKey="profit"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            name="Profit"
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-blue-50 p-2 rounded">
          <p className="text-blue-600 font-medium">Total Items</p>
          <p className="font-bold text-blue-800">{chartData.length}</p>
        </div>
        <div className="bg-purple-50 p-2 rounded">
          <p className="text-purple-600 font-medium">Avg Revenue</p>
          <p className="font-bold text-purple-800">
            {formatCurrency(
              chartData.reduce((sum, product) => sum + product.revenue, 0) /
                chartData.length || 0
            )}
          </p>
        </div>
        <div className="bg-green-50 p-2 rounded">
          <p className="text-green-600 font-medium">Total Qty</p>
          <p className="font-bold text-green-800">
            {chartData.reduce((sum, product) => sum + product.quantity, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductPerformanceChart;

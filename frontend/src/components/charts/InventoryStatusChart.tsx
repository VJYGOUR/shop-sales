import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Product } from "../../types/index";

interface InventoryStatusChartProps {
  products: Product[];
}

const InventoryStatusChart: React.FC<InventoryStatusChartProps> = ({
  products,
}) => {
  // Process data for inventory status
  const processInventoryData = () => {
    const statusCounts = {
      "In Stock": 0,
      "Low Stock": 0,
      "Out of Stock": 0,
    };

    products.forEach((product) => {
      if (product.stock === 0) {
        statusCounts["Out of Stock"]++;
      } else if (product.stock <= 5) {
        statusCounts["Low Stock"]++;
      } else {
        statusCounts["In Stock"]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const chartData = processInventoryData();
  const COLORS = ["#10B981", "#F59E0B", "#EF4444"];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Inventory Status
        </h3>
        <span className="text-sm text-gray-500">Stock Overview</span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [value, "Products"]}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${COLORS[index]}20` }}
          >
            <p className="text-sm font-medium" style={{ color: COLORS[index] }}>
              {item.name}
            </p>
            <p className="text-lg font-bold" style={{ color: COLORS[index] }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryStatusChart;

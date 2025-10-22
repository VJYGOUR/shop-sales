import React, { useState } from "react";
import type { Sale, Product } from "../../types/index";
import SalesTrendChart from "./SalesTrendChart";
import ProductPerformanceChart from "./ProductPerformanceChart";
import InventoryStatusChart from "./InventoryStatusChart";
import ProfitMarginChart from "./ProfitMarginChart";

interface ChartsContainerProps {
  sales: Sale[];
  products: Product[];
}

const ChartsContainer: React.FC<ChartsContainerProps> = ({
  sales,
  products,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "sales" | "inventory" | "performance"
  >("overview");

  const tabs = [
    { id: "overview" as const, name: "Overview", icon: "📊" },
    { id: "sales" as const, name: "Sales Analytics", icon: "💰" },
    { id: "inventory" as const, name: "Inventory", icon: "📦" },
    { id: "performance" as const, name: "Performance", icon: "🚀" },
  ];

  // Show message if no data
  if (sales.length === 0 && products.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 mb-4">
          Start adding products and making sales to see analytics
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/products"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Products
          </a>
          <a
            href="/sales"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Record Sales
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sales.length > 0 && <SalesTrendChart sales={sales} />}
            {sales.length > 0 && <ProductPerformanceChart sales={sales} />}
            {products.length > 0 && (
              <InventoryStatusChart products={products} />
            )}
            {sales.length > 0 && <ProfitMarginChart sales={sales} />}
          </div>
        )}

        {activeTab === "sales" && sales.length > 0 && (
          <div className="space-y-6">
            <SalesTrendChart sales={sales} />
            <ProfitMarginChart sales={sales} />
            <ProductPerformanceChart sales={sales} />
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-6">
            {products.length > 0 && (
              <InventoryStatusChart products={products} />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sales.length > 0 && <ProductPerformanceChart sales={sales} />}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Inventory Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-800 font-medium">
                      Low Stock Items
                    </span>
                    <span className="text-yellow-900 font-bold">
                      {
                        products.filter((p) => p.stock > 0 && p.stock <= 5)
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-800 font-medium">
                      Out of Stock
                    </span>
                    <span className="text-red-900 font-bold">
                      {products.filter((p) => p.stock === 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-800 font-medium">
                      Well Stocked
                    </span>
                    <span className="text-green-900 font-bold">
                      {products.filter((p) => p.stock > 5).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-800 font-medium">
                      Total Products
                    </span>
                    <span className="text-blue-900 font-bold">
                      {products.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && sales.length > 0 && (
          <div className="space-y-6">
            <ProductPerformanceChart sales={sales} />
            <ProfitMarginChart sales={sales} />
            <SalesTrendChart sales={sales} />
          </div>
        )}

        {/* Show message if no data for specific tab */}
        {activeTab === "sales" && sales.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Sales Data
            </h3>
            <p className="text-gray-600 mb-4">
              Record some sales to see analytics here
            </p>
            <a
              href="/sales"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Record First Sale
            </a>
          </div>
        )}

        {activeTab === "inventory" && products.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Products
            </h3>
            <p className="text-gray-600 mb-4">
              Add some products to see inventory analytics
            </p>
            <a
              href="/products"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Products
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsContainer;

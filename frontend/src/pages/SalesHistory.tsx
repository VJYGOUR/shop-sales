import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Sale, Product } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import DateRangePresets from "../components/DateRangePresets";
import { generatePrintReport } from "../utils/printUtils";

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  // Date range with presets
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  });

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  // Pagination
  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Products ranking pagination
  const PRODUCTS_PER_PAGE = 5;
  const [productPage, setProductPage] = useState(1);

  // Load sales and products
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const [salesData, productsData] = await Promise.all([
          saleAPI.getSales(),
          productAPI.getProducts(),
        ]);
        setSales(salesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load sales data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter sales based on date range and search
  const filteredSales = useMemo(() => {
    let filtered = sales.filter((sale) => {
      const saleDate = new Date(sale.date || sale.createdAt);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59);

      return saleDate >= start && saleDate <= end;
    });

    if (searchTerm) {
      filtered = filtered.filter((sale) =>
        sale.productName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [sales, dateRange, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE) || 1;
  const paginatedSales = useMemo(
    () =>
      filteredSales.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filteredSales, currentPage, ITEMS_PER_PAGE]
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setProductPage(1);
  }, [dateRange, searchTerm]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce(
      (acc, s) => acc + s.totalAmount,
      0
    );
    const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
    const totalQuantity = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
    const avgOrderValue = filteredSales.length
      ? totalRevenue / filteredSales.length
      : 0;

    return {
      totalRevenue,
      totalProfit,
      totalQuantity,
      avgOrderValue,
      totalSales: filteredSales.length,
    };
  }, [filteredSales]);

  // Best-to-least selling products
  const sortedProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSales.forEach(
      (s) => (counts[s.productName] = (counts[s.productName] || 0) + s.quantity)
    );
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredSales]);

  const totalProductPages =
    Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(
    () =>
      sortedProducts.slice(
        (productPage - 1) * PRODUCTS_PER_PAGE,
        productPage * PRODUCTS_PER_PAGE
      ),
    [sortedProducts, productPage, PRODUCTS_PER_PAGE]
  );

  // Formatting functions
  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount),
    []
  );

  const formatDate = useCallback(
    (dateString: string) =>
      new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  // Delete sale
  const deleteSale = async (sale: Sale) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this sale?\n\nProduct: ${
          sale.productName
        }\nQuantity: ${sale.quantity} units\nAmount: ${formatCurrency(
          sale.totalAmount
        )}`
      )
    )
      return;

    setDeletingId(sale._id);
    try {
      const product = products.find((p) => p._id === sale.productId);
      if (product) {
        await productAPI.updateProduct(product._id, {
          ...product,
          stock: product.stock + sale.quantity,
        });
      }
      await saleAPI.deleteSale(sale._id);
      setSales(sales.filter((s) => s._id !== sale._id));
      const updatedProducts = await productAPI.getProducts();
      setProducts(updatedProducts);
      alert("✅ Sale deleted and inventory restored successfully!");
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("❌ Failed to delete sale. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Export to CSV
  const exportToCSV = useCallback(async () => {
    setExporting(true);
    try {
      const headers = [
        "Product",
        "Date",
        "Quantity",
        "Price",
        "Total Amount",
        "Profit",
      ];
      const csvData = filteredSales.map((sale) => [
        sale.productName,
        formatDate(sale.date || sale.createdAt),
        sale.quantity,
        sale.salePrice,
        sale.totalAmount,
        sale.profit,
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("❌ Failed to export data");
    } finally {
      setExporting(false);
    }
  }, [filteredSales, formatDate]);

  // Print report
  const handlePrintReport = () => {
    generatePrintReport(filteredSales, dateRange, summaryStats);
  };

  // Select all sales on current page
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSales(paginatedSales.map((sale) => sale._id));
    } else {
      setSelectedSales([]);
    }
  };

  // Toggle single sale selection
  const handleSelectSale = (saleId: string) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedSales.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSales.length} selected sales? This will restore inventory for all products.`
      )
    ) {
      return;
    }

    try {
      // Restore inventory for selected sales
      const productUpdates = selectedSales.map((saleId) => {
        const sale = sales.find((s) => s._id === saleId);
        if (sale) {
          const product = products.find((p) => p._id === sale.productId);
          if (product) {
            return productAPI.updateProduct(product._id, {
              ...product,
              stock: product.stock + sale.quantity,
            });
          }
        }
        return Promise.resolve();
      });

      await Promise.all(productUpdates);

      // Delete selected sales
      const deleteOperations = selectedSales.map((id) =>
        saleAPI.deleteSale(id)
      );

      await Promise.all(deleteOperations);

      // Update local state
      setSales(sales.filter((s) => !selectedSales.includes(s._id)));

      // Refresh products
      const updatedProducts = await productAPI.getProducts();
      setProducts(updatedProducts);

      // Clear selection
      setSelectedSales([]);

      alert(
        `✅ Successfully deleted ${selectedSales.length} sales and restored inventory!`
      );
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("❌ Failed to delete sales. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg mt-4 text-gray-600">
            Loading sales history...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center text-red-600">
          <div className="text-xl mb-2">⚠️</div>
          <div className="text-lg">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Sales History & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive sales analysis and reporting
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              {showAdvancedAnalytics
                ? "📊 Hide Analytics"
                : "📈 Show Analytics"}
            </button>
            <button
              onClick={exportToCSV}
              disabled={exporting || filteredSales.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>📥 Export CSV</>
              )}
            </button>
            <button
              onClick={handlePrintReport}
              disabled={filteredSales.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              🖨️ Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      {showAdvancedAnalytics && (
        <AdvancedAnalytics sales={filteredSales} dateRange={dateRange} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Revenue",
            value: summaryStats.totalRevenue,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Total Profit",
            value: summaryStats.totalProfit,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total Sales",
            value: summaryStats.totalSales,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Quantity Sold",
            value: summaryStats.totalQuantity,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Avg Order Value",
            value: summaryStats.avgOrderValue,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`p-5 rounded-2xl shadow-md border border-gray-100 ${stat.bg} hover:shadow-lg transition-shadow`}
          >
            <h3 className="text-sm text-gray-600 font-medium">{stat.label}</h3>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>
              {typeof stat.value === "number" &&
              !stat.label.includes("Sales") &&
              !stat.label.includes("Quantity")
                ? formatCurrency(stat.value)
                : stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Date Range Presets */}
      <DateRangePresets
        onDateRangeChange={setDateRange}
        currentRange={dateRange}
      />

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Best-to-Least Selling Products */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Product Sales Ranking
        </h3>
        {sortedProducts.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units Sold
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total Sales
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map(([name, qty], idx) => (
                    <tr
                      key={name}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            idx === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : idx === 1
                              ? "bg-gray-100 text-gray-800"
                              : idx === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {(productPage - 1) * PRODUCTS_PER_PAGE + idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{name}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {qty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {((qty / summaryStats.totalQuantity) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Product Pagination */}
            {sortedProducts.length > PRODUCTS_PER_PAGE && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  disabled={productPage === 1}
                  onClick={() => setProductPage((p) => p - 1)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {productPage} of {totalProductPages}
                </span>
                <button
                  disabled={productPage === totalProductPages}
                  onClick={() => setProductPage((p) => p + 1)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No sales data available for the selected filters
          </p>
        )}
      </div>

      {/* Bulk Operations */}
      {selectedSales.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">
                {selectedSales.length} sale
                {selectedSales.length !== 1 ? "s" : ""} selected
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-yellow-600">Revenue:</span>
                  <span className="font-semibold text-yellow-800 ml-1">
                    {formatCurrency(
                      selectedSales.reduce((sum, id) => {
                        const sale = sales.find((s) => s._id === id);
                        return sum + (sale?.totalAmount || 0);
                      }, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-600">Profit:</span>
                  <span className="font-semibold text-green-600 ml-1">
                    {formatCurrency(
                      selectedSales.reduce((sum, id) => {
                        const sale = sales.find((s) => s._id === id);
                        return sum + (sale?.profit || 0);
                      }, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-600">Quantity:</span>
                  <span className="font-semibold text-yellow-800 ml-1">
                    {selectedSales.reduce((sum, id) => {
                      const sale = sales.find((s) => s._id === id);
                      return sum + (sale?.quantity || 0);
                    }, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSales([])}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                🗑️ Bulk Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-gray-600 text-sm">
          Showing{" "}
          <span className="font-semibold">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
          </span>{" "}
          -{" "}
          <span className="font-semibold">
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)}
          </span>{" "}
          of <span className="font-semibold">{filteredSales.length}</span> sales
        </div>

        {filteredSales.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalPages}</span> page
            {totalPages !== 1 ? "s" : ""} total
          </div>
        )}
      </div>

      {/* Sales Table */}
      {filteredSales.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedSales.length === paginatedSales.length &&
                        paginatedSales.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSales.includes(sale._id)}
                        onChange={() => handleSelectSale(sale._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {sale.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(sale.date || sale.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sale.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatCurrency(sale.salePrice)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      {formatCurrency(sale.profit)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteSale(sale)}
                        disabled={deletingId === sale._id}
                        className={`px-3 py-1 text-red-600 hover:text-red-800 font-medium rounded-lg border border-red-200 hover:border-red-300 transition-colors ${
                          deletingId === sale._id
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-red-50"
                        }`}
                      >
                        {deletingId === sale._id ? (
                          <span className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-1 border-red-600"></div>
                            Deleting...
                          </span>
                        ) : (
                          "🗑️ Delete"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No sales found
          </h3>
          <p className="text-gray-500">
            {searchTerm ||
            dateRange.start !==
              new Date(new Date().setDate(new Date().getDate() - 30))
                .toISOString()
                .split("T")[0]
              ? "Try adjusting your search or date range to see more results."
              : "No sales data available. Sales will appear here once recorded."}
          </p>
        </div>
      )}

      {/* Sales Pagination Controls */}
      {filteredSales.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;

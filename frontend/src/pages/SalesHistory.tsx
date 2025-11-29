import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Sale, Product } from "../types/index";
import { saleAPI, productAPI } from "../services/api";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import DateRangePresets from "../components/DateRangePresets";
import { generatePrintReport } from "../utils/printUtils";

const SalesHistory: React.FC = () => {
  // ... ALL EXISTING STATE AND LOGIC REMAINS EXACTLY THE SAME ...
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 5;
  const [productPage, setProductPage] = useState(1);

  // ... ALL EXISTING USE EFFECTS, USE MEMOS, AND FUNCTIONS REMAIN EXACTLY THE SAME ...
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

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE) || 1;
  const paginatedSales = useMemo(
    () =>
      filteredSales.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [filteredSales, currentPage, ITEMS_PER_PAGE]
  );

  useEffect(() => {
    setCurrentPage(1);
    setProductPage(1);
  }, [dateRange, searchTerm]);

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

  const sortedProducts = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number }> = {};

    filteredSales.forEach((s) => {
      if (!counts[s.productId]) {
        counts[s.productId] = { name: s.productName, quantity: 0 };
      }
      counts[s.productId].quantity += s.quantity;
    });

    return Object.entries(counts).sort((a, b) => b[1].quantity - a[1].quantity);
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

  const handlePrintReport = () => {
    generatePrintReport(filteredSales, dateRange, summaryStats);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSales(paginatedSales.map((sale) => sale._id));
    } else {
      setSelectedSales([]);
    }
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

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

      const deleteOperations = selectedSales.map((id) =>
        saleAPI.deleteSale(id)
      );

      await Promise.all(deleteOperations);

      setSales(sales.filter((s) => !selectedSales.includes(s._id)));

      const updatedProducts = await productAPI.getProducts();
      setProducts(updatedProducts);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-cyan-200 font-medium">
            Loading sales history...
          </div>
          <div className="text-sm text-cyan-400 mt-2">
            Crunching the numbers
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl text-red-400 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
                Sales History
              </h1>
              <p className="text-gray-300">
                Comprehensive sales analysis and insights
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                {showAdvancedAnalytics
                  ? "📊 Hide Analytics"
                  : "📈 Show Analytics"}
              </button>
              <button
                onClick={exportToCSV}
                disabled={exporting || filteredSales.length === 0}
                className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 disabled:opacity-50 transition-all duration-300 shadow-lg"
              >
                {exporting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </span>
                ) : (
                  "📥 Export CSV"
                )}
              </button>
              <button
                onClick={handlePrintReport}
                disabled={filteredSales.length === 0}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 disabled:opacity-50 transition-all duration-300 shadow-lg"
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Revenue",
              value: summaryStats.totalRevenue,
              color: "text-green-400",
              bg: "bg-green-500/10",
              border: "border-green-500/20",
            },
            {
              label: "Profit",
              value: summaryStats.totalProfit,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
            {
              label: "Sales",
              value: summaryStats.totalSales,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
            },
            {
              label: "Quantity",
              value: summaryStats.totalQuantity,
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              border: "border-orange-500/20",
            },
            {
              label: "Avg Order",
              value: summaryStats.avgOrderValue,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              border: "border-cyan-500/20",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-all duration-300 ${stat.bg} ${stat.border}`}
            >
              <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                {stat.label}
              </h3>
              <p className={`text-lg font-bold ${stat.color} mt-2 truncate`}>
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
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-cyan-300 mb-3">
                Search Products
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-3">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300"
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
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">
            Product Sales Ranking
          </h3>
          {sortedProducts.length ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                        Sold
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paginatedProducts.map(([id, data], idx) => (
                      <tr
                        key={id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              idx === 0
                                ? "bg-yellow-500/20 text-yellow-300"
                                : idx === 1
                                ? "bg-gray-500/20 text-gray-300"
                                : idx === 2
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {(productPage - 1) * PRODUCTS_PER_PAGE + idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          {data.name}
                        </td>
                        <td className="px-4 py-3 font-bold text-cyan-400">
                          {data.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-bold text-green-400">
                          {(
                            (data.quantity / summaryStats.totalQuantity) *
                            100
                          ).toFixed(1)}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Product Pagination */}
              {sortedProducts.length > PRODUCTS_PER_PAGE && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    disabled={productPage === 1}
                    onClick={() => setProductPage((p) => p - 1)}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-300 font-medium">
                    {productPage} / {totalProductPages}
                  </span>
                  <button
                    disabled={productPage === totalProductPages}
                    onClick={() => setProductPage((p) => p + 1)}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl text-gray-500 mb-4">📊</div>
              <p className="text-gray-400">No sales data available</p>
            </div>
          )}
        </div>

        {/* Bulk Operations */}
        {selectedSales.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-yellow-300 text-lg">
                  {selectedSales.length} sale
                  {selectedSales.length !== 1 ? "s" : ""} selected
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-yellow-400">Revenue:</span>
                    <span className="font-bold text-yellow-300 ml-2">
                      {formatCurrency(
                        selectedSales.reduce((sum, id) => {
                          const sale = sales.find((s) => s._id === id);
                          return sum + (sale?.totalAmount || 0);
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-400">Profit:</span>
                    <span className="font-bold text-green-400 ml-2">
                      {formatCurrency(
                        selectedSales.reduce((sum, id) => {
                          const sale = sales.find((s) => s._id === id);
                          return sum + (sale?.profit || 0);
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-400">Quantity:</span>
                    <span className="font-bold text-yellow-300 ml-2">
                      {selectedSales.reduce((sum, id) => {
                        const sale = sales.find((s) => s._id === id);
                        return sum + (sale?.quantity || 0);
                      }, 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSales([])}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-6 py-3 bg-red-600/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition-colors flex items-center gap-2"
                >
                  🗑️ Bulk Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <div className="text-gray-400">
            Showing{" "}
            <span className="font-semibold text-white">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-white">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredSales.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-white">
              {filteredSales.length}
            </span>
          </div>

          {filteredSales.length > 0 && (
            <div className="text-gray-400">
              <span className="font-semibold text-white">{totalPages}</span>{" "}
              page
              {totalPages !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Sales Table */}
        {filteredSales.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          selectedSales.length === paginatedSales.length &&
                          paginatedSales.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paginatedSales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSales.includes(sale._id)}
                          onChange={() => handleSelectSale(sale._id)}
                          className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {sale.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(
                          sale.date || sale.createdAt
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {sale.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {formatCurrency(sale.salePrice)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-400">
                        {formatCurrency(sale.profit)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteSale(sale)}
                          disabled={deletingId === sale._id}
                          className={`px-4 py-2 text-red-400 hover:text-red-300 font-medium rounded-xl border border-red-500/30 hover:border-red-400 transition-colors ${
                            deletingId === sale._id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-red-500/10"
                          }`}
                        >
                          {deletingId === sale._id ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
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
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
            <div className="text-6xl text-gray-500 mb-6">📊</div>
            <h3 className="text-xl font-medium text-white mb-3">
              No sales found
            </h3>
            <p className="text-gray-400">
              {searchTerm ||
              dateRange.start !==
                new Date(new Date().setDate(new Date().getDate() - 30))
                  .toISOString()
                  .split("T")[0]
                ? "Try adjusting your search or date range."
                : "No sales data available for the selected period."}
            </p>
          </div>
        )}

        {/* Sales Pagination Controls */}
        {filteredSales.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center items-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-300 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesHistory;

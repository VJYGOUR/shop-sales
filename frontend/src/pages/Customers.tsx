import React, { useState, useEffect, useCallback } from "react";
import { exportToCSV, formatCustomersForExport } from "../utils/exportUtils";

import { saleAPI } from "../services/api";

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

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadCustomersData = useCallback(async () => {
    try {
      setLoading(true);
      const sales = await saleAPI.getSales();

      // Generate customer data from sales
      const customerMap = new Map();
      let customerId = 1;

      sales.forEach((sale) => {
        // Create customer identifier from product name (in real app, use actual customer data)
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
        customer.totalSpent += sale.totalAmount;
        customer.totalOrders += 1;

        // Update last purchase date
        const saleDate = new Date(sale.date || sale.createdAt);
        const lastPurchaseDate = new Date(customer.lastPurchase);
        if (saleDate > lastPurchaseDate) {
          customer.lastPurchase = sale.date || sale.createdAt;
        }

        // Update first purchase date
        const firstPurchaseDate = new Date(customer.firstPurchase);
        if (saleDate < firstPurchaseDate) {
          customer.firstPurchase = sale.date || sale.createdAt;
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomersData();
  }, [loadCustomersData]);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate customer metrics
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );
  const avgOrderValue =
    totalCustomers > 0
      ? totalRevenue /
        customers.reduce((sum, customer) => sum + customer.totalOrders, 0)
      : 0;
  const repeatCustomers = customers.filter(
    (customer) => customer.totalOrders > 1
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Customer Management
        </h1>
        <p className="text-gray-600">
          View and manage your customer relationships
        </p>
        <button
          onClick={() =>
            exportToCSV(formatCustomersForExport(customers), "customers")
          }
          className="mt-4 sm:mt-0 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors ml-2"
        >
          Export CSV
        </button>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {totalCustomers}
              </p>
            </div>
            <div className="text-2xl text-blue-500">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="text-2xl text-green-500">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg Order Value
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(avgOrderValue)}
              </p>
            </div>
            <div className="text-2xl text-purple-500">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Repeat Customers
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {repeatCustomers}
              </p>
            </div>
            <div className="text-2xl text-orange-500">🔄</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Customers
          </label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Customers ({filteredCustomers.length})
          </h3>
        </div>

        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Purchase
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Since
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.totalOrders > 1
                            ? "Repeat Customer"
                            : "New Customer"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {customer.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.totalOrders > 1
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {customer.totalOrders} orders
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.lastPurchase)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.firstPurchase)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-500 text-lg mb-2">No customers found</p>
            <p className="text-gray-400 mb-4">
              {customers.length === 0
                ? "Start making sales to see customer data here"
                : "Try adjusting your search"}
            </p>
          </div>
        )}
      </div>

      {/* Customer Insights */}
      {customers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Customer Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((repeatCustomers / totalCustomers) * 100)}%
              </div>
              <div className="text-sm text-blue-800">Repeat Rate</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(avgOrderValue)}
              </div>
              <div className="text-sm text-green-800">Average Order Value</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {customers.reduce(
                  (sum, customer) => sum + customer.totalOrders,
                  0
                )}
              </div>
              <div className="text-sm text-purple-800">Total Orders</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  customers.reduce(
                    (sum, customer) => sum + customer.totalOrders,
                    0
                  ) / totalCustomers
                )}
              </div>
              <div className="text-sm text-orange-800">
                Avg Orders per Customer
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

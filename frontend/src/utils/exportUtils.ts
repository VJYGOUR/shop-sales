import type { Sale, Product } from "../types/index";

// Define interface for export data
interface ExportData {
  [key: string]: string | number;
}

// Export to CSV function
export const exportToCSV = (data: ExportData[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to JSON function
export const exportToJSON = (data: ExportData[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.json`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format sales data for export
export const formatSalesForExport = (sales: Sale[]): ExportData[] => {
  return sales.map((sale) => ({
    "Sale ID": sale._id,
    "Product Name": sale.productName,
    Quantity: sale.quantity,
    "Sale Price": sale.salePrice,
    "Cost Price": sale.costPrice,
    "Total Amount": sale.totalAmount,
    Profit: sale.profit,
    Date: new Date(sale.date || sale.createdAt).toLocaleDateString("en-US"),
    Time: new Date(sale.date || sale.createdAt).toLocaleTimeString("en-US"),
    Notes: sale.notes || "",
  }));
};

// Format inventory data for export
export const formatInventoryForExport = (products: Product[]): ExportData[] => {
  return products.map((product) => ({
    "Product ID": product._id,
    "Product Name": product.name,
    SKU: product.sku || "",
    Category: product.category || "",
    "Stock Quantity": product.stock,
    "Cost Price": product.costPrice,
    "Sale Price": product.salePrice,
    "Stock Value": (product.stock * product.costPrice).toFixed(2),
    Status:
      product.stock === 0
        ? "Out of Stock"
        : product.stock <= 5
        ? "Low Stock"
        : "In Stock",
    "Last Updated": new Date(
      product.updatedAt || product.createdAt
    ).toLocaleDateString("en-US"),
  }));
};

// Customer interface for export
interface CustomerExportData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  firstPurchase: string;
}

// Format customer data for export
export const formatCustomersForExport = (
  customers: CustomerExportData[]
): ExportData[] => {
  return customers.map((customer) => ({
    "Customer Name": customer.name,
    Email: customer.email,
    Phone: customer.phone || "",
    "Total Orders": customer.totalOrders,
    "Total Spent": customer.totalSpent,
    "Average Order Value": (customer.totalSpent / customer.totalOrders).toFixed(
      2
    ),
    "Last Purchase": new Date(customer.lastPurchase).toLocaleDateString(
      "en-US"
    ),
    "First Purchase": new Date(customer.firstPurchase).toLocaleDateString(
      "en-US"
    ),
    "Customer Type":
      customer.totalOrders > 1 ? "Repeat Customer" : "New Customer",
  }));
};

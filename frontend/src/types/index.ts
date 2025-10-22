export interface CreateSaleData {
  productId: string;
  quantity: number;
  totalAmount: number;
  notes?: string;
}

export interface CreateProductData {
  name: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  category?: string;
  sku?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
}

// In your types/index.ts
export interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  outOfStockCount: number;
  lowStockCount: number;
  dailySales: number;
  monthlySales: number;
  dailyProfit: number;
  monthlyProfit: number;
}
//
export interface Sale {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  salePrice: number;
  costPrice: number;
  profit: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Product {
  _id: string;
  name: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  category?: string;
  sku?: string;
  barcode?: string; // Add barcode field
  qrCode?: string; // Add QR code field
  createdAt: string;
  updatedAt: string;
}
// Barcode/QR Code types
export interface BarcodeData {
  productId: string;
  productName: string;
  sku?: string;
  price: number;
}

export interface ScanResult {
  success: boolean;
  product?: Product;
  error?: string;
}

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
export interface ProductImage {
  _id: string;
  url: string;
  public_id: string;
  position: number;
  isPrimary: boolean;
}
export interface Product {
  _id: string;
  name: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  category?: string;
  images?: ProductImage[]; //
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
export interface DateRange {
  start: string;
  end: string;
}

export interface SalesTrend {
  date: string;
  revenue: number;
  profit: number;
  quantity: number;
  orders: number;
}

export interface ProductPerformance {
  productName: string;
  revenue: number;
  profit: number;
  quantity: number;
  profitMargin: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}
export interface PrintSale {
  productName: string;
  date: string;
  createdAt: string;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  profit: number;
}

export interface PrintDateRange {
  start: string;
  end: string;
}

export interface PrintSummaryStats {
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  totalQuantity: number;
  avgOrderValue: number;
}

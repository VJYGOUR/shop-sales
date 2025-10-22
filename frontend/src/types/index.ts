export interface Product {
  _id: string;
  name: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  category?: string;
  sku?: string;
  createdAt: string;
  updatedAt: string;
}

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
  notes?: string;
  createdAt: string;
}

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

import axiosInstance from "../axios/axiosInstance";
import type {
  Product,
  Sale,
  CreateSaleData,
  CreateProductData,
  ApiResponse,
} from "../types/index";

// Products API
export const productAPI = {
  getProducts: async (): Promise<Product[]> => {
    const response = await axiosInstance.get<ApiResponse<Product[]>>(
      "/products"
    );
    // console.log(response.data.data);
    return response.data.data || [];
  },

  createProduct: async (productData: CreateProductData): Promise<Product> => {
    const response = await axiosInstance.post<ApiResponse<Product>>(
      "/products/create",
      productData
    );
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await axiosInstance.get<ApiResponse<Product>>(
      `/products/${id}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },
  // In services/api.ts - add to productAPI
  updateProduct: async (
    id: string,
    updateData: Partial<Product>
  ): Promise<Product> => {
    const response = await axiosInstance.patch<ApiResponse<Product>>(
      `/products/${id}/update`,
      updateData
    );
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },
  // ADDED: deleteProduct method
  deleteProduct: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/products/${id}/delete`
    );
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
  },
};

// Sales API
export const saleAPI = {
  getSales: async (): Promise<Sale[]> => {
    const response = await axiosInstance.get<ApiResponse<Sale[]>>("/sales");
    return response.data.data || [];
  },

  createSale: async (saleData: CreateSaleData): Promise<Sale> => {
    const response = await axiosInstance.post<ApiResponse<Sale>>(
      "/sales/create",
      saleData
    );
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
    return response.data.data!;
  },
  deleteSale: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      `/sales/${id}/delete`
    );
    if (!response.data.success) {
      throw new Error(response.data.error);
    }
  },
};

// You might want to add error handling for production
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

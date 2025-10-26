import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../axios/axiosInstance";
import ProductForm from "../components/ProductForm";

interface ProductImage {
  _id: string;
  url: string;
  public_id: string;
  position: number;
  isPrimary: boolean;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  category: string;
  sku: string;
  images: ProductImage[];
  user: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  costPrice: number | string;
  salePrice: number | string;
  stock: number;
  category: string;
  sku: string;
  images: ProductImage[];
}

interface ApiError {
  response?: {
    data?: {
      message: string;
      error?: string;
    };
  };
  message: string;
}

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await axiosInstance.get<{
          success: boolean;
          data: Product;
        }>(`/products/${id}`);

        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          setError("Product not found");
        }
      } catch (err: unknown) {
        const error = err as ApiError;
        setError(
          error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to load product"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (formData: ProductFormData) => {
    if (!id) return;

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const submitData = {
        name: formData.name,
        description: formData.description,
        costPrice:
          typeof formData.costPrice === "string"
            ? parseFloat(formData.costPrice)
            : formData.costPrice,
        salePrice:
          typeof formData.salePrice === "string"
            ? parseFloat(formData.salePrice)
            : formData.salePrice,
        stock: formData.stock,
        category: formData.category,
        sku: formData.sku,
      };

      const response = await axiosInstance.put<{
        success: boolean;
        data: Product;
      }>(`/products/${id}`, submitData);

      if (response.data.success) {
        setProduct(response.data.data);
        setSuccess("Product updated successfully!");
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.delete<{
        success: boolean;
        message: string;
      }>(`/products/${id}`);

      if (response.data.success) {
        setSuccess("Product deleted successfully!");
        setTimeout(() => {
          navigate("/products");
        }, 1500);
      }
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to delete product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-24 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Error
              </div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Link
                to="/products"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                ← Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-2">
                Update your product information and images
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Products
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {product && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProductForm
              product={product}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />

            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-medium text-red-700 mb-4">
                Danger Zone
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Delete this product
                    </h4>
                    <p className="text-sm text-red-600 mt-1">
                      Once you delete a product, there is no going back. Please
                      be certain.
                    </p>
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Deleting..." : "Delete Product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductEdit;

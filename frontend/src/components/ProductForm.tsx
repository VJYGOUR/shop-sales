import React, { useState } from "react";
import ProductImageGallery from "./ProductImageGallery";

// Types
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
  createdAt?: string;
  updatedAt?: string;
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

interface ProductFormProps {
  product?: Product;
  onSubmit: (productData: ProductFormData) => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || "",
    description: product?.description || "",
    costPrice: product?.costPrice || "",
    salePrice: product?.salePrice || "",
    stock: product?.stock || 0,
    category: product?.category || "",
    sku: product?.sku || "Auto-generated on save", // Show placeholder for new products
    images: product?.images || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert string prices to numbers before submitting
    const submitData: ProductFormData = {
      ...formData,
      costPrice:
        typeof formData.costPrice === "string"
          ? parseFloat(formData.costPrice) || 0
          : formData.costPrice,
      salePrice:
        typeof formData.salePrice === "string"
          ? parseFloat(formData.salePrice) || 0
          : formData.salePrice,
      // Don't send SKU for new products - backend will generate it
      sku: product?._id ? formData.sku : "",
    };

    onSubmit(submitData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "costPrice" || name === "salePrice" || name === "stock"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleImagesUpdate = (images: ProductImage[]) => {
    setFormData((prev) => ({
      ...prev,
      images,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Product Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Electronics, Clothing"
          />
        </div>

        <div>
          <label
            htmlFor="costPrice"
            className="block text-sm font-medium text-gray-700"
          >
            Cost Price *
          </label>
          <input
            type="number"
            id="costPrice"
            name="costPrice"
            value={formData.costPrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="salePrice"
            className="block text-sm font-medium text-gray-700"
          >
            Sale Price *
          </label>
          <input
            type="number"
            id="salePrice"
            name="salePrice"
            value={formData.salePrice}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="stock"
            className="block text-sm font-medium text-gray-700"
          >
            Stock *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* READ-ONLY SKU FIELD */}
        <div>
          <label
            htmlFor="sku"
            className="block text-sm font-medium text-gray-700"
          >
            SKU (Stock Keeping Unit)
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            readOnly // Make it read-only
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 text-gray-500 cursor-not-allowed"
            placeholder="Auto-generated on save"
          />
          <p className="text-xs text-gray-500 mt-1">
            {product?._id
              ? "SKU cannot be changed"
              : "SKU will be auto-generated when you save"}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Describe your product..."
        />
      </div>

      {/* Image Gallery - Only show for existing products */}
      {product?._id && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Product Images
          </label>
          <ProductImageGallery
            productId={product._id}
            images={formData.images}
            onImagesUpdate={handleImagesUpdate}
            editable={true}
          />
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
            ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }
            text-white
          `}
        >
          {isLoading
            ? "Saving..."
            : product
            ? "Update Product"
            : "Create Product"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;

import React, { useState, useRef } from "react";
import axiosInstance from "../axios/axiosInstance";

// Types
interface ProductImage {
  _id: string;
  url: string;
  public_id: string;
  position: number;
  isPrimary: boolean;
}

interface ProductImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesUpdate: (images: ProductImage[]) => void;
  editable?: boolean;
}

interface UploadResponse {
  success: boolean;
  message: string;
  images: ProductImage[];
  product: {
    images: ProductImage[];
  };
}

interface DeleteResponse {
  success: boolean;
  message: string;
  product: {
    images: ProductImage[];
  };
}

interface PrimaryResponse {
  success: boolean;
  message: string;
  product: {
    images: ProductImage[];
  };
}

interface ApiError {
  response?: {
    data?: {
      message: string;
    };
  };
  message: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  productId,
  images,
  onImagesUpdate,
  editable = true,
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        setError("Please select only image files");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be smaller than 5MB");
        return;
      }
    }

    await uploadImages(fileArray);
  };

  const uploadImages = async (files: File[]) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("productImages", file);
      });

      const response = await axiosInstance.post<UploadResponse>(
        `/products/${productId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onImagesUpdate(response.data.product.images);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message || error.message || "Upload failed"
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const deleteImage = async (imageId: string) => {
    setIsDeleting(imageId);
    setError("");

    try {
      const response = await axiosInstance.delete<DeleteResponse>(
        `/products/${productId}/images/${imageId}`
      );

      onImagesUpdate(response.data.product.images);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message || error.message || "Delete failed"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const setAsPrimary = async (imageId: string) => {
    try {
      const response = await axiosInstance.patch<PrimaryResponse>(
        `/products/${productId}/images/${imageId}/primary`
      );

      onImagesUpdate(response.data.product.images);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to set primary image"
      );
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      uploadImages(Array.from(files));
    }
  };

  const primaryImage = images.find((img) => img.isPrimary);
  const secondaryImages = images.filter((img) => !img.isPrimary);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {editable && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed border-gray-300 rounded-lg p-6 text-center
            transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50
            ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Uploading images...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Drag & drop images here
                </p>
                <p className="text-xs text-gray-500">
                  or click to browse (max 10 images, 5MB each)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Images Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          {/* Primary Image */}
          {primaryImage && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Primary Image
              </label>
              <div className="relative group">
                <img
                  src={primaryImage.url}
                  alt="Primary product"
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
                {editable && (
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteImage(primaryImage._id)}
                      disabled={isDeleting === primaryImage._id}
                      className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      title="Delete image"
                    >
                      {isDeleting === primaryImage._id ? "⋯" : "×"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Secondary Images */}
          {secondaryImages.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Images ({secondaryImages.length})
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {secondaryImages.map((image) => (
                  <div key={image._id} className="relative group">
                    <img
                      src={image.url}
                      alt="Product"
                      className="w-full h-32 object-cover rounded-lg shadow-sm"
                    />
                    {editable && (
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg flex items-center justify-center space-x-1 transition-all opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setAsPrimary(image._id)}
                          className="w-8 h-8 bg-white text-gray-700 rounded-full flex items-center justify-center text-xs hover:bg-gray-100 transition-colors"
                          title="Set as primary"
                        >
                          ⭐
                        </button>
                        <button
                          onClick={() => deleteImage(image._id)}
                          disabled={isDeleting === image._id}
                          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Delete image"
                        >
                          {isDeleting === image._id ? "⋯" : "×"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        multiple
        className="hidden"
      />
    </div>
  );
};

export default ProductImageGallery;

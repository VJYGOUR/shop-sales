import React, { useState, useRef } from "react";
import axiosInstance from "../axios/axiosInstance";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  size?: "sm" | "md" | "lg";
}

interface UploadResponse {
  success: boolean;
  message: string;
  profileImage: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
    plan: string;
    businessName: string;
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

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  currentImage,
  size = "md",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-20 h-20", icon: "w-4 h-4" },
    md: { container: "w-32 h-32", icon: "w-6 h-6" },
    lg: { container: "w-48 h-48", icon: "w-8 h-8" },
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Quick validation
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await axiosInstance.post<UploadResponse>(
        "/upload/profile-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Now we get the actual Cloudinary URL
      onImageUpload(response.data.profileImage);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message || error.message || "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };
  const handleClick = () => {
    setError("");
    fileInputRef.current?.click();
  };

  const defaultAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Image Preview with Upload */}
      <div className="relative group">
        <div
          className={`
            ${sizeConfig[size].container} 
            rounded-full overflow-hidden 
            border-4 border-white 
            shadow-lg cursor-pointer
            transition-all duration-200
            group-hover:shadow-xl
          `}
          onClick={handleClick}
        >
          <img
            src={currentImage || defaultAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
          />

          {/* Upload Overlay */}
          <div
            className={`
            absolute inset-0 bg-black bg-opacity-40 
            rounded-full flex items-center justify-center 
            transition-all duration-200
            ${isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
          `}
          >
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className={`${sizeConfig[size].icon} text-white`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            isUploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }
          text-white
        `}
      >
        {isUploading ? "Uploading..." : "Change Photo"}
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-red-600 text-sm text-center max-w-xs">{error}</p>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;

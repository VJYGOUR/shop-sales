import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axios/axiosInstance";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  message: string;
}

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState<string>("Verifying your email...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    let isExecuted = false; // prevent double execution in React 18 Strict Mode

    const verifyEmailToken = async () => {
      if (isExecuted) return;
      isExecuted = true;

      try {
        const token = searchParams.get("token");
        console.log("Token from URL:", token);

        if (!token) {
          setMessage("Invalid verification link. No token provided.");
          setIsLoading(false);
          return;
        }

        const response = await axiosInstance.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        console.log("API response:", response.data);

        setMessage("✅ Email verified successfully! You can now log in.");
        setIsSuccess(true);
      } catch (error) {
        console.error("Verification error:", error);
        const axiosError = error as AxiosError<ApiErrorResponse>;
        setMessage(
          `❌ ${axiosError.response?.data?.message || "Verification failed"}`
        );
        setIsSuccess(false);
      } finally {
        setIsLoading(false);

        // Redirect after 3 seconds if successful
        if (isSuccess) {
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      }
    };

    verifyEmailToken();
  }, [searchParams, navigate, isSuccess]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Verifying your email...</p>
              </div>
            ) : (
              <>
                <div
                  className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                    isSuccess ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {isSuccess ? (
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  {isSuccess ? "Email Verified!" : "Verification Failed"}
                </h2>
                <p className="mt-2 text-sm text-gray-600">{message}</p>

                {isSuccess && (
                  <p className="mt-2 text-sm text-gray-500">
                    Redirecting to login page...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

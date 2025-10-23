import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axios/axiosInstance";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  message: string;
}

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const executedRef = useRef(false);

  const [message, setMessage] = useState("Verifying your email...");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (executedRef.current) return;
      executedRef.current = true;

      try {
        const token = searchParams.get("token");
        if (!token) {
          setMessage("Invalid verification link. No token provided.");
          setIsLoading(false);
          return;
        }

        const response = await axiosInstance.get(
          `/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        console.log(response);

        setMessage("✅ Email verified successfully! You can now log in.");
        setIsSuccess(true);
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        setMessage(
          `❌ ${axiosError.response?.data?.message || "Verification failed"}`
        );
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
        if (isSuccess) {
          setTimeout(() => navigate("/login"), 3000);
        }
      }
    };

    verifyEmailToken();
  }, [searchParams, navigate, isSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full"></div>
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
            <h2 className="mt-6 text-2xl font-bold">
              {isSuccess ? "Email Verified!" : "Verification Failed"}
            </h2>
            <p className="mt-2 text-gray-600">{message}</p>
            {isSuccess && (
              <p className="mt-2 text-gray-500">Redirecting to login page...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

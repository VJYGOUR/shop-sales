import { useForm } from "react-hook-form";
import axiosInstance from "../axios/axiosInstance";
import handleApiError from "../utils/handleApiError";
import { useNavigate, Link } from "react-router-dom";
import { useFormMessage } from "../utils/useFormMessage";
import { AxiosError } from "axios";
import { useState, useCallback } from "react";

// Define the form data interface
interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Define the response interface
interface SignupResponse {
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    plan: "free" | "paid";
    businessName: string;
    profileImage?: string;
    avatar?: string;
  };
  verificationEmailSent?: boolean;
}

const Signup = () => {
  const { successMessage, setSuccessMessage, errorMessage, setErrorMessage } =
    useFormMessage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>();

  const password = watch("password");

  const onSubmit = useCallback(
    async (data: SignupForm) => {
      setSuccessMessage("");
      setErrorMessage("");
      setIsLoading(true);

      try {
        const response = await axiosInstance.post<SignupResponse>(
          "/auth/signup",
          {
            name: data.name,
            email: data.email,
            password: data.password,
          }
        );

        console.log("response", response);

        if (response.data.verificationEmailSent === false) {
          setSuccessMessage(
            "Account created successfully! However, we couldn't send the verification email. Please contact support."
          );
        } else {
          setSuccessMessage(
            "Account created successfully! Please check your email for verification link before logging in."
          );
        }
      } catch (error: unknown) {
        console.error("Signup error:", error);
        const axiosError = error as AxiosError<{ message: string }>;
        setErrorMessage(handleApiError(axiosError));
      } finally {
        setIsLoading(false);
      }
    },
    [setSuccessMessage, setErrorMessage]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card Container */}
        <div className="bg-white/5 backdrop-blur-xl shadow-2xl rounded-3xl p-8 space-y-8 border border-white/10 hover:border-cyan-400/30 transition-all duration-500 hover:shadow-cyan-500/10 group">
          {/* Floating Elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-700"></div>

          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"></div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Join Stoq</h2>
              <p className="text-cyan-200 text-sm">
                Start your 14-day free trial. No credit card required.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {successMessage && (
              <div className="bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-200 px-4 py-3 rounded-xl text-sm transition-all duration-500 animate-fadeIn shadow-lg">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">{successMessage}</span>
                </div>
                {successMessage.includes("check your email") && (
                  <div className="mt-3 pl-8 border-t border-emerald-400/20 pt-3">
                    <p className="text-emerald-300 text-xs mb-2">
                      Didn't receive the email? Check your spam folder.
                    </p>
                    <button
                      onClick={() => navigate("/login")}
                      className="text-emerald-400 hover:text-emerald-300 underline text-xs font-medium transition-colors duration-200"
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 px-4 py-3 rounded-xl text-sm transition-all duration-500 animate-fadeIn shadow-lg">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">{errorMessage}</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-3">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-cyan-200"
              >
                Full Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: { value: 2, message: "At least 2 characters" },
                    maxLength: { value: 50, message: "Max 50 characters" },
                  })}
                  placeholder="Enter your full name"
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 placeholder-cyan-200/50 disabled:bg-white/5 disabled:cursor-not-allowed text-white backdrop-blur-sm group-hover:border-cyan-400/30"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="w-5 h-5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              {errors.name && (
                <p className="text-sm text-red-400 animate-fadeIn flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-cyan-200"
              >
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  placeholder="Enter your email"
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 placeholder-cyan-200/50 disabled:bg-white/5 disabled:cursor-not-allowed text-white backdrop-blur-sm group-hover:border-cyan-400/30"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="w-5 h-5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
              {errors.email && (
                <p className="text-sm text-red-400 animate-fadeIn flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-cyan-200"
              >
                Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  id="password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" },
                    maxLength: { value: 20, message: "Max 20 characters" },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: "Must include uppercase, lowercase & number",
                    },
                  })}
                  placeholder="Enter your password"
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 placeholder-cyan-200/50 disabled:bg-white/5 disabled:cursor-not-allowed text-white backdrop-blur-sm group-hover:border-cyan-400/30"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="w-5 h-5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400 animate-fadeIn flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-3">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-cyan-200"
              >
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  type="password"
                  id="confirmPassword"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === password || "Passwords do not match",
                  })}
                  placeholder="Confirm your password"
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 placeholder-cyan-200/50 disabled:bg-white/5 disabled:cursor-not-allowed text-white backdrop-blur-sm group-hover:border-cyan-400/30"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="w-5 h-5 text-cyan-400/70 group-hover:text-cyan-400 transition-colors duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-400 animate-fadeIn flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 group relative overflow-hidden hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="relative">Creating Account...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 relative"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span className="relative">Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-white/10">
            <p className="text-sm text-cyan-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-all duration-300 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Enhanced Email verification info */}
          <div className="bg-cyan-500/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-4 group hover:border-cyan-400/30 transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-cyan-200 font-medium">
                  Verify your email to get started
                </p>
                <p className="text-xs text-cyan-300 mt-1">
                  We'll send you a verification link to activate your account
                  and unlock all features.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

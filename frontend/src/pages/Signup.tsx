import { useForm } from "react-hook-form";

import axiosInstance from "../axios/axiosInstance";
import handleApiError from "../utils/handleApiError";
import { useNavigate } from "react-router-dom";
import { useFormMessage } from "../utils/useFormMessage";

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
  };
}

const Signup = () => {
  const {
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    
  } = useFormMessage();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>();

  const onSubmit = async (data: SignupForm) => {
    setSuccessMessage("");
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
      setSuccessMessage(
        "Account created successfully! Redirecting to login..."
      );
      navigate("/login");
    } catch (error) {
      setErrorMessage(handleApiError(error));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Create Your Account
        </h2>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-100 text-green-800 p-3 rounded-md text-center">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 50, message: "Max 50 characters" },
              })}
              placeholder="Enter your full name"
              className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
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
              className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
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
              className="mt-1 block w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

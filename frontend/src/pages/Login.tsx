import { useForm } from "react-hook-form";
import axiosInstance from "../axios/axiosInstance";
import handleApiError from "../utils/handleApiError";
import { useAuth } from "../utils/AuthContext";
import { useFormMessage } from "../utils/useFormMessage";
import { useNavigate } from "react-router-dom";

// Define the form data interface
interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const {
    successMessage,
    setSuccessMessage,
    errorMessage,
    setErrorMessage,
    resetMessages,
  } = useFormMessage();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    resetMessages();
    try {
      const response = await axiosInstance.post("/auth/login", data);
      console.log("response is", response);
      setSuccessMessage("Logged in successfully!");
      await login(); // refreshUser will fetch the user info
      navigate("/dashboard");
    } catch (err) {
      setErrorMessage(handleApiError(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Login to Your Account
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
                  value: /^\S+@\S+$/i,
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
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
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
            className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true, // ✅ For cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Remove the interceptor - cookies are sent automatically
// No need for manual token handling

export default axiosInstance;

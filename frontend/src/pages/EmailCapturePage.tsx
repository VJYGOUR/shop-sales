import { useState } from "react";
import axiosInstance from "../axios/axiosInstance";
import handleApiError from "../utils/handleApiError";

export default function EmailCapturePage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await axiosInstance.post("/auth/resend-verification", {
        email,
      });
      setMessage(res.data?.message || "Request sent.");
    } catch (error: unknown) {
      setMessage(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Resend Verification Email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your email and we'll send you a new verification link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-xl border border-gray-300"
          />

          <button
            type="submit"
            className="w-full p-3 rounded-xl text-lg bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Verification Email"}
          </button>

          {message && (
            <p className="text-center text-gray-700 mt-3">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
}

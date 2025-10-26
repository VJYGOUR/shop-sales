// src/pages/BillingPage.tsx
import { useAuth } from "../utils/AuthContext";
import { PLANS } from "../utils/plans";
import { useState } from "react";
import axiosInstance from "../axios/axiosInstance";

// Interfaces
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  key: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

// Extended User interface for phone number access
interface UserWithPhone {
  name?: string;
  email?: string;
  plan?: string;
  phoneNumber?: string;
  phone?: string;
  mobile?: string;
  contact?: string;
}

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): {
        open: () => void;
      };
    };
  }
}

const BillingPage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (): Promise<void> => {
    // Clear Razorpay cache before opening
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("razorpay") || key.includes("rzp")) {
          localStorage.removeItem(key);
        }
      });
    }
    try {
      setLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your connection.");
        return;
      }

      // Create order
      const orderResponse = await axiosInstance.post<RazorpayOrder>(
        "/billing/create-order"
      );
      const { id, amount, currency, key } = orderResponse.data;

      // FIXED: Safe phone number access without 'any'
      const getUserPhoneNumber = (): string => {
        if (!user) return "";

        // Type-safe access to potential phone number fields
        const userWithPhone = user as UserWithPhone;
        return (
          userWithPhone?.phoneNumber ||
          userWithPhone?.phone ||
          userWithPhone?.mobile ||
          userWithPhone?.contact ||
          "" // Fallback to empty string
        );
      };

      // Razorpay options
      const options: RazorpayOptions = {
        key: key,
        amount: amount,
        currency: currency,
        name: "Stoq",
        description: "Professional Plan Subscription",
        order_id: id,
        handler: async function (response: RazorpayResponse) {
          try {
            console.log("Payment successful, verifying...", response);

            // Verify payment
            await axiosInstance.post("/billing/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert("Payment successful! Your plan has been upgraded.");
            window.location.reload();
          } catch (error) {
            console.error("Payment verification failed:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: getUserPhoneNumber(), // ← FIXED: Safe phone number access
        },
        theme: {
          color: "#4F46E5",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            console.log("Payment modal closed");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Upgrade failed:", error);
      alert("Upgrade failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (): Promise<void> => {
    try {
      await refreshUser();
      if (user?.plan === "paid") {
        alert("Payment verified! Your plan has been upgraded.");
        window.location.reload();
      } else {
        alert(
          "Payment still processing or failed. Please try the payment again."
        );
      }
    } catch (error) {
      console.error("Manual verification failed:", error);
      alert("Error checking payment status.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Plan</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold">{PLANS.free.name}</h2>
          <p className="text-3xl font-bold my-4">${PLANS.free.price}/month</p>
          <ul className="space-y-2 mb-6">
            {PLANS.free.limits.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span>✓</span>
                <span className="ml-2">{feature.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
          {user?.plan === "free" && (
            <button
              disabled
              className="bg-gray-400 text-white px-4 py-2 rounded w-full"
            >
              Current Plan
            </button>
          )}
        </div>

        {/* Paid Plan */}
        <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold">{PLANS.paid.name}</h2>
          <p className="text-3xl font-bold my-4">${PLANS.paid.price}/month</p>
          <ul className="space-y-2 mb-6">
            {PLANS.paid.limits.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span>✓</span>
                <span className="ml-2">{feature.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
          {user?.plan === "free" && (
            <>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
              >
                {loading ? "Processing..." : "Upgrade to Professional"}
              </button>

              {/* Manual Verification Button */}
              <button
                onClick={handleManualVerify}
                className="mt-3 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 w-full"
              >
                Check Payment Status
              </button>

              {/* Test Payment Instructions */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="font-semibold text-yellow-800">Test Payment:</p>
                <p className="text-yellow-700">Card: 4111 1111 1111 1111</p>
                <p className="text-yellow-700">Expiry: 12/34 | CVV: 123</p>
              </div>
            </>
          )}
          {user?.plan === "paid" && (
            <button
              disabled
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              Current Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;

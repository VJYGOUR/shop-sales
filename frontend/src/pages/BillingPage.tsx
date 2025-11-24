import { useState } from "react";
import { useAuth } from "../utils/AuthContext";
import axios from "../axios/axiosInstance";

interface PriceData {
  tier: string;
  monthly: number;
  yearly: number;
  serviceOne: string;
  serviceTwo: string;
  serviceThree: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

const priceData: PriceData[] = [
  {
    tier: "Basic",
    monthly: 19,
    yearly: 199,
    serviceOne: "500 GB Storage",
    serviceTwo: "500 GB Storage",
    serviceThree: "500 GB Storage",
  },
  {
    tier: "Professional",
    monthly: 270,
    yearly: 2099,
    serviceOne: "1 TB Storage",
    serviceTwo: "5 Users Allowed",
    serviceThree: "Send up to 10GB",
  },
  {
    tier: "Master",
    monthly: 39,
    yearly: 399,
    serviceOne: "2 TB Storage",
    serviceTwo: "10 Users Allowed",
    serviceThree: "Send up to 20GB",
  },
];

const Pricing = () => {
  const INR_TO_USD = 90; // 1 USD = 90 INR

  const [isMonthly, setIsMonthly] = useState(false);
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Subscribe to a plan
  const handleSubscribe = async (tier: string) => {
    if (!user) return alert("Please login first");

    setLoading(true);
    try {
      const planType: "monthly" | "annual" = isMonthly ? "monthly" : "annual";

      const response = await axios.post("/billing/create-subscription", {
        planType,
        userId: user.id,
        tier,
      });

      const subscription: { id: string } = response.data;

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
        subscription_id: subscription.id,
        name: "Your App Name",
        description: `${tier} Plan Subscription`,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async (response: RazorpayPaymentResponse) => {
          await axios.post("/billing/verify", response);
          alert("Subscription successful!");
          await refreshUser();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Failed to create subscription: " + error.message);
      } else {
        alert("Failed to create subscription");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel the current subscription
  const handleCancelSubscription = async () => {
    if (!user || !user.subscriptionId) return alert("No active subscription");

    setLoading(true);
    try {
      await axios.post("/billing/cancel-subscription", {
        subscriptionId: user.subscriptionId,
      });
      alert("Subscription cancelled successfully!");
      await refreshUser();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Failed to cancel subscription: " + error.message);
      } else {
        alert("Failed to cancel subscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-center my-8 text-3xl text-midnight font-mont font-bold text-gray-500">
          Our Pricing {user?.name}
        </h1>

        {/* Toggle Monthly / Annually */}
        <div className="flex items-center font-mont gap-4 justify-center mt-10">
          <span>Annually</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMonthly}
              onChange={() => setIsMonthly(!isMonthly)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
          </label>
          <span>Monthly</span>
        </div>

        {/* Pricing Cards */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center mt-10">
          {priceData.map((curr, i) => {
            const isMiddle = i === 1; // Only middle card is active

            return (
              <div
                key={i}
                className={`
                  flex flex-col gap-6 divide-y divide-gray-300 
                  items-center justify-center pt-8 pb-12 w-full max-w-sm rounded-xl
                  ${
                    isMiddle
                      ? "text-white bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg scale-105 transform transition-all"
                      : "bg-gray-100 text-gray-400 border border-gray-300 opacity-50 cursor-not-allowed"
                  }
                `}
              >
                <span className="font-bold">{curr.tier}</span>

                <span className="text-[3.5rem] font-extrabold pb-4">
                  $
                  {(
                    (isMonthly ? curr.monthly : curr.yearly) / INR_TO_USD
                  ).toFixed(2)}
                </span>

                <span className="pb-4 font-bold">{curr.serviceOne}</span>
                <span className="pb-4 font-bold">{curr.serviceTwo}</span>
                <span className="pb-4 font-bold">{curr.serviceThree}</span>

                <button
                  disabled={!isMiddle || loading} // Disable side buttons
                  onClick={() => handleSubscribe(curr.tier)}
                  className={`
                    font-bold px-14 rounded-lg py-3 transition
                    ${
                      isMiddle
                        ? "bg-white text-blue-600 hover:bg-gray-100"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  {loading && isMiddle
                    ? "Processing..."
                    : isMiddle
                    ? "Subscribe"
                    : "Unavailable"}
                </button>

                {/* Cancel button only on active card if subscription exists */}
                {isMiddle && user?.subscriptionStatus === "active" && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="mt-4 px-10 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    {loading ? "Processing..." : "Cancel Subscription"}
                  </button>
                )}
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
};

export default Pricing;

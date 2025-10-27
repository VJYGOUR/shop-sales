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
  razorpay_subscription_id?: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  key: string;
}

interface RazorpaySubscription {
  id: string;
  plan_id: string;
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
  order_id?: string;
  subscription_id?: string;
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

interface UserWithPhone {
  name?: string;
  email?: string;
  plan?: string;
  phoneNumber?: string;
  phone?: string;
  mobile?: string;
  contact?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string;
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
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptionLoading, setSubscriptionLoading] =
    useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [paymentType, setPaymentType] = useState<"one-time" | "subscription">(
    "subscription"
  );

  // Load user data only once

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // One-time payment logic
  const handleUpgrade = async (): Promise<void> => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("razorpay") || key.includes("rzp")) {
          localStorage.removeItem(key);
        }
      });
    }
    try {
      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your connection.");
        return;
      }

      const orderResponse = await axiosInstance.post<RazorpayOrder>(
        "/billing/create-order"
      );
      const { id, amount, currency, key } = orderResponse.data;

      const getUserPhoneNumber = (): string => {
        if (!user) return "";
        const userWithPhone = user as UserWithPhone;
        return (
          userWithPhone?.phoneNumber ||
          userWithPhone?.phone ||
          userWithPhone?.mobile ||
          userWithPhone?.contact ||
          ""
        );
      };

      const options: RazorpayOptions = {
        key: key,
        amount: amount,
        currency: currency,
        name: "Stoq",
        description: "Professional Plan - One Time Payment",
        order_id: id,
        handler: async function (response: RazorpayResponse) {
          try {
            console.log("Payment successful, verifying...", response);

            await axiosInstance.post("/billing/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert("Payment successful! Your plan has been upgraded.");
            await refreshUser();
          } catch (error) {
            console.error("Payment verification failed:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: getUserPhoneNumber(),
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

  // Subscription payment logic
  const handleSubscription = async (): Promise<void> => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("razorpay") || key.includes("rzp")) {
          localStorage.removeItem(key);
        }
      });
    }
    try {
      setSubscriptionLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Please check your connection.");
        return;
      }

      const subscriptionResponse =
        await axiosInstance.post<RazorpaySubscription>(
          "/billing/create-subscription"
        );
      const { id, amount, currency, key } = subscriptionResponse.data;

      const getUserPhoneNumber = (): string => {
        if (!user) return "";
        const userWithPhone = user as UserWithPhone;
        return (
          userWithPhone?.phoneNumber ||
          userWithPhone?.phone ||
          userWithPhone?.mobile ||
          userWithPhone?.contact ||
          ""
        );
      };

      const options: RazorpayOptions = {
        key: key,
        amount: amount,
        currency: currency,
        name: "Stoq",
        description: "Professional Plan - Monthly Subscription",
        subscription_id: id,
        handler: async function (response: RazorpayResponse) {
          try {
            console.log(
              "Subscription payment successful, verifying...",
              response
            );

            await axiosInstance.post("/billing/verify-subscription", {
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
            });

            alert(
              "Subscription activated! You'll be automatically billed monthly."
            );
            await refreshUser();
          } catch (error) {
            console.error("Subscription verification failed:", error);
            alert("Subscription verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: getUserPhoneNumber(),
        },
        theme: {
          color: "#10B981",
        },
        modal: {
          ondismiss: function () {
            setSubscriptionLoading(false);
            console.log("Subscription modal closed");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Subscription setup failed. Please try again.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleManualVerify = async (): Promise<void> => {
    try {
      await refreshUser();
      if (user?.plan === "paid") {
        alert("Payment verified! Your plan has been upgraded.");
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

  const handleCancelSubscription = async (): Promise<void> => {
    try {
      setCancelling(true);
      const response = await axiosInstance.post("/billing/cancel-subscription");

      if (response.data.success) {
        alert(
          "Subscription cancelled successfully. You'll have access until the end of your billing period."
        );
        await refreshUser();
        setShowCancelConfirm(false);
      } else {
        alert("Failed to cancel subscription: " + response.data.error);
      }
    } catch (error: unknown) {
      console.error("Cancellation failed:", error);
      let errorMessage = "Failed to cancel subscription. Please try again.";
      if (error instanceof Error) {
        errorMessage += ` Error: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const handleResubscribe = async (): Promise<void> => {
    try {
      await handleSubscription();
    } catch (error) {
      console.error("Resubscribe failed:", error);
      alert("Failed to resubscribe. Please try again.");
    }
  };

  const getNextBillingDate = (): string => {
    const today = new Date();
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    return nextMonth.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getActualExpiryDate = (): string => {
    if (user?.subscriptionExpiresAt) {
      return new Date(user.subscriptionExpiresAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Fallback to calculated date (one month from now)
    const today = new Date();
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    return nextMonth.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPlanBenefits = (plan: keyof typeof PLANS): string[] => {
    const benefits = {
      free: [
        "100 product limit",
        "Basic inventory management",
        "Sales tracking",
        "Customer management",
        "Basic reporting",
      ],
      paid: [
        "10,000 product limit",
        "Unlimited products",
        "Advanced analytics",
        "Barcode system",
        "Custom reports",
        "Priority support",
        "Multiple user access",
        "API access",
        "Export capabilities",
      ],
    };
    return benefits[plan];
  };

  const getFeatureIcon = (feature: string): string => {
    if (feature.includes("limit") || feature.includes("unlimited")) return "📊";
    if (feature.includes("analytics") || feature.includes("report"))
      return "📈";
    if (feature.includes("support")) return "🎯";
    if (feature.includes("barcode")) return "📷";
    if (feature.includes("api")) return "🔌";
    if (feature.includes("export")) return "📤";
    return "✓";
  };

  // Fixed subscription detection logic
  const isSubscribedUser = Boolean(
    user?.subscriptionId &&
      user?.subscriptionStatus &&
      user.subscriptionStatus !== "cancelled" &&
      user.subscriptionStatus !== "expired" &&
      user.subscriptionStatus !== "completed"
  );

  const isOneTimeUser = user?.plan === "paid" && !user?.subscriptionId;
  console.log(isOneTimeUser);
  const isCancelledUser =
    user?.subscriptionId && user?.subscriptionStatus === "cancelled";
  const isExpiredUser =
    user?.subscriptionId && user?.subscriptionStatus === "expired";

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pricing Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business needs. All plans include
            core features with flexible scaling options.
          </p>
        </div>

        {/* Current Plan Status */}
        {user?.plan === "paid" && (
          <div className="bg-white rounded-xl shadow-lg border border-green-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                  <span className="text-2xl">
                    {isCancelledUser || isExpiredUser ? "❌" : "🎉"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    {isSubscribedUser
                      ? "Active Professional Subscription"
                      : isExpiredUser
                      ? "Expired Professional Subscription"
                      : isCancelledUser
                      ? "Cancelled Professional Subscription"
                      : "Active Professional Plan (One-Time)"}
                  </h3>
                  <p className="text-green-600">
                    {isSubscribedUser ? (
                      <>
                        Next billing date:{" "}
                        <strong>{getNextBillingDate()}</strong>
                      </>
                    ) : isCancelledUser ? (
                      <>
                        Access until: <strong>{getActualExpiryDate()}</strong>
                      </>
                    ) : isExpiredUser ? (
                      <>
                        Subscription expired on:{" "}
                        <strong>{getActualExpiryDate()}</strong>
                      </>
                    ) : (
                      <>One-time payment - Lifetime access</>
                    )}
                  </p>
                  {user.subscriptionId && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600">
                        Subscription ID: {user.subscriptionId}
                      </p>
                      {user.subscriptionStatus && (
                        <p className="text-sm text-green-600">
                          Status:{" "}
                          <span className="capitalize">
                            {user.subscriptionStatus}
                          </span>
                        </p>
                      )}
                      {user.subscriptionExpiresAt &&
                        (isCancelledUser || isExpiredUser) && (
                          <p className="text-sm text-green-600">
                            Expiry:{" "}
                            <span className="capitalize">
                              {getActualExpiryDate()}
                            </span>
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                {isSubscribedUser && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-6 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  >
                    Cancel Subscription
                  </button>
                )}
                {isSubscribedUser && (
                  <button className="px-6 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    Update Payment Method
                  </button>
                )}
                {(isCancelledUser || isExpiredUser) && (
                  <button
                    onClick={handleResubscribe}
                    className="px-6 py-2 text-sm font-medium text-green-600 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors duration-200"
                  >
                    Resubscribe
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Type Selector - Only show for free users */}
        {user?.plan === "free" && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Payment Type:
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentType("subscription")}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    paymentType === "subscription"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Monthly Subscription
                </button>
                <button
                  onClick={() => setPaymentType("one-time")}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    paymentType === "one-time"
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  One-Time Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Plan Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {PLANS.free.name}
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Perfect for getting started
                  </p>
                </div>
                {user?.plan === "free" && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Current Plan
                  </span>
                )}
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${PLANS.free.price}
                </span>
                <span className="text-gray-500 ml-2">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {getPlanBenefits("free").map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm mt-0.5">
                      ✓
                    </span>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              {user?.plan === "free" && (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 px-6 py-4 rounded-xl font-semibold cursor-not-allowed"
                >
                  Current Plan
                </button>
              )}
            </div>
          </div>

          {/* Professional Plan Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105">
            <div className="p-8 text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold">{PLANS.paid.name}</h3>
                  <p className="text-blue-100 mt-1">For growing businesses</p>
                </div>
                {user?.plan === "paid" && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                    {isSubscribedUser
                      ? "Active Subscription"
                      : isExpiredUser
                      ? "Expired"
                      : isCancelledUser
                      ? "Cancelled"
                      : "Plan Active"}
                  </span>
                )}
                <div className="bg-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                  POPULAR
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">${PLANS.paid.price}</span>
                <span className="text-blue-100 ml-2">
                  {paymentType === "subscription" ? "/month" : " one-time"}
                </span>
                <p className="text-blue-100 text-sm mt-1">
                  {paymentType === "subscription"
                    ? "Billed monthly, cancel anytime"
                    : "One-time payment, lifetime access"}
                </p>
              </div>

              {/* Payment Type Info */}
              {user?.plan === "free" && (
                <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {paymentType === "subscription"
                        ? "Monthly Subscription"
                        : "One-Time Payment"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        paymentType === "subscription"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {paymentType === "subscription"
                        ? "RECURRING"
                        : "LIFETIME"}
                    </span>
                  </div>
                </div>
              )}

              <ul className="space-y-4 mb-8">
                {getPlanBenefits("paid").map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-sm mt-0.5">
                      {getFeatureIcon(benefit)}
                    </span>
                    <span className="text-white">{benefit}</span>
                  </li>
                ))}
              </ul>

              {user?.plan === "free" && (
                <div className="space-y-3">
                  <button
                    onClick={
                      paymentType === "subscription"
                        ? handleSubscription
                        : handleUpgrade
                    }
                    disabled={
                      paymentType === "subscription"
                        ? subscriptionLoading
                        : loading
                    }
                    className={`w-full px-6 py-4 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                      paymentType === "subscription"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-white text-blue-600 hover:bg-gray-100"
                    }`}
                  >
                    {paymentType === "subscription" ? (
                      subscriptionLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Setting up Subscription...
                        </>
                      ) : (
                        "Subscribe Now - Monthly"
                      )
                    ) : loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Upgrade Now - One Time"
                    )}
                  </button>

                  <button
                    onClick={handleManualVerify}
                    className="w-full bg-white bg-opacity-10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-20 transition-colors duration-200 border border-white border-opacity-20"
                  >
                    Check Payment Status
                  </button>

                  <div className="bg-white bg-opacity-10 rounded-lg p-4 mt-4">
                    <p className="text-sm font-semibold text-white mb-2">
                      💳 Test Payment Details:
                    </p>
                    <div className="text-xs text-blue-100 space-y-1">
                      <p>
                        Card:{" "}
                        <span className="font-mono">4111 1111 1111 1111</span>
                      </p>
                      <p>
                        Expiry: <span className="font-mono">12/34</span> | CVV:{" "}
                        <span className="font-mono">123</span>
                      </p>
                      <p className="text-yellow-200 mt-2">
                        Use this test card for both subscription and one-time
                        payments
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {user?.plan === "paid" && (
                <button
                  disabled
                  className="w-full bg-white bg-opacity-20 text-white px-6 py-4 rounded-xl font-semibold cursor-not-allowed border border-white border-opacity-30"
                >
                  {isSubscribedUser
                    ? "Active Subscription"
                    : isExpiredUser
                    ? "Subscription Expired"
                    : isCancelledUser
                    ? "Subscription Cancelled"
                    : "Plan Active (One-Time)"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                What's the difference between one-time and subscription?
              </h3>
              <p className="text-gray-600">
                One-time payment gives you lifetime access. Subscription bills
                monthly but can be cancelled anytime.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch between payment types?
              </h3>
              <p className="text-gray-600">
                Yes, you can choose either option. One-time for permanent
                access, subscription for flexible monthly billing.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a contract for subscriptions?
              </h3>
              <p className="text-gray-600">
                No contracts. All subscriptions are month-to-month and you can
                cancel anytime.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 14-day money-back guarantee for all new subscriptions
                and one-time payments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Cancel Subscription?
            </h3>
            <p className="text-gray-600 mb-4">
              Your subscription will remain active until {getActualExpiryDate()}
              . You'll lose access to Professional features after that date.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can resubscribe anytime if you change your mind.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;

// src/pages/BillingPage.tsx
import { useAuth } from "../utils/AuthContext";
import { PLANS } from "../utils/plans";
import { useState, useCallback } from "react";
import axiosInstance from "../axios/axiosInstance";

// Add this helper function for type-safe error handling
const isAxiosError = (
  error: unknown
): error is {
  response?: {
    status?: number;
    data?: { error?: string };
  };
} => {
  return typeof error === "object" && error !== null && "response" in error;
};

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

  // Load Razorpay script
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
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
  }, []);

  // Clear Razorpay localStorage
  const clearRazorpayCache = useCallback(() => {
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("razorpay") || key.includes("rzp")) {
          localStorage.removeItem(key);
        }
      });
    }
  }, []);

  // Get user phone number
  const getUserPhoneNumber = useCallback((): string => {
    if (!user) return "";
    const userWithPhone = user as UserWithPhone;
    return (
      userWithPhone?.phoneNumber ||
      userWithPhone?.phone ||
      userWithPhone?.mobile ||
      userWithPhone?.contact ||
      ""
    );
  }, [user]);

  // One-time payment logic
  const handleUpgrade = async (): Promise<void> => {
    clearRazorpayCache();

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
    clearRazorpayCache();

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

  // Resume subscription (Netflix-style)
  const handleResumeSubscription = async (): Promise<void> => {
    try {
      setSubscriptionLoading(true);

      const confirmResume = window.confirm(
        "Resuming your subscription will restore automatic monthly billing starting from your original billing date. Continue?"
      );

      if (!confirmResume) return;

      // Try to resume existing subscription
      const response = await axiosInstance.post("/billing/resume-subscription");

      if (response.data.success) {
        alert(
          "Subscription resumed successfully! Your billing cycle remains unchanged."
        );
        await refreshUser();
      } else {
        // If resume fails, create new subscription
        await handleSubscription();
      }
    } catch (error: unknown) {
      console.error("Resume subscription failed:", error);

      // Type-safe error handling
      if (isAxiosError(error)) {
        // If resume endpoint doesn't exist, fall back to regular subscription
        if (error.response?.status === 404) {
          await handleSubscription();
        } else {
          alert(
            error.response?.data?.error ||
              "Failed to resume subscription. Please try again."
          );
        }
      } else if (error instanceof Error) {
        alert(
          error.message || "Failed to resume subscription. Please try again."
        );
      } else {
        alert("Failed to resume subscription. Please try again.");
      }
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Manual verification
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

  // Fix subscription status
  const handleFixSubscription = async (): Promise<void> => {
    try {
      const confirmFix = window.confirm(
        "This will fix your subscription status and allow you to resume or create a new subscription. Continue?"
      );

      if (!confirmFix) return;

      const response = await axiosInstance.post(
        "/billing/fix-subscription-status"
      );

      if (response.data.success) {
        alert(
          response.data.message || "Subscription status fixed successfully!"
        );
        await refreshUser();
      } else {
        alert("Failed to fix subscription status: " + response.data.error);
      }
    } catch (error) {
      console.error("Fix subscription failed:", error);
      alert("Failed to fix subscription status. Please contact support.");
    }
  };

  // Sync subscription status
  const handleSyncStatus = async (): Promise<void> => {
    try {
      setSubscriptionLoading(true);

      const response = await axiosInstance.post(
        "/billing/sync-subscription-status"
      );

      if (response.data.success) {
        alert(
          `Status synced successfully!\nPrevious: ${response.data.previousStatus}\nNew: ${response.data.newStatus}`
        );
        await refreshUser();
      } else {
        alert("Failed to sync status: " + response.data.error);
      }
    } catch (error) {
      console.error("Sync status failed:", error);
      alert("Failed to sync subscription status. Please try again.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Force new subscription
  const handleForceNewSubscription = async (): Promise<void> => {
    try {
      setSubscriptionLoading(true);

      const confirmForce = window.confirm(
        "This will clear your current cancelled subscription and create a brand new one. Continue?"
      );

      if (!confirmForce) return;

      const response = await axiosInstance.post(
        "/billing/force-new-subscription"
      );

      if (response.data.success) {
        // Now open the Razorpay modal with the new subscription
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Razorpay SDK failed to load. Please check your connection.");
          return;
        }

        const { id, amount, currency, key } = response.data;

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
                "New subscription payment successful, verifying...",
                response
              );

              await axiosInstance.post("/billing/verify-subscription", {
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
              });

              alert(
                "New subscription activated! You'll be automatically billed monthly."
              );
              await refreshUser();
            } catch (error) {
              console.error("New subscription verification failed:", error);
              alert(
                "New subscription verification failed. Please contact support."
              );
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
      } else {
        alert("Failed to create new subscription: " + response.data.error);
      }
    } catch (error) {
      console.error("Force new subscription failed:", error);
      alert("Failed to create new subscription. Please try again.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Cancel subscription
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

      // Type-safe error handling
      if (isAxiosError(error)) {
        if (error.response?.status === 400) {
          const errorMessage =
            error.response.data?.error ||
            "Subscription is still activating. Please wait 1-2 minutes.";
          alert(`⚠️ ${errorMessage}`);
        } else {
          alert(
            error.response?.data?.error ||
              "Failed to cancel subscription. Please try again."
          );
        }
      } else if (error instanceof Error) {
        alert(
          error.message || "Failed to cancel subscription. Please try again."
        );
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } finally {
      setCancelling(false);
    }
  };

  // Start new subscription
  const handleNewSubscription = async (): Promise<void> => {
    try {
      const confirmNew = window.confirm(
        "This will start a NEW subscription with today as your billing date. Continue?"
      );

      if (!confirmNew) return;

      await handleSubscription();
    } catch (error) {
      console.error("New subscription failed:", error);
      alert("Failed to start new subscription. Please try again.");
    }
  };

  // Helper functions
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

    // Fallback to calculated date
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

  // 🎯 ENHANCED STATUS DETECTION - ERROR FREE
  const isSubscribedUser = Boolean(
    user?.subscriptionId &&
      user?.subscriptionStatus &&
      ["active", "cancelled_at_period_end", "pending", "past_due"].includes(
        user.subscriptionStatus
      )
  );

  const isOneTimeUser = user?.plan === "paid" && !user?.subscriptionId;

  const canResumeSubscription =
    user?.subscriptionId &&
    ["cancelled_at_period_end", "cancelled"].includes(
      user.subscriptionStatus || ""
    );

  const isFullyCancelledUser =
    user?.subscriptionId &&
    ["cancelled", "expired", "completed"].includes(
      user.subscriptionStatus || ""
    );

  const isScheduledCancellation =
    user?.subscriptionId &&
    user?.subscriptionStatus === "cancelled_at_period_end";

  const needsPaymentAttention =
    user?.subscriptionId && user?.subscriptionStatus === "past_due";
  console.log(needsPaymentAttention);
  const needsStatusFix =
    user?.subscriptionId && user?.subscriptionStatus === "cancelled";

  const needsStatusSync =
    user?.subscriptionId && user?.subscriptionStatus === "active";

  const canForceNewSubscription =
    user?.subscriptionId &&
    ["cancelled", "cancelled_at_period_end", "expired"].includes(
      user.subscriptionStatus || ""
    );

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
                    {isFullyCancelledUser ? "⏸️" : "🎉"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    {isSubscribedUser && !isScheduledCancellation
                      ? "Active Professional Subscription"
                      : isScheduledCancellation
                      ? "Subscription Active (Cancels at period end)"
                      : isFullyCancelledUser &&
                        user?.subscriptionStatus === "expired"
                      ? "Expired Professional Subscription"
                      : isFullyCancelledUser
                      ? "Cancelled Professional Subscription"
                      : isOneTimeUser
                      ? "Active Professional Plan (One-Time)"
                      : "Subscription Status"}
                  </h3>
                  <p className="text-green-600">
                    {isSubscribedUser && !isScheduledCancellation ? (
                      <>
                        Next billing date:{" "}
                        <strong>{getNextBillingDate()}</strong>
                      </>
                    ) : isScheduledCancellation ? (
                      <>
                        Access until: <strong>{getActualExpiryDate()}</strong> •{" "}
                        <span className="text-yellow-600 ml-1">
                          You can resume anytime
                        </span>
                      </>
                    ) : isFullyCancelledUser ? (
                      <>
                        Subscription fully cancelled on:{" "}
                        <strong>{getActualExpiryDate()}</strong>
                      </>
                    ) : isOneTimeUser ? (
                      <>One-time payment - Lifetime access</>
                    ) : (
                      <>Subscription status unknown</>
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
                            {user.subscriptionStatus.replace(/_/g, " ")}
                          </span>
                          {isScheduledCancellation && (
                            <span className="text-yellow-600 ml-1">
                              (Resumable)
                            </span>
                          )}
                          {needsStatusFix && (
                            <span className="text-red-600 ml-1">
                              (Needs Fix)
                            </span>
                          )}
                        </p>
                      )}
                      {user.subscriptionExpiresAt && (
                        <p className="text-sm text-green-600">
                          {isScheduledCancellation
                            ? "Scheduled end:"
                            : "Expiry:"}{" "}
                          <span className="capitalize">
                            {getActualExpiryDate()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 flex-wrap gap-2">
                {/* Active subscription - can cancel */}
                {isSubscribedUser && !isScheduledCancellation && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-6 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  >
                    Cancel Subscription
                  </button>
                )}

                {/* Scheduled cancellation - can resume */}
                {canResumeSubscription && (
                  <button
                    onClick={handleResumeSubscription}
                    disabled={subscriptionLoading}
                    className="px-6 py-2 text-sm font-medium text-green-600 bg-white border border-green-300 rounded-lg hover:bg-green-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    {subscriptionLoading
                      ? "Resuming..."
                      : "Resume Subscription"}
                  </button>
                )}

                {/* Fully cancelled or expired - need new subscription */}
                {isFullyCancelledUser && (
                  <button
                    onClick={handleNewSubscription}
                    disabled={subscriptionLoading}
                    className="px-6 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    {subscriptionLoading
                      ? "Starting..."
                      : "Start New Subscription"}
                  </button>
                )}

                {/* Status fix button */}
                {needsStatusFix && (
                  <button
                    onClick={handleFixSubscription}
                    className="px-6 py-2 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors duration-200"
                  >
                    Fix Subscription Status
                  </button>
                )}

                {/* Status sync button */}
                {needsStatusSync && (
                  <button
                    onClick={handleSyncStatus}
                    disabled={subscriptionLoading}
                    className="px-6 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    {subscriptionLoading ? "Syncing..." : "Sync Status"}
                  </button>
                )}

                {/* Force new subscription button */}
                {canForceNewSubscription && (
                  <button
                    onClick={handleForceNewSubscription}
                    disabled={subscriptionLoading}
                    className="px-6 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors duration-200 disabled:opacity-50"
                  >
                    {subscriptionLoading
                      ? "Creating..."
                      : "Create New Subscription"}
                  </button>
                )}

                {/* Update payment method (for active subscriptions) */}
                {isSubscribedUser && (
                  <button className="px-6 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                    Update Payment Method
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
                      : isFullyCancelledUser &&
                        user?.subscriptionStatus === "expired"
                      ? "Expired"
                      : isFullyCancelledUser
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
                    : isFullyCancelledUser &&
                      user?.subscriptionStatus === "expired"
                    ? "Subscription Expired"
                    : isFullyCancelledUser
                    ? "Subscription Cancelled"
                    : "Plan Active (One-Time)"}
                </button>
              )}
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

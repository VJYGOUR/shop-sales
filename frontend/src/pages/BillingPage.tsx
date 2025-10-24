// src/pages/BillingPage.tsx
import { useAuth } from "../utils/AuthContext";
import { PLANS } from "../utils/plans";

const BillingPage = () => {
  const { user } = useAuth();

  const handleUpgrade = () => {
    // We'll implement this in next steps
    alert("Upgrade functionality coming soon!");
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
            <button
              onClick={handleUpgrade}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Upgrade to Professional
            </button>
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

// utils/plans.ts
export const PLANS = {
  free: {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      maxProducts: 100,
      maxUsers: 1,
      features: [
        "basic_inventory",
        "sales_tracking",
        "customer_management",
        "basic_reports",
      ] as const,
    },
  },
  professional: {
    name: "Professional",
    price: {
      monthly: 29,
      yearly: 299, // ~2 months free
    },
    limits: {
      maxProducts: 10000,
      maxUsers: 5,
      features: [
        "unlimited_products",
        "multiple_users",
        "advanced_analytics",
        "barcode_system",
        "custom_reports",
        "priority_support",
      ] as const,
    },
  },
  master: {
    name: "Master",
    price: {
      monthly: 49,
      yearly: 499, // ~2 months free
    },
    limits: {
      maxProducts: 50000,
      maxUsers: 10,
      features: [
        "unlimited_products",
        "multiple_users",
        "advanced_analytics",
        "barcode_system",
        "custom_reports",
        "priority_support",
        "dedicated_account_manager",
        "priority_onboarding",
      ] as const,
    },
  },
} as const;

// Union type of all possible features
export type FeatureType =
  | "basic_inventory"
  | "sales_tracking"
  | "customer_management"
  | "basic_reports"
  | "unlimited_products"
  | "multiple_users"
  | "advanced_analytics"
  | "barcode_system"
  | "custom_reports"
  | "priority_support"
  | "dedicated_account_manager"
  | "priority_onboarding";

// Plan keys
export type PlanType = keyof typeof PLANS;

// Billing period type
export type BillingPeriod = keyof (typeof PLANS)["free"]["price"]; // "monthly" | "yearly"

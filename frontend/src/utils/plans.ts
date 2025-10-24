// utils/plans.ts
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
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
  paid: {
    name: "Professional",
    price: 29,
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
} as const;

// Create a union type of all possible features
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
  | "priority_support";

export type PlanType = keyof typeof PLANS;

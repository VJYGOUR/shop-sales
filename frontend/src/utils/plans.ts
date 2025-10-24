// utils/plans.ts
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    limits: {
      maxProducts: 100,
      maxUsers: 1,
      features: [
        "Basic inventory management",
        "Sales tracking",
        "Customer management",
        "Basic reports",
      ],
    },
  },
  paid: {
    name: "Professional",
    price: 29,
    limits: {
      maxProducts: 10000,
      maxUsers: 5,
      features: [
        "Unlimited products",
        "Multiple users",
        "Advanced analytics",
        "Barcode system",
        "Custom reports",
        "Priority support",
      ],
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

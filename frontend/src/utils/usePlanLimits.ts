import { useAuth } from "./AuthContext";
import { PLANS, type FeatureType, type PlanType } from "./plans";

export const usePlanLimits = () => {
  const { user } = useAuth();

  // Validate planKey exists in PLANS safely
  const planKey: PlanType = (() => {
    const key = user?.plan as PlanType | undefined;
    return key && Object.keys(PLANS).includes(key) ? key : "free";
  })();

  const plan = PLANS[planKey];

  const checkProductLimit = (currentCount: number): boolean => {
    return currentCount < plan.limits.maxProducts;
  };

  const canUseFeature = (feature: FeatureType): boolean => {
    // Cast to FeatureType[] so TypeScript understands includes() works
    const features: FeatureType[] = plan.limits
      .features as unknown as FeatureType[];
    return features.includes(feature);
  };

  const getPlanLimits = () => {
    return plan.limits;
  };

  return { checkProductLimit, canUseFeature, getPlanLimits };
};

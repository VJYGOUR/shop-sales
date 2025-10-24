// utils/usePlanLimits.ts
import { useAuth } from "./AuthContext";
import { PLANS, type FeatureType } from "./plans"; // Add 'type' keyword

export const usePlanLimits = () => {
  const { user } = useAuth();

  const checkProductLimit = (currentCount: number): boolean => {
    if (!user) return false;
    const maxProducts = PLANS[user.plan].limits.maxProducts;
    return currentCount < maxProducts;
  };

  const canUseFeature = (feature: FeatureType): boolean => {
    if (!user) return false;
    // Type assertion to fix the 'never' error
    const features = PLANS[user.plan].limits.features as readonly FeatureType[];
    return features.includes(feature);
  };

  const getPlanLimits = () => {
    if (!user) return PLANS.free.limits;
    return PLANS[user.plan].limits;
  };

  return { checkProductLimit, canUseFeature, getPlanLimits };
};

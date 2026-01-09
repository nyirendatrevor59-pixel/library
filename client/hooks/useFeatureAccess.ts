import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

export function useFeatureAccess() {
  const { subscription, hasFeature } = useSubscription();
  const { user } = useAuth();

  const checkAccess = (feature: string): FeatureAccessResult => {
    // Admins and lecturers have access to all features
    if (user?.role === 'admin' || user?.role === 'lecturer') {
      return { hasAccess: true };
    }

    // Tutors have access to tutor-specific features
    if (user?.role === 'tutor') {
      const tutorFeatures = ['tutor_sessions', 'tutor_requests', 'tutor_students'];
      if (tutorFeatures.includes(feature)) {
        return { hasAccess: true };
      }
    }

    // Check subscription for other features
    if (hasFeature(feature)) {
      return { hasAccess: true };
    }

    // No access
    if (!subscription || !subscription.isActive) {
      return {
        hasAccess: false,
        reason: "Active subscription required",
        upgradeRequired: true
      };
    }

    return {
      hasAccess: false,
      reason: `Feature "${feature}" not included in your current plan`,
      upgradeRequired: true
    };
  };

  const requireAccess = (feature: string): boolean => {
    const access = checkAccess(feature);
    if (!access.hasAccess) {
      throw new Error(access.reason || "Access denied");
    }
    return true;
  };

  const getAccessibleFeatures = (): string[] => {
    if (user?.role === 'admin' || user?.role === 'lecturer') {
      return ['all']; // Admins and lecturers have access to everything
    }

    if (user?.role === 'tutor') {
      return ['tutor_sessions', 'tutor_requests', 'tutor_students'];
    }

    return subscription?.features || [];
  };

  return {
    checkAccess,
    requireAccess,
    getAccessibleFeatures,
    hasFeature,
    isSubscribed: subscription?.isActive ?? false,
    subscription,
  };
}
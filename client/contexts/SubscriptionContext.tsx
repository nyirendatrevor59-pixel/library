import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  isActive: boolean;
  createdAt: number;
}

export interface UserSubscription {
  id: string;
  planId: string;
  status: string;
  startDate: number;
  endDate: number;
  autoRenew: boolean;
  createdAt: number;
  updatedAt: number;
  plan: SubscriptionPlan;
}

export interface SubscriptionStatus {
  subscription: UserSubscription | null;
  isActive: boolean;
  daysRemaining: number;
  features: string[];
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  subscribe: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  changePlan: (newPlanId: string) => Promise<void>;
  renewSubscription: () => Promise<void>;
  toggleAutoRenew: (autoRenew: boolean) => Promise<void>;
  hasFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadSubscription();
      loadPlans();
    } else {
      setSubscription(null);
      setPlans([]);
      setIsLoading(false);
    }
  }, [user, token]);

  const loadSubscription = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        console.error("Failed to load subscription:", response.statusText);
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
      setSubscription(null);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription-plans`);

      if (response.ok) {
        const plansData = await response.json();
        // Parse features JSON string
        const parsedPlans = plansData.map((plan: any) => ({
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : [],
        }));
        setPlans(parsedPlans);
      } else {
        console.error("Failed to load subscription plans:", response.statusText);
        setPlans([]);
      }
    } catch (error) {
      console.error("Error loading subscription plans:", error);
      setPlans([]);
    }
  };

  const refreshSubscription = async () => {
    if (user && token) {
      await loadSubscription();
    }
  };

  const subscribe = async (planId: string) => {
    if (!token) throw new Error("Not authenticated");

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Subscription failed");
      }

      const data = await response.json();
      await refreshSubscription(); // Refresh the subscription status
    } catch (error) {
      console.error("Subscription error:", error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription?.subscription || !token) {
      throw new Error("No active subscription to cancel");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${subscription.subscription.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cancelAtPeriodEnd: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Cancellation failed");
      }

      await refreshSubscription(); // Refresh the subscription status
    } catch (error) {
      console.error("Cancellation error:", error);
      throw error;
    }
  };

  const changePlan = async (newPlanId: string) => {
    if (!subscription?.subscription || !token) {
      throw new Error("No active subscription to change");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${subscription.subscription.id}/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPlanId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Plan change failed");
      }

      await refreshSubscription(); // Refresh the subscription status
    } catch (error) {
      console.error("Plan change error:", error);
      throw error;
    }
  };

  const renewSubscription = async () => {
    if (!subscription?.subscription || !token) {
      throw new Error("No subscription to renew");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${subscription.subscription.id}/renew`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Renewal failed");
      }

      await refreshSubscription(); // Refresh the subscription status
    } catch (error) {
      console.error("Renewal error:", error);
      throw error;
    }
  };

  const toggleAutoRenew = async (autoRenew: boolean) => {
    if (!subscription?.subscription || !token) {
      throw new Error("No subscription to update");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${subscription.subscription.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ autoRenew }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Auto-renew update failed");
      }

      await refreshSubscription(); // Refresh the subscription status
    } catch (error) {
      console.error("Auto-renew update error:", error);
      throw error;
    }
  };

  const hasFeature = (feature: string): boolean => {
    return (subscription?.isActive ?? false) && (subscription?.features?.includes(feature) ?? false);
  };

  const value = {
    subscription,
    plans,
    isLoading,
    refreshSubscription,
    subscribe,
    cancelSubscription,
    changePlan,
    renewSubscription,
    toggleAutoRenew,
    hasFeature,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
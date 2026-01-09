import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";

// Stripe is only available on native platforms
const isNative = Platform.OS !== "web";

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Stripe hooks - conditionally loaded
  const [stripeHooks, setStripeHooks] = useState<{
    initPaymentSheet: any;
    presentPaymentSheet: any;
  }>({
    initPaymentSheet: async () => ({ error: null }),
    presentPaymentSheet: async () => ({ error: null }),
  });

  useEffect(() => {
    if (isNative) {
      // Dynamically import Stripe only on native platforms
      import("@stripe/stripe-react-native").then((stripeModule) => {
        const stripeHook = stripeModule.useStripe();
        setStripeHooks({
          initPaymentSheet: stripeHook.initPaymentSheet,
          presentPaymentSheet: stripeHook.presentPaymentSheet,
        });
      }).catch((error) => {
        console.warn("Stripe not available:", error);
      });
    }
  }, []);

  const { plans, subscription, isLoading, subscribe, refreshSubscription, cancelSubscription, changePlan, renewSubscription, toggleAutoRenew } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    // Initialize Stripe - this will be called when we have a payment intent
    // We'll initialize it in the handleSubscribe function instead
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    setIsProcessing(true);

    try {
      if (!isNative) {
        Alert.alert("Not Available", "Payments are not available on web. Please use the mobile app.");
        return;
      }

      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error("Plan not found");
      }

      // Create payment intent on server
      const response = await fetch(`${API_BASE_URL}/api/payments/create-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add auth headers if needed
        },
        body: JSON.stringify({
          amount: plan.price,
          currency: "usd",
          description: `Subscription to ${plan.name}`,
          subscriptionId: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment intent");
      }

      // Initialize payment sheet with the client secret
      const { error: initError } = await stripeHooks.initPaymentSheet({
        merchantDisplayName: "StudyHub",
        paymentIntentClientSecret: data.clientSecret,
        returnURL: "studyhub://stripe-redirect",
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: presentError } = await stripeHooks.presentPaymentSheet();

      if (presentError) {
        Alert.alert("Payment Failed", presentError.message);
      } else {
        // Payment successful, create subscription
        await subscribe(planId);
        Alert.alert("Success", "Subscription activated successfully!");
        refreshSubscription();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return `${(price / 100).toFixed(2)}`;
  };

  const handleChangePlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsChangingPlan(true);

    try {
      await changePlan(planId);
      Alert.alert("Success", "Subscription plan changed successfully!");
      refreshSubscription();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Plan change failed");
    } finally {
      setIsChangingPlan(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You will lose access at the end of your current billing period.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert("Success", "Subscription cancelled successfully!");
              refreshSubscription();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Cancellation failed");
            }
          },
        },
      ]
    );
  };

  const handleRenewSubscription = async () => {
    try {
      await renewSubscription();
      Alert.alert("Success", "Subscription renewed successfully!");
      refreshSubscription();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Renewal failed");
    }
  };

  const handleToggleAutoRenew = async () => {
    const currentAutoRenew = subscription?.subscription?.autoRenew ?? false;
    try {
      await toggleAutoRenew(!currentAutoRenew);
      Alert.alert("Success", `Auto-renew ${!currentAutoRenew ? "enabled" : "disabled"}!`);
      refreshSubscription();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Update failed");
    }
  };

  const renderSubscriptionStatus = () => {
    if (!subscription) return null;

    return (
      <Card elevation={2} style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Feather name="check-circle" size={24} color={AppColors.success} />
          <ThemedText type="h4" style={styles.statusTitle}>
            Active Subscription
          </ThemedText>
        </View>
        <ThemedText type="body">
          {subscription.subscription?.plan?.name} - {subscription.daysRemaining} days remaining
        </ThemedText>
        <View style={styles.featuresList}>
          {subscription.features?.map((feature: string, index: number) => (
            <View key={index} style={styles.featureItem}>
              <Feather name="check" size={16} color={AppColors.success} />
              <ThemedText type="small">{feature}</ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.managementSection}>
          <ThemedText type="h4" style={styles.managementTitle}>
            Manage Subscription
          </ThemedText>
          <View style={styles.managementButtons}>
            <Pressable
              onPress={handleToggleAutoRenew}
              style={({ pressed }) => [
                styles.managementButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText type="body" style={styles.managementButtonText}>
                {subscription.subscription?.autoRenew ? "Disable" : "Enable"} Auto-Renew
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleCancelSubscription}
              style={({ pressed }) => [
                styles.managementButton,
                styles.cancelButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText type="body" style={styles.cancelButtonText}>
                Cancel Subscription
              </ThemedText>
            </Pressable>
          </View>
          {!subscription.subscription?.autoRenew && (
            <Button
              onPress={handleRenewSubscription}
              style={styles.renewButton}
            >
              Renew Now
            </Button>
          )}
        </View>
      </Card>
    );
  };

  const renderPlans = () => {
    return (
      <View style={styles.plansContainer}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Subscription Plans
        </ThemedText>
        {plans.map((plan) => (
          <Card
            key={plan.id}
            elevation={1}
            onPress={() => handleSubscribe(plan.id)}
            style={[
              styles.planCard,
              ...(subscription?.subscription?.planId === plan.id ? [styles.activePlanCard] : [])
            ]}
          >
            <View style={styles.planHeader}>
              <ThemedText type="h4">{plan.name}</ThemedText>
              <ThemedText type="h2" style={styles.planPrice}>
                {formatPrice(plan.price)}
              </ThemedText>
            </View>
            <ThemedText type="body" style={styles.planDescription}>
              {plan.description}
            </ThemedText>
            <ThemedText type="small" style={styles.planDuration}>
              {plan.duration} days access
            </ThemedText>
            <View style={styles.featuresList}>
              {plan.features?.map((feature: string, index: number) => (
                <View key={index} style={styles.featureItem}>
                  <Feather name="check" size={16} color={theme.link} />
                  <ThemedText type="small">{feature}</ThemedText>
                </View>
              ))}
            </View>
            <Button
              onPress={() => subscription?.subscription ? handleChangePlan(plan.id) : handleSubscribe(plan.id)}
              disabled={isProcessing || isChangingPlan || subscription?.subscription?.planId === plan.id || !isNative}
              style={styles.subscribeButton}
            >
              {((isProcessing && selectedPlan === plan.id) || (isChangingPlan && selectedPlan === plan.id)) ? (
                <ActivityIndicator color="#FFF" />
              ) : subscription?.subscription?.planId === plan.id ? (
                "Current Plan"
              ) : subscription?.subscription ? (
                "Change Plan"
              ) : !isNative ? (
                "Mobile Only"
              ) : (
                "Subscribe"
              )}
            </Button>
          </Card>
        ))}
      </View>
    );
  };

  const renderPaymentMethods = () => {
    return (
      <Modal
        visible={showPaymentMethods}
        animationType="slide"
        onRequestClose={() => setShowPaymentMethods(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">Payment Methods</ThemedText>
            <Pressable onPress={() => setShowPaymentMethods(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <ThemedText type="body" style={styles.comingSoon}>
              Payment methods management coming soon...
            </ThemedText>
          </ScrollView>
        </ThemedView>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.link} />
        <ThemedText type="body" style={styles.loadingText}>
          Loading subscription details...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.header}>
          <ThemedText type="h2" style={styles.title}>
            Subscription & Payment
          </ThemedText>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setShowPaymentMethods(true)}
          >
            <Feather name="settings" size={24} color={theme.text} />
          </Pressable>
        </View>

        {!isNative && (
          <Card elevation={1} style={styles.webNotice}>
            <View style={styles.webNoticeContent}>
              <Feather name="smartphone" size={24} color={AppColors.primary} />
              <ThemedText type="body" style={styles.webNoticeText}>
                Payment functionality is available on mobile devices only. Please use the iOS or Android app to manage subscriptions.
              </ThemedText>
            </View>
          </Card>
        )}

        {subscription?.isActive && renderSubscriptionStatus()}

        {renderPlans()}

        {renderPaymentMethods()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    flex: 1,
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  webNotice: {
    marginBottom: Spacing.xl,
    backgroundColor: AppColors.primary + '10',
  },
  webNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  webNoticeText: {
    flex: 1,
    color: AppColors.primary,
  },
  statusCard: {
    marginBottom: Spacing.xl,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    color: AppColors.success,
  },
  managementSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  managementTitle: {
    marginBottom: Spacing.md,
  },
  managementButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  managementButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: AppColors.primary,
    alignItems: "center",
  },
  managementButtonText: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  cancelButton: {
    borderColor: AppColors.error,
  },
  cancelButtonText: {
    color: AppColors.error,
    fontWeight: "600",
  },
  renewButton: {
    marginTop: Spacing.md,
  },
  plansContainer: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  planCard: {
    marginBottom: Spacing.md,
  },
  activePlanCard: {
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  planPrice: {
    color: AppColors.primary,
    fontWeight: "bold",
  },
  planDescription: {
    marginBottom: Spacing.sm,
    opacity: 0.8,
  },
  planDuration: {
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  featuresList: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  subscribeButton: {
    marginTop: Spacing.md,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalContent: {
    flex: 1,
    padding: Spacing.xl,
  },
  comingSoon: {
    textAlign: "center",
    opacity: 0.7,
  },
});
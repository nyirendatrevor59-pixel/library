import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, AppColors } from "@/constants/theme";

interface PaywallProps {
  feature: string;
  style?: any;
}

export function Paywall({ feature, style }: PaywallProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { checkAccess } = useFeatureAccess();

  const access = checkAccess(feature);

  if (access.hasAccess) {
    return null; // Don't show paywall if user has access
  }

  const handleUpgrade = () => {
    // @ts-ignore
    navigation.navigate('Payment');
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <Card elevation={2} style={styles.card}>
        <View style={styles.header}>
          <Feather name="lock" size={24} color={AppColors.warning} />
          <ThemedText type="h4" style={styles.title}>
            Premium Feature
          </ThemedText>
        </View>
        <ThemedText type="body" style={styles.message}>
          {access.reason || `Access to "${feature}" requires an active subscription.`}
        </ThemedText>
        <Button onPress={handleUpgrade} style={styles.button}>
          Upgrade Now
        </Button>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  card: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    color: AppColors.warning,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  button: {
    width: '100%',
  },
});
import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES } from "@/lib/sampleData";

export default function AccountDetailsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const enrolledCourses = AVAILABLE_COURSES.filter((c) =>
    user?.selectedCourses?.includes(c.id),
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      {/* User Information */}
      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>User Information</ThemedText>
        <View style={styles.detailRow}>
          <ThemedText type="body" style={styles.detailLabel}>Name:</ThemedText>
          <ThemedText type="body">{user?.name || "N/A"}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="body" style={styles.detailLabel}>Email:</ThemedText>
          <ThemedText type="body">{user?.email || "N/A"}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="body" style={styles.detailLabel}>Role:</ThemedText>
          <ThemedText type="body">{user?.role || "N/A"}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="body" style={styles.detailLabel}>Courses:</ThemedText>
          <ThemedText type="body">{enrolledCourses.length}</ThemedText>
        </View>
      </Card>

      {/* Subscription Information */}
      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Subscription Details</ThemedText>
        {subscription ? (
          <>
            <View style={styles.detailRow}>
              <ThemedText type="body" style={styles.detailLabel}>Status:</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: subscription.isActive ? AppColors.success + "20" : AppColors.error + "20" }]}>
                <ThemedText type="small" style={{ color: subscription.isActive ? AppColors.success : AppColors.error, fontWeight: "600" }}>
                  {subscription.isActive ? "Active" : "Inactive"}
                </ThemedText>
              </View>
            </View>
            {subscription.subscription && (
              <>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>Plan:</ThemedText>
                  <ThemedText type="body">{subscription.subscription.plan.name}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>Price:</ThemedText>
                  <ThemedText type="body">${subscription.subscription.plan.price / 100} {subscription.subscription.plan.currency}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>Duration:</ThemedText>
                  <ThemedText type="body">{subscription.subscription.plan.duration} days</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>Start Date:</ThemedText>
                  <ThemedText type="body">{new Date(subscription.subscription.startDate * 1000).toLocaleDateString()}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>End Date:</ThemedText>
                  <ThemedText type="body">{new Date(subscription.subscription.endDate * 1000).toLocaleDateString()}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>Days Left:</ThemedText>
                  <ThemedText type="body">{subscription.daysRemaining}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText type="body" style={styles.detailLabel}>Auto Renew:</ThemedText>
                  <ThemedText type="body">{subscription.subscription.autoRenew ? "Yes" : "No"}</ThemedText>
                </View>
                <View style={styles.featuresSection}>
                  <ThemedText type="body" style={styles.detailLabel}>Features:</ThemedText>
                  <View style={styles.featuresList}>
                    {subscription.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Feather name="check" size={16} color={AppColors.success} />
                        <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>{feature}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
          </>
        ) : (
          <ThemedText type="body" style={{ color: theme.textSecondary }}>Loading subscription details...</ThemedText>
        )}
      </Card>

      {/* Enrolled Courses */}
      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Enrolled Courses</ThemedText>
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <View key={course.id} style={styles.courseItem}>
              <View style={styles.courseInfo}>
                <ThemedText type="body" style={{ fontWeight: "500" }}>
                  {course.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {course.code} • {course.category}
                </ThemedText>
              </View>
              <View style={styles.courseIcon}>
                <Feather name="book-open" size={20} color={AppColors.primary} />
              </View>
            </View>
          ))
        ) : (
          <ThemedText type="body" style={{ color: theme.textSecondary }}>No courses enrolled</ThemedText>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontWeight: '600',
    minWidth: 80,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  featuresSection: {
    marginTop: Spacing.md,
  },
  featuresList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  courseInfo: {
    flex: 1,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + "20",
    alignItems: 'center',
    justifyContent: 'center',
  },
});
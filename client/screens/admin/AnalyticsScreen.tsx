import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAdmin } from "@/contexts/AdminContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import type { UserAnalytics } from "../../../shared/schema";

type MetricSummary = {
  total: number;
  average: number;
  topUsers: Array<{ userId: string; name: string; value: number }>;
};

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { analytics, users, fetchAnalytics, hasPermission } = useAdmin();

  const [refreshing, setRefreshing] = useState(false);
  const [metricsSummary, setMetricsSummary] = useState<Record<string, MetricSummary>>({});

  useEffect(() => {
    calculateMetrics();
  }, [analytics, users]);

  const calculateMetrics = () => {
    const summary: Record<string, MetricSummary> = {};

    // Group analytics by metric
    const grouped = analytics.reduce((acc, item) => {
      if (!acc[item.metric]) {
        acc[item.metric] = [];
      }
      acc[item.metric].push(item);
      return acc;
    }, {} as Record<string, UserAnalytics[]>);

    // Calculate summary for each metric
    Object.entries(grouped).forEach(([metric, items]) => {
      const total = items.reduce((sum, item) => sum + item.value, 0);
      const average = items.length > 0 ? Math.round(total / items.length) : 0;

      // Get top users
      const userMap = items.reduce((acc, item) => {
        if (item.userId) {
          acc[item.userId] = (acc[item.userId] || 0) + item.value;
        }
        return acc;
      }, {} as Record<string, number>);

      const topUsers = Object.entries(userMap)
        .map(([userId, value]) => {
          const user = users.find(u => u.id === userId);
          return {
            userId,
            name: user?.name || user?.email || 'Unknown',
            value,
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      summary[metric] = { total, average, topUsers };
    });

    setMetricsSummary(summary);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'sessions_attended': return 'video';
      case 'documents_viewed': return 'file-text';
      case 'messages_sent': return 'message-circle';
      case 'materials_uploaded': return 'upload';
      case 'support_requests': return 'help-circle';
      default: return 'bar-chart';
    }
  };

  const getMetricTitle = (metric: string) => {
    switch (metric) {
      case 'sessions_attended': return 'Sessions Attended';
      case 'documents_viewed': return 'Documents Viewed';
      case 'messages_sent': return 'Messages Sent';
      case 'materials_uploaded': return 'Materials Uploaded';
      case 'support_requests': return 'Support Requests';
      default: return metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (!hasPermission('canViewAnalytics')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.centerContent}>
          <Feather name="bar-chart" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            Access Denied
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            You don't have permission to view analytics.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Cards */}
        <View style={styles.overview}>
          <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.primary + '20' }}>
            <Feather name="users" size={24} color={AppColors.primary} />
            <View style={styles.overviewContent}>
              <ThemedText type="h3" style={{ color: AppColors.primary }}>
                {users.length}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Total Users
              </ThemedText>
            </View>
          </Card>

          <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.accent + '20' }}>
            <Feather name="activity" size={24} color={AppColors.accent} />
            <View style={styles.overviewContent}>
              <ThemedText type="h3" style={{ color: AppColors.accent }}>
                {Object.keys(metricsSummary).length}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Metrics Tracked
              </ThemedText>
            </View>
          </Card>

          <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.success + '20' }}>
            <Feather name="trending-up" size={24} color={AppColors.success} />
            <View style={styles.overviewContent}>
              <ThemedText type="h3" style={{ color: AppColors.success }}>
                {analytics.length}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Data Points
              </ThemedText>
            </View>
          </Card>
        </View>

        {/* Metrics Breakdown */}
        <View style={styles.metricsSection}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            User Activity Metrics
          </ThemedText>

          {Object.entries(metricsSummary).map(([metric, summary]) => (
            <Card key={metric} style={{ ...styles.metricCard, backgroundColor: theme.backgroundDefault }}>
              <View style={styles.metricHeader}>
                <View style={[styles.metricIcon, { backgroundColor: AppColors.primary + '20' }]}>
                  <Feather name={getMetricIcon(metric)} size={20} color={AppColors.primary} />
                </View>
                <View style={styles.metricInfo}>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {getMetricTitle(metric)}
                  </ThemedText>
                  <View style={styles.metricStats}>
                    <ThemedText type="small" style={{ color: AppColors.primary }}>
                      Total: {summary.total.toLocaleString()}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Avg: {summary.average.toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {summary.topUsers.length > 0 && (
                <View style={styles.topUsers}>
                  <ThemedText type="small" style={styles.topUsersTitle}>
                    Top Contributors:
                  </ThemedText>
                  {summary.topUsers.slice(0, 3).map((user, index) => (
                    <View key={user.userId} style={styles.topUser}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {index + 1}. {user.name}
                      </ThemedText>
                      <ThemedText type="small" style={{ fontWeight: '600' }}>
                        {user.value}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          ))}

          {Object.keys(metricsSummary).length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="bar-chart" size={48} color={theme.textSecondary} />
              <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                No Analytics Data
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                User activity metrics will appear here as users interact with the platform.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  overview: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  overviewCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  overviewContent: {
    flex: 1,
  },
  metricsSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  metricCard: {
    padding: Spacing.lg,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  topUsers: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  topUsersTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  topUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing["5xl"],
  },
});
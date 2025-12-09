import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { LIVE_CLASSES } from "@/lib/sampleData";

export default function ClassroomScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"live" | "scheduled">("live");

  const liveClasses = LIVE_CLASSES.filter((c) => c.isLive);
  const scheduledClasses = LIVE_CLASSES.filter((c) => !c.isLive);

  const renderClassItem = ({ item }: { item: typeof LIVE_CLASSES[0] }) => (
    <Card style={styles.classCard}>
      <View style={styles.classHeader}>
        {item.isLive ? (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <ThemedText type="caption" style={{ color: AppColors.error, fontWeight: "600" }}>
              LIVE
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.scheduledBadge, { backgroundColor: AppColors.accent + "20" }]}>
            <Feather name="clock" size={12} color={AppColors.accent} />
            <ThemedText type="caption" style={{ color: AppColors.accent }}>
              {item.scheduledTime}
            </ThemedText>
          </View>
        )}
      </View>

      <ThemedText type="h4" style={styles.classTitle}>{item.topic}</ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary }}>{item.courseName}</ThemedText>
      
      <View style={styles.classFooter}>
        <View style={styles.lecturerInfo}>
          <View style={[styles.avatar, { backgroundColor: AppColors.primary + "20" }]}>
            <Feather name="user" size={16} color={AppColors.primary} />
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.lecturerName}
          </ThemedText>
        </View>

        {item.isLive ? (
          <View style={styles.participantInfo}>
            <Feather name="users" size={14} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {item.participants}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <Pressable style={[styles.actionButton, { backgroundColor: item.isLive ? AppColors.primary : theme.backgroundSecondary }]}>
        <Feather name={item.isLive ? "video" : "bell"} size={18} color={item.isLive ? "#FFF" : theme.text} />
        <ThemedText type="body" style={{ color: item.isLive ? "#FFF" : theme.text, fontWeight: "600" }}>
          {item.isLive ? "Join Now" : "Set Reminder"}
        </ThemedText>
      </Pressable>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabContainer, { paddingTop: headerHeight + Spacing.lg }]}>
        <Pressable
          style={[styles.tab, activeTab === "live" && { borderBottomColor: AppColors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("live")}
        >
          <View style={styles.tabContent}>
            {liveClasses.length > 0 ? <View style={styles.liveDotSmall} /> : null}
            <ThemedText
              type="body"
              style={{ color: activeTab === "live" ? AppColors.primary : theme.textSecondary, fontWeight: "600" }}
            >
              Live Classes
            </ThemedText>
          </View>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "scheduled" && { borderBottomColor: AppColors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("scheduled")}
        >
          <ThemedText
            type="body"
            style={{ color: activeTab === "scheduled" ? AppColors.primary : theme.textSecondary, fontWeight: "600" }}
          >
            Upcoming
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={activeTab === "live" ? liveClasses : scheduledClasses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        renderItem={renderClassItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="video-off" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              {activeTab === "live" ? "No Live Classes" : "No Upcoming Classes"}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              {activeTab === "live"
                ? "Check back later for live sessions"
                : "Your scheduled classes will appear here"}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.error,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  classCard: {
    padding: Spacing.lg,
  },
  classHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.error,
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  classTitle: {
    marginBottom: Spacing.xs,
  },
  classFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  lecturerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
});

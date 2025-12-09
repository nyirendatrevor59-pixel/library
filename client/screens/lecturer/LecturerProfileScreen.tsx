import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { SAMPLE_NOTES } from "@/lib/sampleData";

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function MenuItem({ icon, title, subtitle, onPress }: MenuItemProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: AppColors.secondary + "20" }]}>
        <Feather name={icon as any} size={18} color={AppColors.secondary} />
      </View>
      <View style={styles.menuContent}>
        <ThemedText type="body" style={{ fontWeight: "500" }}>{title}</ThemedText>
        {subtitle ? <ThemedText type="caption" style={{ color: theme.textSecondary }}>{subtitle}</ThemedText> : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function LecturerProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: AppColors.secondary + "20" }]}>
          <Feather name="user" size={32} color={AppColors.secondary} />
        </View>
        <ThemedText type="h3">{user?.name || "Professor"}</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>{user?.email}</ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: AppColors.secondary + "20" }]}>
          <ThemedText type="caption" style={{ color: AppColors.secondary, fontWeight: "600" }}>Lecturer</ThemedText>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>{SAMPLE_NOTES.length}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Uploads</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.accent }}>4</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Courses</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.success }}>156</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Students</ThemedText>
        </View>
      </Card>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Teaching</ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="book"
            title="My Courses"
            subtitle="4 active courses"
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="file-text"
            title="Uploaded Materials"
            subtitle={`${SAMPLE_NOTES.length} documents`}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="video"
            title="Class Recordings"
            subtitle="24 recordings"
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Settings</ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem icon="bell" title="Notifications" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="shield" title="Privacy" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="help-circle" title="Help & Support" />
        </Card>
      </View>

      <Pressable style={[styles.logoutButton, { backgroundColor: AppColors.error + "15" }]} onPress={handleLogout}>
        <Feather name="log-out" size={20} color={AppColors.error} />
        <ThemedText type="body" style={{ color: AppColors.error, fontWeight: "600" }}>Sign Out</ThemedText>
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginLeft: Spacing.xs,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
});

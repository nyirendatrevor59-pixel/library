import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES, SAMPLE_NOTES, SAMPLE_STUDY_GOALS, SAMPLE_TIMETABLE } from "@/lib/sampleData";

function MiniProgressRing({ progress, size = 40 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="transparent" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={AppColors.accent}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
}

function MenuItem({ icon, title, subtitle, rightElement, onPress, showArrow = true }: MenuItemProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: AppColors.primary + "20" }]}>
        <Feather name={icon as any} size={18} color={AppColors.primary} />
      </View>
      <View style={styles.menuContent}>
        <ThemedText type="body" style={{ fontWeight: "500" }}>{title}</ThemedText>
        {subtitle ? <ThemedText type="caption" style={{ color: theme.textSecondary }}>{subtitle}</ThemedText> : null}
      </View>
      {rightElement}
      {showArrow && !rightElement ? <Feather name="chevron-right" size={20} color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const enrolledCourses = AVAILABLE_COURSES.filter((c) => user?.selectedCourses?.includes(c.id));
  const overallProgress = SAMPLE_STUDY_GOALS.reduce((acc, goal) => acc + (goal.completedHours / goal.targetHours) * 100, 0) / SAMPLE_STUDY_GOALS.length;

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
        <View style={[styles.avatar, { backgroundColor: AppColors.primary + "20" }]}>
          <Feather name="user" size={32} color={AppColors.primary} />
        </View>
        <ThemedText type="h3">{user?.name || "Student"}</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>{user?.email}</ThemedText>
        <View style={[styles.roleBadge, { backgroundColor: AppColors.primary + "20" }]}>
          <ThemedText type="caption" style={{ color: AppColors.primary, fontWeight: "600" }}>Student</ThemedText>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>{enrolledCourses.length}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Courses</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.accent }}>{SAMPLE_NOTES.length}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Notes</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.success }}>{Math.round(overallProgress)}%</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Progress</ThemedText>
        </View>
      </Card>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Academic</ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="book"
            title="My Courses"
            subtitle={`${enrolledCourses.length} enrolled`}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="file-text"
            title="My Notes"
            subtitle={`${SAMPLE_NOTES.length} documents`}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="folder"
            title="Papers"
            subtitle="Research papers"
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Study</ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="calendar"
            title="Study Timetable"
            subtitle={`${SAMPLE_TIMETABLE.length} scheduled classes`}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="target"
            title="Study Goals"
            rightElement={<MiniProgressRing progress={overallProgress} />}
            showArrow={false}
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

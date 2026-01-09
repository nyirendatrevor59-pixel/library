import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useLive } from "@/contexts/LiveContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { SAMPLE_NOTES, LIVE_CLASSES, AVAILABLE_COURSES } from "@/lib/sampleData";

const STATS = [
  {
    icon: "file-text",
    label: "Notes Uploaded",
    value: SAMPLE_NOTES.length,
    color: AppColors.primary,
  },
  {
    icon: "users",
    label: "Active Students",
    value: 156,
    color: AppColors.accent,
  },
  {
    icon: "video",
    label: "Classes Held",
    value: 24,
    color: AppColors.secondary,
  },
];

export default function LecturerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { startLiveSession } = useLive();
  const navigation = useNavigation();

  const myNotes = SAMPLE_NOTES.slice(0, 3);
  const upcomingClasses = LIVE_CLASSES.filter((c) => !c.isLive);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <LinearGradient
        colors={[AppColors.secondary, AppColors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeBanner}
      >
        <View style={styles.welcomeContent}>
          <ThemedText type="body" style={styles.welcomeGreeting}>
            Good morning,
          </ThemedText>
          <ThemedText type="h2" style={styles.welcomeName}>
            {user?.name || "Professor"}
          </ThemedText>
          <ThemedText type="small" style={styles.welcomeSub}>
            Ready to inspire today
          </ThemedText>
        </View>
        <View style={styles.welcomeIcon}>
          <Feather name="award" size={40} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        {STATS.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}
            >
              <Feather name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <ThemedText type="h3" style={{ color: stat.color }}>
              {stat.value}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, textAlign: "center" }}
            >
              {stat.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Quick Actions</ThemedText>
        </View>
        <View style={styles.actionsRow}>
          <Pressable
            style={[
              styles.actionCard,
              { backgroundColor: AppColors.primary + "15" },
            ]}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: AppColors.primary },
              ]}
            >
              <Feather name="upload" size={24} color="#FFF" />
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Upload Notes
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Share materials
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.actionCard,
              { backgroundColor: AppColors.accent + "15" },
            ]}
            onPress={() => {
              if (user) {
                try {
                  const session = startLiveSession("1", user); // Start with first course
                  navigation.navigate('ClassroomTab' as never);
                } catch (error) {
                  Alert.alert("Error", "Failed to start live session");
                }
              }
            }}
          >
            <View
              style={[styles.actionIcon, { backgroundColor: AppColors.accent }]}
            >
              <Feather name="video" size={24} color="#FFF" />
            </View>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Start Class
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Go live now
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Recent Uploads</ThemedText>
          <Pressable>
            <ThemedText type="small" style={{ color: AppColors.primary }}>
              View All
            </ThemedText>
          </Pressable>
        </View>
        {myNotes.map((note) => (
          <Card key={note.id} style={styles.noteCard}>
            <View
              style={[
                styles.fileIcon,
                { backgroundColor: AppColors.error + "20" },
              ]}
            >
              <Feather name="file-text" size={20} color={AppColors.error} />
            </View>
            <View style={styles.noteInfo}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                {note.title}
              </ThemedText>
              <View style={styles.noteMeta}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {note.courseName}
                </ThemedText>
                <View style={styles.dot} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {note.uploadedAt}
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.moreButton}>
              <Feather
                name="more-vertical"
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Assignments</ThemedText>
          <Pressable>
            <ThemedText type="small" style={{ color: AppColors.primary }}>
              Create New
            </ThemedText>
          </Pressable>
        </View>
        <Card style={styles.assignmentCard}>
          <View style={styles.assignmentHeader}>
            <ThemedText type="body" style={{ fontWeight: "500" }}>
              Data Structures Project
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: AppColors.accent + "20" }]}>
              <ThemedText type="small" style={{ color: AppColors.accent, fontWeight: "600" }}>
                Active
              </ThemedText>
            </View>
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            Data Structures and Algorithms • Due: Dec 15, 2024
          </ThemedText>
          <View style={styles.assignmentStats}>
            <View style={styles.stat}>
              <Feather name="users" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                23 submitted
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                3 days left
              </ThemedText>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Upcoming Classes</ThemedText>
        </View>
        {upcomingClasses.length > 0 ? (
          upcomingClasses.map((classItem) => (
            <Card key={classItem.id} style={styles.classCard}>
              <View style={styles.classTime}>
                <ThemedText type="h4" style={{ color: AppColors.primary }}>
                  {classItem.scheduledTime}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Today
                </ThemedText>
              </View>
              <View style={styles.classInfo}>
                <ThemedText type="body" style={{ fontWeight: "500" }}>
                  {classItem.topic}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {classItem.courseName}
                </ThemedText>
              </View>
              <Pressable
                style={[
                  styles.startButton,
                  { backgroundColor: AppColors.primary },
                ]}
              >
                <Feather name="play" size={16} color="#FFF" />
              </Pressable>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="calendar" size={32} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              No upcoming classes scheduled
            </ThemedText>
          </Card>
        )}
      </View>
    </ScrollView>
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
  welcomeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeGreeting: {
    color: "rgba(255,255,255,0.8)",
  },
  welcomeName: {
    color: "#FFF",
  },
  welcomeSub: {
    color: "rgba(255,255,255,0.7)",
    marginTop: Spacing.xs,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  noteInfo: {
    flex: 1,
  },
  noteMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#9CA3AF",
  },
  moreButton: {
    padding: Spacing.xs,
  },
  classCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  classTime: {
    alignItems: "center",
    minWidth: 60,
  },
  classInfo: {
    flex: 1,
  },
  startButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  assignmentCard: {
    padding: Spacing.lg,
  },
  assignmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  assignmentStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
});

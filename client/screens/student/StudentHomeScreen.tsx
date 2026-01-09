import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";
import { useLive } from "@/contexts/LiveContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors, Shadows } from "@/constants/theme";
import {
  AVAILABLE_COURSES,
  SAMPLE_STUDY_GOALS,
  SAMPLE_TIMETABLE,
} from "@/lib/sampleData";

function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={AppColors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: "absolute" }}>
        <ThemedText type="h4" style={{ textAlign: "center" }}>
          {Math.round(progress)}%
        </ThemedText>
      </View>
    </View>
  );
}

export default function StudentHomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { liveSessions } = useLive();

  useEffect(() => {
    console.log("StudentHomeScreen: liveSessions updated", liveSessions);
    console.log("StudentHomeScreen: user selectedCourses", user?.selectedCourses);
  }, [liveSessions, user?.selectedCourses]);

  const enrolledCourses = AVAILABLE_COURSES.filter((c) =>
    user?.selectedCourses?.includes(c.id),
  );
  const todaySchedule = SAMPLE_TIMETABLE.filter((t) => t.day === "Monday");
  const overallProgress =
    SAMPLE_STUDY_GOALS.reduce(
      (acc, goal) => acc + (goal.completedHours / goal.targetHours) * 100,
      0,
    ) / SAMPLE_STUDY_GOALS.length;
  const liveClass = liveSessions.find(s => s.isLive && user?.selectedCourses?.includes(s.courseId));
  console.log("StudentHomeScreen: found liveClass", liveClass);
  const course = liveClass ? AVAILABLE_COURSES.find(c => c.id === liveClass.courseId) : null;

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
        colors={[AppColors.primary, AppColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeBanner}
      >
        <View style={styles.welcomeContent}>
          <ThemedText type="body" style={styles.welcomeGreeting}>
            Welcome back,
          </ThemedText>
          <ThemedText type="h2" style={styles.welcomeName}>
            {user?.name || "Student"}
          </ThemedText>
          <ThemedText type="small" style={styles.welcomeSub}>
            {enrolledCourses.length} courses enrolled
          </ThemedText>
        </View>
        <ProgressRing progress={overallProgress} size={90} />
      </LinearGradient>

      {liveClass ? (
        <Pressable
          style={[
            styles.liveClassCard,
            { backgroundColor: AppColors.error + "15" },
          ]}
        >
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <ThemedText
              type="small"
              style={{ color: AppColors.error, fontWeight: "600" }}
            >
              LIVE NOW
            </ThemedText>
          </View>
          <ThemedText type="h4" style={{ marginTop: Spacing.sm }}>
            {liveClass.topic}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {course?.name || "Unknown Course"} - {liveClass.participants} participants
          </ThemedText>
          <Pressable
            style={styles.joinButton}
            onPress={() => (navigation as any).navigate('LiveClass', { session: liveClass })}
          >
            <Feather name="video" size={16} color="#FFF" />
            <ThemedText
              type="small"
              style={{ color: "#FFF", fontWeight: "600" }}
            >
              Join Class
            </ThemedText>
          </Pressable>
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Study Goals</ThemedText>
          <Pressable>
            <ThemedText type="small" style={{ color: AppColors.primary }}>
              View All
            </ThemedText>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.goalsScroll}
        >
          {SAMPLE_STUDY_GOALS.map((goal) => (
            <Card key={goal.id} style={styles.goalCard}>
              <ProgressRing
                progress={(goal.completedHours / goal.targetHours) * 100}
                size={60}
                strokeWidth={6}
              />
              <ThemedText
                type="small"
                style={styles.goalTitle}
                numberOfLines={2}
              >
                {goal.title}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {goal.completedHours}/{goal.targetHours}h
              </ThemedText>
            </Card>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Today&apos;s Schedule</ThemedText>
        </View>
        {todaySchedule.length > 0 ? (
          todaySchedule.map((entry) => (
            <Card key={entry.id} style={styles.scheduleCard}>
              <View
                style={[
                  styles.timeBlock,
                  { backgroundColor: AppColors.primary + "20" },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: AppColors.primary, fontWeight: "600" }}
                >
                  {entry.startTime}
                </ThemedText>
              </View>
              <View style={styles.scheduleInfo}>
                <ThemedText type="body" style={{ fontWeight: "500" }}>
                  {entry.courseName}
                </ThemedText>
                <View style={styles.scheduleDetails}>
                  <Feather
                    name="map-pin"
                    size={12}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: theme.textSecondary }}
                  >
                    {entry.location}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {entry.startTime} - {entry.endTime}
              </ThemedText>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="calendar" size={32} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              No classes scheduled for today
            </ThemedText>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">My Courses</ThemedText>
        </View>
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <Card key={course.id} style={styles.courseCard}>
              <View
                style={[
                  styles.courseIcon,
                  { backgroundColor: AppColors.primary + "20" },
                ]}
              >
                <Feather name="book" size={20} color={AppColors.primary} />
              </View>
              <View style={styles.courseInfo}>
                <ThemedText type="body" style={{ fontWeight: "500" }}>
                  {course.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {course.code}
                </ThemedText>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={theme.textSecondary}
              />
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="book-open" size={32} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
            >
              No courses enrolled yet
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
  liveClassCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
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
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: AppColors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginTop: Spacing.md,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalsScroll: {
    gap: Spacing.md,
  },
  goalCard: {
    width: 140,
    alignItems: "center",
    padding: Spacing.lg,
  },
  goalTitle: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  timeBlock: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  courseInfo: {
    flex: 1,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
});

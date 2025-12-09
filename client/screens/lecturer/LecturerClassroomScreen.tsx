import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES, LIVE_CLASSES } from "@/lib/sampleData";

export default function LecturerClassroomScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [isLive, setIsLive] = useState(false);

  const handleStartClass = () => {
    Alert.alert(
      "Start Live Class",
      "Are you ready to start your live session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            setIsLive(true);
            Alert.alert("Live Session Started", "Your students can now join the class");
          },
        },
      ]
    );
  };

  const handleEndClass = () => {
    Alert.alert(
      "End Live Class",
      "Are you sure you want to end this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Class",
          style: "destructive",
          onPress: () => {
            setIsLive(false);
            Alert.alert("Session Ended", "Your live class has ended");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.headerSection, { paddingTop: headerHeight + Spacing.xl }]}>
        {isLive ? (
          <LinearGradient
            colors={[AppColors.error, "#DC2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.liveBanner}
          >
            <View style={styles.liveStatus}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <ThemedText type="h4" style={{ color: "#FFF" }}>LIVE NOW</ThemedText>
              </View>
              <View style={styles.liveStats}>
                <Feather name="users" size={16} color="#FFF" />
                <ThemedText type="body" style={{ color: "#FFF" }}>45 students</ThemedText>
              </View>
            </View>
            
            <View style={styles.liveControls}>
              <Pressable style={[styles.controlButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="mic" size={20} color="#FFF" />
              </Pressable>
              <Pressable style={[styles.controlButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="video" size={20} color="#FFF" />
              </Pressable>
              <Pressable style={[styles.controlButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="monitor" size={20} color="#FFF" />
              </Pressable>
              <Pressable
                style={[styles.controlButton, styles.endButton]}
                onPress={handleEndClass}
              >
                <Feather name="phone-off" size={20} color="#FFF" />
              </Pressable>
            </View>
          </LinearGradient>
        ) : (
          <Pressable onPress={handleStartClass}>
            <LinearGradient
              colors={[AppColors.primary, AppColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startClassBanner}
            >
              <View style={styles.startClassIcon}>
                <Feather name="video" size={32} color="#FFF" />
              </View>
              <ThemedText type="h3" style={{ color: "#FFF" }}>Start Live Class</ThemedText>
              <ThemedText type="body" style={{ color: "rgba(255,255,255,0.8)" }}>
                Tap to begin your live session
              </ThemedText>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      <FlatList
        data={AVAILABLE_COURSES.slice(0, 4)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">My Courses</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Select a course to start a class
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.courseCard}>
            <View style={[styles.courseIcon, { backgroundColor: AppColors.primary + "20" }]}>
              <Feather name="book" size={20} color={AppColors.primary} />
            </View>
            <View style={styles.courseInfo}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>{item.name}</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>{item.code}</ThemedText>
            </View>
            <Pressable
              style={[styles.quickStartButton, { backgroundColor: AppColors.accent + "20" }]}
              onPress={handleStartClass}
            >
              <Feather name="play" size={16} color={AppColors.accent} />
            </Pressable>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  liveBanner: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xl,
  },
  liveStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFF",
  },
  liveStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  liveControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    backgroundColor: "#FFF",
  },
  startClassBanner: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  startClassIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
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
  quickStartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useTutor } from "@/contexts/TutorContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import type { TutorTabParamList } from "@/navigation/TutorTabNavigator";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

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
      <View
        style={[styles.menuIcon, { backgroundColor: AppColors.accent + "20" }]}
      >
        <Feather name={icon as any} size={18} color={AppColors.accent} />
      </View>
      <View style={styles.menuContent}>
        <ThemedText type="body" style={{ fontWeight: "500" }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function TutorProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<BottomTabNavigationProp<TutorTabParamList>>();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { tutorAssignments, tutorRequests, liveSessions } = useTutor();
  const { users, createSupportRequest } = useAdmin();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);

  return (
    <KeyboardAwareScrollViewCompat
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
      <View style={styles.profileHeader}>
        <View
          style={[styles.avatar, { backgroundColor: AppColors.accent + "20" }]}
        >
          <Feather name="user" size={32} color={AppColors.accent} />
        </View>
        <ThemedText type="h3">{user?.name || "Tutor"}</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {user?.email}
        </ThemedText>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, {
            backgroundColor: availabilityStatus ? AppColors.success : AppColors.error
          }]} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            {availabilityStatus ? 'Available' : 'Unavailable'}
          </ThemedText>
        </View>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: AppColors.accent + "20" },
          ]}
        >
          <ThemedText
            type="small"
            style={{ color: AppColors.accent, fontWeight: "600" }}
          >
            Tutor
          </ThemedText>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.accent }}>
            {tutorAssignments.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Students
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>
            {liveSessions.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Sessions
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.success }}>
            {tutorRequests.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Requests
          </ThemedText>
        </View>
      </Card>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Active Students
        </ThemedText>
        <Card style={styles.studentsCard}>
          {tutorAssignments.length > 0 ? (
            tutorAssignments.slice(0, 5).map((assignment, index) => {
              const student = users.find(u => u.id === assignment.studentId);
              return (
                <View key={assignment.id} style={styles.studentItem}>
                  <View style={[styles.studentAvatar, { backgroundColor: AppColors.primary + "20" }]}>
                    <Feather name="user" size={16} color={AppColors.primary} />
                  </View>
                  <View style={styles.studentInfo}>
                    <ThemedText type="body" style={{ fontWeight: "500" }}>
                      {student?.name || "Unknown Student"}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {student?.email || ""}
                    </ThemedText>
                  </View>
                  {index < tutorAssignments.slice(0, 5).length - 1 && (
                    <View style={[styles.studentDivider, { backgroundColor: theme.border }]} />
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyStudents}>
              <Feather name="users" size={24} color={theme.textSecondary} />
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                No active students assigned
              </ThemedText>
            </View>
          )}
          {tutorAssignments.length > 5 && (
            <Pressable
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('TutorStudentsTab')}
            >
              <ThemedText type="small" style={{ color: AppColors.accent, fontWeight: "500" }}>
                View all {tutorAssignments.length} students
              </ThemedText>
              <Feather name="chevron-right" size={16} color={AppColors.accent} />
            </Pressable>
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Availability
        </ThemedText>
        <Card style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View
              style={[styles.menuIcon, { backgroundColor: AppColors.success + "20" }]}
            >
              <Feather name="check-circle" size={18} color={AppColors.success} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                Available for Sessions
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Students can request sessions with you
              </ThemedText>
            </View>
            <Switch
              value={availabilityStatus}
              onValueChange={setAvailabilityStatus}
              trackColor={{ false: theme.border, true: AppColors.success + "40" }}
              thumbColor={availabilityStatus ? AppColors.success : theme.textSecondary}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.menuItem}>
            <View
              style={[styles.menuIcon, { backgroundColor: AppColors.primary + "20" }]}
            >
              <Feather name="eye" size={18} color={AppColors.primary} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                Profile Visibility
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Show your profile to students
              </ThemedText>
            </View>
            <Switch
              value={profileVisible}
              onValueChange={setProfileVisible}
              trackColor={{ false: theme.border, true: AppColors.primary + "40" }}
              thumbColor={profileVisible ? AppColors.primary : theme.textSecondary}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Performance
        </ThemedText>
        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: AppColors.success }}>
              {tutorRequests.filter(r => r.status === 'resolved').length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Resolved
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: AppColors.warning }}>
              {Math.round((tutorRequests.filter(r => r.status === 'resolved').length / Math.max(tutorRequests.length, 1)) * 100)}%
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Success Rate
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: AppColors.accent }}>
              {liveSessions.filter(s => s.endTime).length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Completed
            </ThemedText>
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Tutoring
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="users"
            title="My Students"
            subtitle={`${tutorAssignments.length} students assigned`}
            onPress={() => navigation.navigate('TutorStudentsTab')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="message-circle"
            title="Student Requests"
            subtitle={`${tutorRequests.filter(r => r.status === 'pending').length} pending requests`}
            onPress={() => navigation.navigate('TutorRequestsTab')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="video"
            title="Live Sessions"
            subtitle={`${liveSessions.filter(s => s.isLive).length} active sessions`}
            onPress={() => navigation.navigate('TutorSessionsTab')}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Settings
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="bell"
            title="Notifications"
            subtitle={notificationsEnabled ? "Enabled" : "Disabled"}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="shield"
            title="Privacy Settings"
            subtitle={profileVisible ? "Profile visible" : "Profile hidden"}
            onPress={() => Alert.alert('Privacy Settings', 'Manage your privacy preferences')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="user"
            title="Edit Profile"
            subtitle="Update your information"
            onPress={() => Alert.alert('Edit Profile', 'Profile editing functionality would open here')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={async () => {
              const success = await createSupportRequest({
                type: 'technical_problem',
                title: 'Tutor Support Request',
                description: 'Tutor needs assistance with the platform'
              });
              if (success) {
                Alert.alert('Support Request', 'Your support request has been submitted');
              }
            }}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="settings"
            title="App Settings"
            subtitle="General app preferences"
            onPress={() => Alert.alert('App Settings', 'App settings and preferences')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="log-out"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={() => {
              console.log('Sign out menu item pressed');
              logout();
            }}
          />
        </Card>
      </View>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  studentsCard: {
    padding: Spacing.lg,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  studentInfo: {
    flex: 1,
  },
  studentDivider: {
    height: 1,
    marginLeft: 48,
  },
  emptyStudents: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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
});
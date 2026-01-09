import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Modal, FlatList, Alert, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";
import {
  AVAILABLE_COURSES,
  SAMPLE_NOTES,
  SAMPLE_STUDY_GOALS,
  SAMPLE_TIMETABLE,
} from "@/lib/sampleData";
import type { TutorRequest } from "../../../shared/schema";

function MiniProgressRing({
  progress,
  size = 40,
}: {
  progress: number;
  size?: number;
}) {
  const strokeWidth = 4;
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

function MenuItem({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  showArrow = true,
}: MenuItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View
        style={[styles.menuIcon, { backgroundColor: AppColors.primary + "20" }]}
      >
        <Feather name={icon as any} size={18} color={AppColors.primary} />
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
      {rightElement}
      {showArrow && !rightElement ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, logout, token } = useAuth();
  const { subscription } = useSubscription();

  const enrolledCourses = AVAILABLE_COURSES.filter((c) =>
    user?.selectedCourses?.includes(c.id),
  );
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueRequest, setContinueRequest] = useState<TutorRequest | null>(null);
  const [continueDescription, setContinueDescription] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    if (!token) return;
    try {
      console.log("Fetching tutor requests for student:", user?.id);
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests?studentId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched requests:", data);
        setRequests(data);
      } else {
        console.log("Failed to fetch requests, status:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  };

  const updateRequest = async (requestId: string, updates: any) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchRequests();
        return true;
      } else {
        Alert.alert("Error", "Failed to update request");
        return false;
      }
    } catch (error) {
      console.error("Update request error:", error);
      Alert.alert("Error", "Failed to update request");
      return false;
    }
  };

  const markAsResolved = async (request: TutorRequest) => {
    Alert.alert(
      "Mark as Resolved",
      "Are you sure you want to mark this request as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: () => updateRequest(request.id, { status: "resolved" }),
        },
      ]
    );
  };

  const continueAsking = (request: TutorRequest) => {
    setContinueRequest(request);
    setContinueDescription("");
    setShowContinueModal(true);
  };

  const submitContinueRequest = async () => {
    if (!continueRequest) return;

    const currentMessages = JSON.parse(continueRequest.messages || '[]');
    const updatedMessages = [...currentMessages, {sender: 'student', message: continueDescription.trim(), timestamp: Date.now()}];

    const success = await updateRequest(continueRequest.id, {
      messages: JSON.stringify(updatedMessages),
      status: "pending",
    });

    if (success) {
      setShowContinueModal(false);
      setContinueRequest(null);
      setContinueDescription("");
      Alert.alert("Success", "Your follow-up question has been sent to the tutor!");
    }
  };

  const filteredRequests = selectedCourseFilter === "all" ? requests : requests.filter(r => r.courseId === selectedCourseFilter);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "topic_help":
        return "Topic Help";
      case "question":
        return "Question";
      case "assignment_help":
        return "Assignment Help";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return AppColors.accent;
      case "answered":
        return AppColors.success;
      case "resolved":
        return "#10B981";
      default:
        return theme.textSecondary;
    }
  };

  const overallProgress =
    SAMPLE_STUDY_GOALS.reduce(
      (acc, goal) => acc + (goal.completedHours / goal.targetHours) * 100,
      0,
    ) / SAMPLE_STUDY_GOALS.length;











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
          style={[styles.avatar, { backgroundColor: AppColors.primary + "20" }]}
        >
          <Feather name="user" size={32} color={AppColors.primary} />
        </View>
        <ThemedText type="h3">{user?.name || "Student"}</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {user?.email}
        </ThemedText>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: AppColors.primary + "20" },
          ]}
        >
          <ThemedText
            type="small"
            style={{ color: AppColors.primary, fontWeight: "600" }}
          >
            Student
          </ThemedText>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>
            {enrolledCourses.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Courses
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.accent }}>
            {SAMPLE_NOTES.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Notes
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <Pressable style={styles.statItem} onPress={() => setShowGoalsModal(true)}>
           <ThemedText type="h3" style={{ color: AppColors.success }}>
             {Math.round(overallProgress)}%
           </ThemedText>
           <ThemedText type="small" style={{ color: theme.textSecondary }}>
             Progress
           </ThemedText>
         </Pressable>
      </Card>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Academic
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="book"
            title="My Courses"
            subtitle={`${enrolledCourses.length} enrolled`}
            onPress={() => setShowCoursesModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="file-text"
            title="My Notes"
            subtitle={`${SAMPLE_NOTES.length} documents`}
            onPress={() => navigation.navigate('DocumentsTab' as never)}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
           <MenuItem icon="help-circle" title="My Tutors" subtitle="View tutors and requests" onPress={() => navigation.navigate('MyTutors' as never)} />
           <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <MenuItem icon="folder" title="Papers" subtitle="Research papers" onPress={() => navigation.navigate('DocumentsTab' as never)} />
        </Card>
      </View>


      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Study
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="calendar"
            title="Study Timetable"
            subtitle={`${SAMPLE_TIMETABLE.length} scheduled classes`}
            onPress={() => setShowTimetableModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="target"
            title="Study Goals"
            rightElement={<MiniProgressRing progress={overallProgress} />}
            showArrow={false}
            onPress={() => setShowGoalsModal(true)}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Settings
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem icon="bell" title="Notifications" onPress={() => alert('Notifications settings coming soon!')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="shield" title="Privacy" onPress={() => alert('Privacy settings coming soon!')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="help-circle" title="Help & Support" onPress={() => alert('Help & Support coming soon!')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="credit-card"
            title="Subscription Status"
            subtitle={subscription ? (subscription.isActive ? `${subscription.subscription?.plan.name} - ${subscription.daysRemaining} days left` : 'Inactive') : 'Loading...'}
            onPress={() => {
              const parentNavigation = navigation.getParent();
              parentNavigation?.navigate('AccountDetails');
            }}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="log-out" title="Sign Out" onPress={logout} />
        </Card>
      </View>

      <Modal visible={showTimetableModal} animationType="slide" onRequestClose={() => setShowTimetableModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowTimetableModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Study Timetable</ThemedText>
          </View>
          <FlatList
            data={SAMPLE_TIMETABLE}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.timetableList}
            renderItem={({ item }) => (
              <Card style={styles.timetableItem}>
                <View style={styles.timetableInfo}>
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {item.courseName}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {item.day} • {item.startTime} - {item.endTime}
                  </ThemedText>
                </View>
                <View style={styles.timetableIcon}>
                  <Feather name="clock" size={20} color={AppColors.primary} />
                </View>
              </Card>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showGoalsModal} animationType="slide" onRequestClose={() => setShowGoalsModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowGoalsModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Study Goals</ThemedText>
          </View>
          <FlatList
            data={SAMPLE_STUDY_GOALS}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.goalsList}
            renderItem={({ item }) => (
              <Card style={styles.goalItem}>
                <View style={styles.goalInfo}>
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {item.completedHours}/{item.targetHours} hours
                  </ThemedText>
                </View>
                <MiniProgressRing progress={(item.completedHours / item.targetHours) * 100} />
              </Card>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showCoursesModal} animationType="slide" onRequestClose={() => setShowCoursesModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCoursesModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">My Courses</ThemedText>
          </View>
          <FlatList
            data={enrolledCourses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.coursesList}
            renderItem={({ item }) => (
              <Pressable onPress={() => { setShowCoursesModal(false); navigation.navigate('ClassroomTab' as never); }}>
                <Card style={styles.courseItem}>
                  <View style={styles.courseInfo}>
                    <ThemedText type="body" style={{ fontWeight: "500" }}>
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {item.code} • {item.category}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Lecturer: {item.lecturerName}
                    </ThemedText>
                  </View>
                  <View style={styles.courseIcon}>
                    <Feather name="book-open" size={20} color={AppColors.primary} />
                  </View>
                </Card>
              </Pressable>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showTutorModal} animationType="slide" onRequestClose={() => setShowTutorModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowTutorModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">My Tutor Requests</ThemedText>
            <Pressable onPress={() => { setShowTutorModal(false); navigation.navigate('MyTutors' as never); }}>
              <ThemedText type="small" style={{ color: AppColors.primary }}>View All</ThemedText>
            </Pressable>
          </View>
          <View style={styles.filterContainer}>
            <Pressable
              style={[
                styles.filterButton,
                { backgroundColor: selectedCourseFilter === "all" ? AppColors.primary + "20" : theme.backgroundSecondary },
              ]}
              onPress={() => setSelectedCourseFilter("all")}
            >
              <ThemedText type="small" style={{ color: selectedCourseFilter === "all" ? AppColors.primary : theme.text }}>
                All Courses
              </ThemedText>
            </Pressable>
            {enrolledCourses.map((course) => (
              <Pressable
                key={course.id}
                style={[
                  styles.filterButton,
                  { backgroundColor: selectedCourseFilter === course.id ? AppColors.primary + "20" : theme.backgroundSecondary },
                ]}
                onPress={() => setSelectedCourseFilter(course.id)}
              >
                <ThemedText type="small" style={{ color: selectedCourseFilter === course.id ? AppColors.primary : theme.text }}>
                  {course.code}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <FlatList
            data={filteredRequests}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.requestsList}
            renderItem={({ item }) => (
              <Card style={styles.requestItem}>
                <View style={styles.requestHeader}>
                  <ThemedText type="body" style={{ fontWeight: "500", flex: 1 }}>
                    {item.title}
                  </ThemedText>
                  {item.status === "answered" && (
                    <View style={styles.unreadIndicator} />
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                    <ThemedText type="small" style={{ color: getStatusColor(item.status), fontWeight: "600" }}>
                      {(item.status || "pending").charAt(0).toUpperCase() + (item.status || "pending").slice(1)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                  {getTypeLabel(item.type)} • {AVAILABLE_COURSES.find(c => c.id === item.courseId)?.name || "Unknown Course"}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {new Date(item.createdAt || Date.now()).toLocaleDateString()} at {new Date(item.createdAt || Date.now()).toLocaleTimeString()}
                </ThemedText>
                {item.response ? (
                  <View style={{ marginTop: Spacing.md }}>
                    <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: "600" }}>
                      Tutor Response:
                    </ThemedText>
                    <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                      {item.response}
                    </ThemedText>
                    {item.status === "answered" ? (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: AppColors.success }]}
                        onPress={() => markAsResolved(item)}
                      >
                        <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                          Mark as Resolved
                        </ThemedText>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: AppColors.primary, marginTop: Spacing.sm }]}
                      onPress={() => continueAsking(item)}
                    >
                      <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                        Ask Further Questions
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="message-circle" size={48} color={theme.textSecondary} />
                <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                  No tutor requests yet
                </ThemedText>
                <Pressable onPress={() => { setShowTutorModal(false); navigation.navigate('MyTutors' as never); }}>
                  <ThemedText type="small" style={{ color: AppColors.primary, marginTop: Spacing.sm }}>
                    Create your first request
                  </ThemedText>
                </Pressable>
              </View>
            }
          />
        </View>
      </Modal>

      <Modal visible={showContinueModal} animationType="slide" onRequestClose={() => setShowContinueModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowContinueModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Continue Asking</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Update your request description:
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              placeholder="Describe your updated request in detail"
              placeholderTextColor={theme.textSecondary}
              value={continueDescription}
              onChangeText={setContinueDescription}
              multiline
              numberOfLines={6}
            />

            <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary }]} onPress={submitContinueRequest}>
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Update Request
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

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
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  detailsContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    backgroundColor: 'white', // or theme.backgroundDefault
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  detailsScroll: {
    maxHeight: '70%', // adjust
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  timetableList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  timetableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  timetableInfo: {
    flex: 1,
  },
  timetableIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + "20",
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalsList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  goalInfo: {
    flex: 1,
  },
  coursesList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tutorCard: {
    padding: 0,
    overflow: "hidden",
  },
  requestsList: {
    gap: Spacing.md,
  },
  requestItem: {
    padding: Spacing.lg,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.error,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  modalContent: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  detailsContent: {
    gap: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    fontWeight: '600',
    minWidth: 60,
  },
  description: {
    gap: Spacing.sm,
  },
  messagesSection: {
    gap: Spacing.sm,
  },
  messageItem: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  responseSection: {
    gap: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.xl,
  },
  statusUpdateSection: {
    marginTop: Spacing.xl,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  form: {
    gap: Spacing.lg,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: "#F3F4F6",
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
});

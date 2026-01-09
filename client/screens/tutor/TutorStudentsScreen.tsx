import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, TextInput, Modal, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useTutor } from "@/contexts/TutorContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigation } from "@react-navigation/native";
import type { TutorTabParamList } from "@/navigation/TutorTabNavigator";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";
import type { UserTutor, User, Course } from "../../../shared/schema";

export default function TutorStudentsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<BottomTabNavigationProp<TutorTabParamList>>();
  const { theme } = useTheme();
  const { tutorAssignments, createLiveSession } = useTutor();
  const { users, unassignTutor } = useAdmin();
  const { token, user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [selectedStudent, setSelectedStudent] = useState<{student: User, assignment: UserTutor} | null>(null);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const getStudentInfo = (assignment: UserTutor) => {
    return users.find(u => u.id === assignment.studentId);
  };

  const getCourseInfo = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const filteredAndSortedAssignments = tutorAssignments
    .filter(assignment => {
      const student = getStudentInfo(assignment);
      if (!student) return false;

      const matchesSearch = searchQuery === '' ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === null || assignment.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const studentA = getStudentInfo(a);
      const studentB = getStudentInfo(b);
      if (!studentA || !studentB) return 0;

      switch (sortBy) {
        case 'name':
          return studentA.name.localeCompare(studentB.name);
        case 'date':
          return (b.assignedAt || 0) - (a.assignedAt || 0);
        case 'status':
          return (a.status || 'active').localeCompare(b.status || 'active');
        default:
          return 0;
      }
    });

  const handleUnassignStudent = async (assignmentId: string) => {
    Alert.alert(
      'Unassign Student',
      'Are you sure you want to unassign this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            const success = await unassignTutor(assignmentId);
            if (success) {
              Alert.alert('Success', 'Student unassigned successfully');
            } else {
              Alert.alert('Error', 'Failed to unassign student');
            }
          }
        }
      ]
    );
  };

  const renderAssignmentItem = ({ item }: { item: UserTutor }) => {
    const student = getStudentInfo(item);
    const course = item.courseId ? getCourseInfo(item.courseId) : null;
    if (!student) return null;

    return (
      <Pressable onPress={() => setSelectedStudent({ student, assignment: item })}>
        <Card style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {student.name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {student.email}
            </ThemedText>
            <ThemedText type="small" style={{ color: AppColors.primary }}>
              {course ? course.name : `Course ID: ${item.courseId}`}
            </ThemedText>
          </View>
          <View style={styles.assignmentInfo}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Assigned: {item.assignedAt ? new Date(item.assignedAt * 1000).toLocaleDateString() : 'N/A'}
            </ThemedText>
            <View style={[styles.statusBadge, {
              backgroundColor: item.status === 'active' ? AppColors.success + '20' : AppColors.error + '20'
            }]}>
              <ThemedText type="small" style={{
                color: item.status === 'active' ? AppColors.success : AppColors.error
              }}>
                {(item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.quickActions}>
            <Pressable
              style={[styles.quickActionButton, { backgroundColor: AppColors.primary }]}
              onPress={async () => {
                if (!user?.id || !item.courseId) return;
                const success = await createLiveSession({
                  lecturerId: user.id,
                  courseId: item.courseId,
                  topic: `Session with ${getStudentInfo(item)?.name}`,
                  scheduledTime: undefined,
                });
                if (success) {
                  Alert.alert('Success', 'Live session created');
                  navigation.navigate('TutorSessionsTab');
                } else {
                  Alert.alert('Error', 'Failed to create session');
                }
              }}
            >
              <Feather name="video" size={14} color="#FFF" />
            </Pressable>
            <Pressable
              style={[styles.quickActionButton, { backgroundColor: AppColors.accent }]}
              onPress={() => Alert.alert('Send Message', 'Send a message to this student')}
            >
              <Feather name="message-circle" size={14} color="#FFF" />
            </Pressable>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.header}>
        <ThemedText type="h3">My Students</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          Students assigned to you for tutoring
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: theme.text, borderColor: theme.textSecondary }]}
          placeholder="Search students by name or email..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Feather name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
      </View>

      <View style={styles.filterContainer}>
        <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.sm }}>Status:</ThemedText>
        <View style={styles.filterButtons}>
          <Pressable
            style={[styles.filterButton, statusFilter === null && { backgroundColor: AppColors.primary }]}
            onPress={() => setStatusFilter(null)}
          >
            <ThemedText type="small" style={{ color: statusFilter === null ? '#FFF' : theme.text }}>
              All ({tutorAssignments.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, statusFilter === 'active' && { backgroundColor: AppColors.success }]}
            onPress={() => setStatusFilter('active')}
          >
            <ThemedText type="small" style={{ color: statusFilter === 'active' ? '#FFF' : AppColors.success }}>
              Active ({tutorAssignments.filter(a => a.status === 'active').length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, statusFilter === 'inactive' && { backgroundColor: AppColors.error }]}
            onPress={() => setStatusFilter('inactive')}
          >
            <ThemedText type="small" style={{ color: statusFilter === 'inactive' ? '#FFF' : AppColors.error }}>
              Inactive ({tutorAssignments.filter(a => a.status === 'inactive').length})
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>
            {tutorAssignments.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Assigned Students
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.success }}>
            {tutorAssignments.filter(a => a.status === 'active').length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Active
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.accent }}>
            {tutorAssignments.filter(a => a.status === 'inactive').length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Inactive
          </ThemedText>
        </View>
      </Card>

      <FlatList
        data={filteredAndSortedAssignments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignmentItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No Assigned Students
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Students assigned to you by administrators will appear here.
            </ThemedText>
          </View>
        }
      />

      <Modal visible={!!selectedStudent} animationType="slide" onRequestClose={() => setSelectedStudent(null)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelectedStudent(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Student Details</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            {selectedStudent && (
              <View style={styles.modalContent}>
                <View style={styles.studentHeader}>
                  <View style={[styles.avatar, { backgroundColor: AppColors.primary }]}>
                    <ThemedText type="h2" style={{ color: '#FFF' }}>
                      {selectedStudent.student.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={styles.studentHeaderInfo}>
                    <ThemedText type="h4">{selectedStudent.student.name}</ThemedText>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      {selectedStudent.student.email}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: AppColors.primary, marginTop: Spacing.xs }}>
                      Role: {selectedStudent.student.role}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <ThemedText type="h4" style={styles.sectionTitle}>Assignment Details</ThemedText>
                  <View style={styles.detailRow}>
                    <ThemedText type="small" style={styles.detailLabel}>Course:</ThemedText>
                    <ThemedText type="small">
                      {selectedStudent.assignment.courseId && getCourseInfo(selectedStudent.assignment.courseId)?.name}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText type="small" style={styles.detailLabel}>Status:</ThemedText>
                    <View style={[styles.statusBadge, {
                      backgroundColor: selectedStudent.assignment.status === 'active' ? AppColors.success + '20' : AppColors.error + '20'
                    }]}>
                      <ThemedText type="small" style={{
                        color: selectedStudent.assignment.status === 'active' ? AppColors.success : AppColors.error
                      }}>
                        {(selectedStudent.assignment.status || 'active').charAt(0).toUpperCase() + (selectedStudent.assignment.status || 'active').slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText type="small" style={styles.detailLabel}>Assigned:</ThemedText>
                    <ThemedText type="small">
                      {selectedStudent.assignment.assignedAt ? new Date(selectedStudent.assignment.assignedAt * 1000).toLocaleString() : 'N/A'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalActionButton, { backgroundColor: AppColors.primary }]}
                    onPress={async () => {
                      if (!user?.id || !selectedStudent.assignment.courseId) return;
                      const success = await createLiveSession({
                        lecturerId: user.id,
                        courseId: selectedStudent.assignment.courseId,
                        topic: `Session with ${selectedStudent.student.name}`,
                        scheduledTime: undefined, // Live session
                      });
                      if (success) {
                        Alert.alert('Success', 'Live session created');
                        navigation.navigate('TutorSessionsTab');
                      } else {
                        Alert.alert('Error', 'Failed to create session');
                      }
                    }}
                  >
                    <Feather name="video" size={20} color="#FFF" />
                    <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                      Create Live Session
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.modalActionButton, { backgroundColor: AppColors.accent }]}
                    onPress={() => Alert.alert('Send Message', `Send a message to ${selectedStudent.student.name}`)}
                  >
                    <Feather name="message-circle" size={20} color="#FFF" />
                    <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                      Send Message
                    </ThemedText>
                  </Pressable>

                  {selectedStudent.assignment.status === 'inactive' && (
                    <Pressable
                      style={[styles.modalActionButton, { backgroundColor: AppColors.error }]}
                      onPress={() => handleUnassignStudent(selectedStudent.assignment.id)}
                    >
                      <Feather name="user-x" size={20} color="#FFF" />
                      <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                        Unassign Student
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: Spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  studentCard: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  assignmentInfo: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing["5xl"],
  },
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentHeaderInfo: {
    flex: 1,
  },
  detailSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  modalActions: {
    gap: Spacing.md,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    fontWeight: '600',
    minWidth: 80,
  },
});
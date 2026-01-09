import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Modal, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useTutor } from "@/contexts/TutorContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";
import type { LiveSession, UserTutor, Course } from "../../../shared/schema";

export default function TutorSessionsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { liveSessions, createLiveSession, updateLiveSession, tutorAssignments } = useTutor();
  const { users } = useAdmin();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [sessionForm, setSessionForm] = useState({
    topic: '',
    courseId: '' as string,
    studentId: '' as string,
    scheduledTime: null as number | null,
  });

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

  const getStudentInfo = (studentId: string) => {
    return users.find(u => u.id === studentId);
  };

  const getCourseInfo = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const getAssignmentForCourse = (courseId: string) => {
    return tutorAssignments.find(a => a.courseId === courseId && a.status === 'active');
  };

  const getSessionStatus = (session: LiveSession) => {
    if (session.isLive) return 'live';
    if (session.scheduledTime && session.scheduledTime > Math.floor(Date.now() / 1000)) return 'scheduled';
    if (session.endTime) return 'ended';
    return 'unknown';
  };

  const getSessionDuration = (session: LiveSession) => {
    if (!session.startTime) return 'Not started';
    const endTime = session.endTime || Math.floor(Date.now() / 1000);
    const duration = endTime - session.startTime;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredSessions = liveSessions.filter(session => {
    const matchesSearch = searchQuery === '' ||
      session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.courseId && session.courseId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === null || getSessionStatus(session) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateSession = async () => {
    if (!sessionForm.topic.trim() || !sessionForm.courseId || !sessionForm.studentId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Verify the student is assigned to this tutor for the course
    const assignment = getAssignmentForCourse(sessionForm.courseId);
    if (!assignment || assignment.studentId !== sessionForm.studentId) {
      Alert.alert('Error', 'This student is not assigned to you for this course');
      return;
    }

    const success = await createLiveSession({
      courseId: sessionForm.courseId,
      topic: sessionForm.topic.trim(),
      scheduledTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });

    if (success) {
      setShowCreateModal(false);
      setSessionForm({ topic: '', courseId: '', studentId: '', scheduledTime: null });
      Alert.alert('Success', 'Live session created');
    } else {
      Alert.alert('Error', 'Failed to create live session');
    }
  };

  const handleStartSession = async (session: LiveSession) => {
    const success = await updateLiveSession(session.id, { isLive: 1, startTime: Math.floor(Date.now() / 1000) });
    if (success) {
      Alert.alert('Success', 'Session started');
    } else {
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const handleEndSession = async (session: LiveSession) => {
    const success = await updateLiveSession(session.id, { isLive: 0, endTime: Math.floor(Date.now() / 1000) });
    if (success) {
      Alert.alert('Success', 'Session ended');
    } else {
      Alert.alert('Error', 'Failed to end session');
    }
  };

  const renderSessionItem = ({ item }: { item: LiveSession }) => {
    const course = item.courseId ? getCourseInfo(item.courseId) : null;
    const status = getSessionStatus(item);
    const statusColor = status === 'live' ? AppColors.success :
                       status === 'scheduled' ? AppColors.primary :
                       status === 'ended' ? AppColors.error : theme.textSecondary;

    return (
      <Pressable onPress={() => setSelectedSession(item)}>
        <Card style={styles.sessionCard}>
          <View style={styles.sessionInfo}>
            <View style={styles.sessionHeader}>
              <ThemedText type="body" style={{ fontWeight: '600', flex: 1 }}>
                {item.topic}
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <ThemedText type="small" style={{ color: statusColor }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {course ? course.name : `Course ${item.courseId}`}
            </ThemedText>
            <View style={styles.sessionMeta}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.participants || 0} participants
              </ThemedText>
              {item.startTime && (
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Duration: {getSessionDuration(item)}
                </ThemedText>
              )}
            </View>
          </View>
          <View style={styles.sessionActions}>
            {status === 'live' ? (
              <>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: AppColors.accent }]}
                  onPress={() => Alert.alert('Join Session', 'Open the live video session')}
                >
                  <Feather name="video" size={16} color="#FFF" />
                  <ThemedText type="small" style={{ color: '#FFF' }}>Join</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: AppColors.error }]}
                  onPress={() => handleEndSession(item)}
                >
                  <Feather name="stop-circle" size={14} color="#FFF" />
                  <ThemedText type="small" style={{ color: '#FFF' }}>End</ThemedText>
                </Pressable>
              </>
            ) : status === 'scheduled' ? (
              <Pressable
                style={[styles.actionButton, { backgroundColor: AppColors.success }]}
                onPress={() => handleStartSession(item)}
              >
                <Feather name="play" size={16} color="#FFF" />
                <ThemedText type="small" style={{ color: '#FFF' }}>Start</ThemedText>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.actionButton, { backgroundColor: AppColors.primary }]}
                onPress={() => Alert.alert('View Recording', 'View session recording (if available)')}
              >
                <Feather name="play-circle" size={16} color="#FFF" />
                <ThemedText type="small" style={{ color: '#FFF' }}>View</ThemedText>
              </Pressable>
            )}
          </View>
        </Card>
      </Pressable>
    );
  };

  const assignedCourses = [...new Set(tutorAssignments.filter(a => a.status === 'active' && a.courseId).map(a => a.courseId!))];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.header}>
        <ThemedText type="h3">Live Sessions</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
          Host live classrooms for your students
        </ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: theme.text, borderColor: theme.textSecondary }]}
          placeholder="Search sessions by topic or course..."
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
              All ({liveSessions.length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, statusFilter === 'live' && { backgroundColor: AppColors.success }]}
            onPress={() => setStatusFilter('live')}
          >
            <ThemedText type="small" style={{ color: statusFilter === 'live' ? '#FFF' : AppColors.success }}>
              Live ({liveSessions.filter(s => s.isLive).length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, statusFilter === 'scheduled' && { backgroundColor: AppColors.primary }]}
            onPress={() => setStatusFilter('scheduled')}
          >
            <ThemedText type="small" style={{ color: statusFilter === 'scheduled' ? '#FFF' : AppColors.primary }}>
              Scheduled ({liveSessions.filter(s => s.scheduledTime && s.scheduledTime > Math.floor(Date.now() / 1000) && !s.isLive).length})
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.filterButton, statusFilter === 'ended' && { backgroundColor: AppColors.error }]}
            onPress={() => setStatusFilter('ended')}
          >
            <ThemedText type="small" style={{ color: statusFilter === 'ended' ? '#FFF' : AppColors.error }}>
              Ended ({liveSessions.filter(s => s.endTime).length})
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>
            {liveSessions.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total Sessions
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.success }}>
            {liveSessions.filter(s => s.isLive).length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Live Now
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <Pressable style={styles.statItem} onPress={() => setShowCreateModal(true)}>
          <Feather name="plus" size={24} color={AppColors.primary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            New Session
          </ThemedText>
        </Pressable>
      </Card>

      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="video" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No Live Sessions
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Create your first live session to start teaching.
            </ThemedText>
          </View>
        }
      />

      {/* Create Session Modal */}
      <Modal visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Create Live Session</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Session Topic *</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={sessionForm.topic}
                onChangeText={(text) => setSessionForm(prev => ({ ...prev, topic: text }))}
                placeholder="Enter session topic"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Course *</ThemedText>
              <View style={styles.options}>
                {assignedCourses.map((courseId) => (
                  <Pressable
                    key={courseId}
                    style={[
                      styles.option,
                      sessionForm.courseId === courseId && { backgroundColor: AppColors.primary + '20' },
                    ]}
                    onPress={() => setSessionForm(prev => ({ ...prev, courseId }))}
                  >
                    <ThemedText
                      type="body"
                      style={{ color: sessionForm.courseId === courseId ? AppColors.primary : theme.text }}
                    >
                      Course {courseId}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {sessionForm.courseId && (
              <View style={[styles.inputGroup, { borderColor: theme.border }]}>
                <ThemedText type="small" style={styles.label}>Student *</ThemedText>
                <View style={styles.options}>
                  {tutorAssignments
                    .filter(a => a.courseId === sessionForm.courseId && a.status === 'active' && a.studentId)
                    .map((assignment) => {
                      const student = getStudentInfo(assignment.studentId!);
                      if (!student) return null;
                      return (
                        <Pressable
                          key={assignment.id}
                          style={[
                            styles.option,
                            sessionForm.studentId === assignment.studentId && { backgroundColor: AppColors.primary + '20' },
                          ]}
                          onPress={() => setSessionForm(prev => ({ ...prev, studentId: assignment.studentId! }))}
                        >
                          <ThemedText
                            type="body"
                            style={{ color: sessionForm.studentId === assignment.studentId ? AppColors.primary : theme.text }}
                          >
                            {student.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
            )}

            <Button onPress={handleCreateSession} style={{ marginTop: Spacing.lg }}>
              Create Session
            </Button>
          </View>
        </View>
      </Modal>

      {/* Session Details Modal */}
      <Modal visible={!!selectedSession} animationType="slide" onRequestClose={() => setSelectedSession(null)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelectedSession(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Session Details</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            {selectedSession && (
              <View style={styles.modalContent}>
                <View style={styles.sessionDetailHeader}>
                  <View style={[styles.sessionStatusIcon, {
                    backgroundColor: getSessionStatus(selectedSession) === 'live' ? AppColors.success :
                                   getSessionStatus(selectedSession) === 'scheduled' ? AppColors.primary :
                                   AppColors.error
                  }]}>
                    <Feather name={
                      getSessionStatus(selectedSession) === 'live' ? 'video' :
                      getSessionStatus(selectedSession) === 'scheduled' ? 'clock' :
                      'check-circle'
                    } size={24} color="#FFF" />
                  </View>
                  <View style={styles.sessionDetailInfo}>
                    <ThemedText type="h4">{selectedSession.topic}</ThemedText>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      {selectedSession.courseId && getCourseInfo(selectedSession.courseId)?.name}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <ThemedText type="h4" style={styles.sectionTitle}>Session Information</ThemedText>
                  <View style={styles.detailRow}>
                    <ThemedText type="small" style={styles.detailLabel}>Status:</ThemedText>
                    <View style={[styles.statusBadge, {
                      backgroundColor: getSessionStatus(selectedSession) === 'live' ? AppColors.success + '20' :
                                     getSessionStatus(selectedSession) === 'scheduled' ? AppColors.primary + '20' :
                                     AppColors.error + '20'
                    }]}>
                      <ThemedText type="small" style={{
                        color: getSessionStatus(selectedSession) === 'live' ? AppColors.success :
                               getSessionStatus(selectedSession) === 'scheduled' ? AppColors.primary :
                               AppColors.error
                      }}>
                        {getSessionStatus(selectedSession).charAt(0).toUpperCase() + getSessionStatus(selectedSession).slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText type="small" style={styles.detailLabel}>Participants:</ThemedText>
                    <ThemedText type="small">{selectedSession.participants || 0}</ThemedText>
                  </View>
                  {selectedSession.scheduledTime && (
                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Scheduled:</ThemedText>
                      <ThemedText type="small">
                        {new Date(selectedSession.scheduledTime * 1000).toLocaleString()}
                      </ThemedText>
                    </View>
                  )}
                  {selectedSession.startTime && (
                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Started:</ThemedText>
                      <ThemedText type="small">
                        {new Date(selectedSession.startTime * 1000).toLocaleString()}
                      </ThemedText>
                    </View>
                  )}
                  {selectedSession.endTime && (
                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Ended:</ThemedText>
                      <ThemedText type="small">
                        {new Date(selectedSession.endTime * 1000).toLocaleString()}
                      </ThemedText>
                    </View>
                  )}
                  {selectedSession.startTime && (
                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Duration:</ThemedText>
                      <ThemedText type="small">{getSessionDuration(selectedSession)}</ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {getSessionStatus(selectedSession) === 'live' ? (
                    <>
                      <Pressable
                        style={[styles.modalActionButton, { backgroundColor: AppColors.primary }]}
                        onPress={() => Alert.alert('Join Session', 'Opening live video session...')}
                      >
                        <Feather name="video" size={20} color="#FFF" />
                        <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                          Join Live Session
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.modalActionButton, { backgroundColor: AppColors.error }]}
                        onPress={() => handleEndSession(selectedSession)}
                      >
                        <Feather name="stop-circle" size={20} color="#FFF" />
                        <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                          End Session
                        </ThemedText>
                      </Pressable>
                    </>
                  ) : getSessionStatus(selectedSession) === 'scheduled' ? (
                    <Pressable
                      style={[styles.modalActionButton, { backgroundColor: AppColors.success }]}
                      onPress={() => handleStartSession(selectedSession)}
                    >
                      <Feather name="play" size={20} color="#FFF" />
                      <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                        Start Session Now
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.modalActionButton, { backgroundColor: AppColors.primary }]}
                      onPress={() => Alert.alert('View Recording', 'Session recording not available yet')}
                    >
                      <Feather name="play-circle" size={20} color="#FFF" />
                      <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
                        View Recording
                      </ThemedText>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.modalActionButton, { backgroundColor: AppColors.accent, borderWidth: 1, borderColor: AppColors.accent }]}
                    onPress={() => Alert.alert('Share Session', 'Generate shareable session link')}
                  >
                    <Feather name="share" size={20} color={AppColors.accent} />
                    <ThemedText type="body" style={{ color: AppColors.accent, marginLeft: Spacing.sm }}>
                      Share Session
                    </ThemedText>
                  </Pressable>
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
    flexWrap: 'wrap',
  },
  filterButton: {
    flex: 1,
    minWidth: 80,
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
  sessionCard: {
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 80,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing["5xl"],
  },
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  form: {
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
  },
  options: {
    gap: Spacing.sm,
  },
  option: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalScroll: {
    flex: 1,
  },
  sessionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sessionStatusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDetailInfo: {
    flex: 1,
  },
  detailSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
});
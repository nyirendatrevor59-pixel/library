import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Modal, TextInput, Platform } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";


import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

import { useAuth } from "@/contexts/AuthContext";
import { useLive } from "@/contexts/LiveContext";
import type { LiveSession } from "@/contexts/LiveContext";
import RecordingManager from "@/components/RecordingManager";
import BreakoutRooms from "@/components/BreakoutRooms";
import VideoConference from "@/components/VideoConference";

import { AVAILABLE_COURSES } from "../../lib/sampleData";
import { API_BASE_URL } from "../../lib/api";

export default function LecturerClassroomScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const { startLiveSession, scheduleLiveSession, endLiveSession, liveSessions, scheduledSessions, cancelScheduledSession, shareDocument, updateDocumentPage, updateDocumentAnnotations, updateDocumentTool, updateDocumentCurrentPath, updateDocumentScroll } = useLive();

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    console.log("useEffect triggered, liveSessions.length:", liveSessions.length);
    if (liveSessions.length > 0) {
      console.log("Setting live from existing sessions");
      setIsLive(true);
      setCurrentSession(liveSessions[0]);
    } else {
      setIsLive(false);
      setCurrentSession(null);
    }
  }, [liveSessions]);

  useEffect(() => {
    if (user?.id) {
      fetchMyCourses();
      fetchLecturerMaterials();
    }
  }, [user?.id]);

  const fetchMyCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      const data = await response.json();
      // Filter courses by lecturerId
      const filteredCourses = data.filter((course: any) => course.lecturerId === user?.id);
      setMyCourses(filteredCourses);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchLecturerMaterials = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/materials?lecturerId=${user?.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setLecturerMaterials(data);
      } else {
        console.error("Invalid data format:", data);
        setLecturerMaterials([]);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      setLecturerMaterials([]);
    }
  };
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [showCourseSelection, setShowCourseSelection] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showScheduling, setShowScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showInlineDatePicker, setShowInlineDatePicker] = useState(false);
  const [showInlineTimePicker, setShowInlineTimePicker] = useState(false);
  const [showConfirmSchedule, setShowConfirmSchedule] = useState(false);
  const [showSetTimeButton, setShowSetTimeButton] = useState(false);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
   const [showDocumentPicker, setShowDocumentPicker] = useState(false);
   const [lecturerMaterials, setLecturerMaterials] = useState<any[]>([]);
  
  const handleStartClass = (courseId: string) => {
    console.log("handleStartClass called with courseId:", courseId);
    if (liveSessions.length > 0) {
      console.log("Already live - active sessions:", liveSessions.length);
      Alert.alert("Already Live", "You already have an active live session.");
      return;
    }

    if (!user) {
      console.log("No user");
      Alert.alert("Error", "Please log in to start a live session");
      return;
    }

    const course = myCourses.find(c => c.id === courseId);
    if (!course) {
      console.log("Course not found for id:", courseId);
      return;
    }

    console.log("Starting session for course:", course.name);
    Alert.alert(
      "Start Live Class",
      `Are you ready to start your ${course.name} live session?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          onPress: async () => {
            try {
              console.log("Calling startLiveSession");
              const session = await startLiveSession(courseId, user);
              console.log("Session created:", session);
              setCurrentSession(session);
              setIsLive(true);
              Alert.alert(
                "Live Session Started",
                "Your students can now join the class",
              );
            } catch (error) {
              console.log("Error starting session:", error);
              Alert.alert("Error", "Failed to start live session");
            }
          },
        },
      ],
    );
  };

  const handleEndClass = () => {
    if (!currentSession) return;

    endLiveSession(currentSession.id);
    setCurrentSession(null);
    setIsLive(false);
    Alert.alert("Session Ended", "Your live class has ended");
  };



  const handleStartNow = async () => {
    if (selectedCourse && user) {
      try {
        const session = await startLiveSession(selectedCourse.id, user);
        setCurrentSession(session);
        setIsLive(true);
        setShowScheduling(false);
        setSelectedCourse(null);
        Alert.alert("Live Session Started", "Your students can now join the class");
      } catch (error) {
        Alert.alert("Error", "Failed to start live session");
      }
    }
  };

  const handleScheduleLater = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to schedule a session");
      return;
    }

    if (!selectedCourse) return;

    // Validate scheduled time is in the future
    const now = new Date();
    if (scheduledDate <= now) {
      Alert.alert("Invalid Time", "Please select a future date and time for the session");
      return;
    }

    try {
      await scheduleLiveSession(selectedCourse.id, user, scheduledDate.toISOString());
      Alert.alert(
        "Class Scheduled",
        `Your ${selectedCourse.name} class has been scheduled for ${scheduledDate.toLocaleString()}`,
      );
      setSelectedCourse(null);
      setShowScheduling(false);
    } catch (error) {
      Alert.alert("Error", "Failed to schedule live session");
    }
  };

  const incrementDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const decrementDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    if (newDate >= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const incrementMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const decrementMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const incrementYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setSelectedDate(newDate);
  };

  const decrementYear = () => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setSelectedDate(newDate);
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.headerSection,
          { paddingTop: headerHeight + Spacing.xl },
        ]}
      >
        <View style={styles.signOutContainer}>
          <Pressable onPress={logout} style={styles.signOutButton}>
            <Feather name="log-out" size={20} color={theme.text} />
          </Pressable>
        </View>
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
                <ThemedText type="h4" style={{ color: "#FFF" }}>
                  LIVE NOW
                </ThemedText>
              </View>
              <View style={styles.liveStats}>
                <Feather name="users" size={16} color="#FFF" />
                <ThemedText type="body" style={{ color: "#FFF" }}>
                  {currentSession?.participants || 0} students
                </ThemedText>
              </View>
            </View>

            <View style={styles.liveControls}>
              <RecordingManager
                sessionId={currentSession?.id || ''}
                isRecording={isRecording}
                onRecordingStateChange={setIsRecording}
              />
              <Pressable
                style={[
                  styles.controlButton,
                  { backgroundColor: isMuted ? '#DC2626' : "rgba(255,255,255,0.2)" },
                ]}
                onPress={() => setIsMuted(!isMuted)}
              >
                <Feather name={isMuted ? "mic-off" : "mic"} size={20} color="#FFF" />
              </Pressable>
              <Pressable
                style={[
                  styles.controlButton,
                  { backgroundColor: !isVideoEnabled ? '#DC2626' : "rgba(255,255,255,0.2)" },
                ]}
                onPress={() => setIsVideoEnabled(!isVideoEnabled)}
              >
                <Feather name={!isVideoEnabled ? "video-off" : "video"} size={20} color="#FFF" />
              </Pressable>
              <Pressable
                style={[
                  styles.controlButton,
                   { backgroundColor: currentSession?.currentDocument ? AppColors.accent : "rgba(255,255,255,0.2)" },
                ]}
                 onPress={() => setShowDocumentPicker(true)}
              >
                 <Feather name="file-text" size={20} color="#FFF" />
              </Pressable>

              <Pressable
                style={[
                  styles.controlButton,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
                onPress={() => setShowBreakoutRooms(true)}
              >
                <Feather name="grid" size={20} color="#FFF" />
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
          <Pressable
            onPress={() => {
              const course = AVAILABLE_COURSES.find(c => c.id === "1");
              if (course) {
                setSelectedCourse(course);
                setShowScheduling(true);
              }
            }}
          >
            <LinearGradient
              colors={[AppColors.primary, AppColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startClassBanner}
            >
              <View style={styles.startClassIcon}>
                <Feather name="video" size={32} color="#FFF" />
              </View>
              <ThemedText type="h3" style={{ color: "#FFF" }}>
                Start Live Class
              </ThemedText>
              <ThemedText
                type="body"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Tap to start with Introduction to Computer Science
              </ThemedText>
            </LinearGradient>
          </Pressable>
        )}
  
        <Modal visible={showCourseDetails} animationType="slide" onRequestClose={() => setShowCourseDetails(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowCourseDetails(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Course Details</ThemedText>
            </View>
            {selectedCourseDetails && (
              <View style={styles.courseDetailsContent}>
                <View style={styles.courseDetailHeader}>
                  <View
                    style={[
                      styles.courseIcon,
                      { backgroundColor: AppColors.primary + "20", width: 60, height: 60, borderRadius: 30 },
                    ]}
                  >
                    <Feather name="book" size={30} color={AppColors.primary} />
                  </View>
                  <View style={styles.courseDetailInfo}>
                    <ThemedText type="h2" style={{ fontWeight: "600" }}>
                      {selectedCourseDetails.name}
                    </ThemedText>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      {selectedCourseDetails.code}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Lecturer: {selectedCourseDetails.lecturerName}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.courseDescription}>
                  <ThemedText type="body">
                    {selectedCourseDetails.description}
                  </ThemedText>
                </View>
                <View style={styles.courseActions}>
                  <Pressable
                    style={[styles.courseActionButton, { backgroundColor: AppColors.primary }]}
                    onPress={() => {
                      setShowCourseDetails(false);
                      handleStartClass(selectedCourseDetails.id);
                    }}
                  >
                    <Feather name="play" size={20} color="#FFF" />
                    <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                      Start Now
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.courseActionButton, { backgroundColor: AppColors.accent }]}
                    onPress={() => {
                      setSelectedCourse(selectedCourseDetails);
                      setShowCourseDetails(false);
                      setShowScheduling(true);
                    }}
                  >
                    <Feather name="calendar" size={20} color="#FFF" />
                    <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                      Schedule Class
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </View>

      {isLive && currentSession ? (
        <View style={styles.content}>
          <VideoConference
            sessionId={currentSession.id}
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            onToggleMic={() => setIsMuted(!isMuted)}
            onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
            user={user}
            attendees={currentSession.attendees}
            lecturerName={currentSession.lecturerName}
            currentDocument={currentSession.currentDocument}
            currentPage={currentSession.currentPage}
            annotations={currentSession.annotations}
            currentTool={currentSession.currentTool}
            currentPath={currentSession.currentPath}
            scrollPosition={currentSession.scrollPosition}
            micStates={currentSession.micStates}
            onPageChange={(page) => updateDocumentPage(currentSession.id, page)}
            onAnnotationUpdate={(annotations) => updateDocumentAnnotations(currentSession.id, annotations)}
            onToolChange={(tool) => updateDocumentTool(currentSession.id, tool)}
            onCurrentPathChange={(path) => updateDocumentCurrentPath(currentSession.id, path)}
            onScrollChange={(scrollPosition) => updateDocumentScroll(currentSession.id, scrollPosition)}
          />
        </View>
      ) : (
        <FlatList
        data={myCourses}
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
          <Pressable onPress={() => {
            setSelectedCourse(item);
            setShowScheduling(true);
          }}>
            <Card style={styles.courseCard}>
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
                  {item.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.code}
                </ThemedText>
              </View>
              <Pressable
                style={[
                  styles.quickStartButton,
                  { backgroundColor: AppColors.accent + "20" },
                ]}
                onPress={() => {
                  console.log("Quick start pressed for course:", item.id);
                  handleStartClass(item.id);
                }}
              >
                <Feather name="play" size={16} color={AppColors.accent} />
              </Pressable>
            </Card>
          </Pressable>
        )}
      />
      )}

      {scheduledSessions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h3">Scheduled Sessions</ThemedText>
          </View>
          {scheduledSessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionInfo}>
                <ThemedText type="body" style={{ fontWeight: "500" }}>
                  {session.topic}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {session.courseName}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Scheduled: {session.scheduledTime ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.scheduledTime)) : 'TBD'}
                </ThemedText>
              </View>
              <View style={styles.sessionActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: AppColors.primary }]}
                  onPress={async () => {
                    if (user) {
                      try {
                        const sessionToStart = await startLiveSession(session.courseId, user);
                        setCurrentSession(sessionToStart);
                        setIsLive(true);
                        // Remove from scheduled
                        await cancelScheduledSession(session.id);
                        Alert.alert("Session Started", "Your scheduled class is now live!");
                      } catch (error) {
                        Alert.alert("Error", "Failed to start scheduled session");
                      }
                    }
                  }}
                >
                  <Feather name="play" size={16} color="#FFF" />
                  <ThemedText type="small" style={{ color: "#FFF" }}>Start Early</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: AppColors.error }]}
                  onPress={async () => {
                    await cancelScheduledSession(session.id);
                    Alert.alert("Session Cancelled", "Scheduled session has been cancelled.");
                  }}
                >
                  <Feather name="x" size={16} color="#FFF" />
                  <ThemedText type="small" style={{ color: "#FFF" }}>Cancel</ThemedText>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      <Modal visible={showCourseSelection} animationType="slide" onRequestClose={() => setShowCourseSelection(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCourseSelection(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Select Course to Start Live Class</ThemedText>
          </View>
          <FlatList
            data={myCourses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.courseSelectItem, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setSelectedCourse(item);
                  setShowCourseSelection(false);
                  setShowScheduling(true);
                }}
              >
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
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {item.code}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            )}
          />
        </View>
      </Modal>

      <Modal visible={showScheduling} animationType="none">
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowScheduling(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Schedule Live Class</ThemedText>
          </View>
          <View style={styles.schedulingContent}>
            <ThemedText type="body" style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
              How would you like to schedule your {selectedCourse?.name} class?
            </ThemedText>
            <Pressable
              style={[styles.scheduleOption, { backgroundColor: AppColors.primary }]}
              onPress={handleStartNow}
            >
              <Feather name="play" size={20} color="#FFF" />
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Start Now
              </ThemedText>
            </Pressable>
            <View style={styles.dateTimeRow}>
              <Pressable
                style={[styles.dateTimeButton, { backgroundColor: AppColors.primary + "20" }]}
                onPress={() => setShowInlineDatePicker(true)}
              >
                <Feather name="calendar" size={20} color={AppColors.primary} />
                <ThemedText type="small" style={{ color: AppColors.primary, fontWeight: "600" }}>
                  Set Date
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.dateTimeButton, { backgroundColor: AppColors.accent + "20" }]}
                onPress={() => setShowInlineTimePicker(true)}
              >
                <Feather name="clock" size={20} color={AppColors.accent} />
                <ThemedText type="small" style={{ color: AppColors.accent, fontWeight: "600" }}>
                  Set Time
                </ThemedText>
              </Pressable>
            </View>
            <ThemedText type="body" style={{ textAlign: 'center', marginVertical: Spacing.md, color: theme.text, textDecorationLine: 'underline' }}>
              Scheduled for: {scheduledDate.toLocaleString()}
            </ThemedText>
            </View>
          </View>
        </Modal>
        <Modal visible={showConfirmSchedule} animationType="fade" transparent={true} onRequestClose={() => setShowConfirmSchedule(false)}>
          <View style={styles.confirmModalOverlay}>
            <View style={[styles.confirmModalContainer, { backgroundColor: theme.backgroundRoot }]}>
              <ThemedText type="h3" style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
                Confirm Schedule
              </ThemedText>
              <ThemedText type="body" style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
                Schedule your {selectedCourse?.name} class for:
              </ThemedText>
              <ThemedText type="h2" style={{ textAlign: 'center', marginBottom: Spacing.xl, color: AppColors.primary }}>
                {scheduledDate.toLocaleString()}
              </ThemedText>
              <View style={styles.confirmButtons}>
                <Pressable
                  style={[styles.confirmButton, { backgroundColor: AppColors.error }]}
                  onPress={() => {
                    setShowConfirmSchedule(false);
                    // Reset selection
                    setScheduledDate(new Date());
                  }}
                >
                  <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                    Cancel
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.confirmButton, { backgroundColor: AppColors.primary }]}
                  onPress={async () => {
                    await handleScheduleLater();
                    setShowConfirmSchedule(false);
                    setShowScheduling(false);
                    // Reset states
                    setScheduledDate(new Date());
                  }}
                >
                  <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                    Confirm
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showDocumentPicker} animationType="slide" onRequestClose={() => setShowDocumentPicker(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowDocumentPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Select Document to Share</ThemedText>
            </View>
            <FlatList
              data={lecturerMaterials}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.courseSelectItem, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => {
                    if (currentSession) {
                      shareDocument(currentSession.id, { id: item.id, title: item.title, url: item.url });
                      setShowDocumentPicker(false);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.courseIcon,
                      { backgroundColor: AppColors.primary + "20" },
                    ]}
                  >
                    <Feather name="file-text" size={20} color={AppColors.primary} />
                  </View>
                  <View style={styles.courseInfo}>
                    <ThemedText type="body" style={{ fontWeight: "500" }}>
                      {item.title}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {item.fileType || "pdf"}
                    </ThemedText>
                  </View>
                  <Feather name="share" size={20} color={theme.textSecondary} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather name="folder" size={48} color={theme.textSecondary} />
                  <ThemedText
                    type="h4"
                    style={{ color: theme.textSecondary, marginTop: Spacing.md }}
                  >
                    No Materials Found
                  </ThemedText>
                  <ThemedText
                    type="body"
                    style={{
                      color: theme.textSecondary,
                      textAlign: "center",
                      marginTop: Spacing.sm,
                    }}
                  >
                    Upload materials in the Materials tab first
                  </ThemedText>
                </View>
              }
            />
          </View>
        </Modal>

      {showBreakoutRooms && currentSession && (
        <BreakoutRooms
          attendees={currentSession.attendees}
          onCreateRooms={(rooms) => {
            // Handle breakout room creation
            Alert.alert("Breakout Rooms", `Created ${rooms.length} breakout rooms`);
            setShowBreakoutRooms(false);
          }}
          onClose={() => setShowBreakoutRooms(false)}
        />
      )}

      {showInlineDatePicker && (
        <Modal visible={showInlineDatePicker} animationType="slide" onRequestClose={() => setShowInlineDatePicker(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowInlineDatePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Select Date</ThemedText>
            </View>
            <View style={styles.datePickerContent}>
              <View style={styles.dateDisplay}>
                <ThemedText type="h1" style={{ color: AppColors.primary }}>
                  {selectedDate.toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={styles.dateControls}>
                <View style={styles.controlGroup}>
                  <ThemedText type="body" style={{ textAlign: 'center' }}>Day</ThemedText>
                  <View style={styles.controlButtons}>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={decrementDay}>
                      <Feather name="minus" size={20} color="#FFF" />
                    </Pressable>
                    <ThemedText type="h3" style={{ minWidth: 40, textAlign: 'center' }}>{selectedDate.getDate()}</ThemedText>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={incrementDay}>
                      <Feather name="plus" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <ThemedText type="body" style={{ textAlign: 'center' }}>Month</ThemedText>
                  <View style={styles.controlButtons}>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={decrementMonth}>
                      <Feather name="minus" size={20} color="#FFF" />
                    </Pressable>
                    <ThemedText type="h3" style={{ minWidth: 40, textAlign: 'center' }}>{selectedDate.getMonth() + 1}</ThemedText>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={incrementMonth}>
                      <Feather name="plus" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <ThemedText type="body" style={{ textAlign: 'center' }}>Year</ThemedText>
                  <View style={styles.controlButtons}>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={decrementYear}>
                      <Feather name="minus" size={20} color="#FFF" />
                    </Pressable>
                    <ThemedText type="h3" style={{ minWidth: 60, textAlign: 'center' }}>{selectedDate.getFullYear()}</ThemedText>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={incrementYear}>
                      <Feather name="plus" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </View>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: AppColors.primary, marginTop: Spacing.xl }]}
                onPress={() => {
                  setScheduledDate(selectedDate);
                  setShowInlineDatePicker(false);
                  setShowScheduling(true);
                }}
              >
                <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                  Confirm Date
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      {showInlineTimePicker && (
        <Modal visible={showInlineTimePicker} animationType="slide" onRequestClose={() => setShowInlineTimePicker(false)}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowInlineTimePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Select Time</ThemedText>
            </View>
            <View style={styles.timePickerContent}>
              <View style={styles.timeDisplay}>
                <ThemedText type="h1" style={{ color: AppColors.primary }}>
                  {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </View>
              <View style={styles.timeControls}>
                <View style={styles.controlGroup}>
                  <ThemedText type="body" style={{ textAlign: 'center' }}>Hour</ThemedText>
                  <View style={styles.controlButtons}>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={() => {
                      const newDate = new Date(scheduledDate);
                      newDate.setHours(newDate.getHours() - 1);
                      setScheduledDate(newDate);
                    }}>
                      <Feather name="minus" size={20} color="#FFF" />
                    </Pressable>
                    <ThemedText type="h3" style={{ minWidth: 40, textAlign: 'center' }}>{scheduledDate.getHours()}</ThemedText>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={() => {
                      const newDate = new Date(scheduledDate);
                      newDate.setHours(newDate.getHours() + 1);
                      setScheduledDate(newDate);
                    }}>
                      <Feather name="plus" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
                <View style={styles.controlGroup}>
                  <ThemedText type="body" style={{ textAlign: 'center' }}>Minute</ThemedText>
                  <View style={styles.controlButtons}>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={() => {
                      const newDate = new Date(scheduledDate);
                      newDate.setMinutes(newDate.getMinutes() - 1);
                      setScheduledDate(newDate);
                    }}>
                      <Feather name="minus" size={20} color="#FFF" />
                    </Pressable>
                    <ThemedText type="h3" style={{ minWidth: 40, textAlign: 'center' }}>{scheduledDate.getMinutes()}</ThemedText>
                    <Pressable style={[styles.pickerControlButton, { backgroundColor: AppColors.primary }]} onPress={() => {
                      const newDate = new Date(scheduledDate);
                      newDate.setMinutes(newDate.getMinutes() + 1);
                      setScheduledDate(newDate);
                    }}>
                      <Feather name="plus" size={20} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </View>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: AppColors.primary, marginTop: Spacing.xl }]}
                onPress={() => {
                  setShowInlineTimePicker(false);
                  setShowConfirmSchedule(true);
                }}
              >
                <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                  Confirm Time
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
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
  signOutContainer: {
    alignSelf: 'flex-end',
  },
  signOutButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  modalList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  courseSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  schedulingContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    width: '80%',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '80%',
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  confirmSchedule: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  sessionCard: {
    padding: Spacing.lg,
  },
  sessionInfo: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContainer: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  confirmButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  courseDetailsContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  courseDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  courseDetailInfo: {
    flex: 1,
  },
  courseDescription: {
    padding: Spacing.md,
    backgroundColor: '#f0f0f0',
    borderRadius: BorderRadius.md,
  },
  courseActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  courseActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  datePickerContent: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  dateDisplay: {
    marginBottom: Spacing.xl,
  },
  dateControls: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  controlGroup: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pickerControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerContent: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  timeDisplay: {
    marginBottom: Spacing.xl,
  },
  timeControls: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
});

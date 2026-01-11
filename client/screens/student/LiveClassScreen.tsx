import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Alert, Modal, TextInput, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";


import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { useLive } from "@/contexts/LiveContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { API_BASE_URL } from "@/lib/api";
import Chat from "@/components/Chat";
import VideoConference from "@/components/VideoConference";
import DocumentViewer from "@/components/DocumentViewer";
import type { LiveSession } from "@/contexts/LiveContext";

type RouteParams = {
  LiveClass: {
    session: LiveSession;
  };
};

export default function LiveClassScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = 0; // Not in tab navigator
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, "LiveClass">>();
  const { liveSessions, socket } = useLive();
  const { sendMessage, shareNote, shareDocument, updateDocumentPage, updateDocumentAnnotations, updateDocumentTool, updateDocumentCurrentPath, updateDocumentScroll, updateMicState, leaveLiveSession } = useLive();
  const { trackAnalytics } = useAdmin();
  const session = liveSessions.find(s => s.id === route.params.session.id) || route.params.session;
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [showMaterialsPicker, setShowMaterialsPicker] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const { fetchLiveSessions } = useLive();

  console.log("LiveClassScreen session:", session.id, "currentDocument:", session.currentDocument);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

  const hasLeftRef = useRef(false);



  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/materials?courseIds=${session.courseId}`);
        if (response.ok) {
          const data = await response.json();
          setMaterials(data);
        }
      } catch (error) {
        console.error('Failed to fetch materials:', error);
      }
    };
    // Allow both lecturers and students to see materials
    if (user?.role === 'lecturer' || user?.role === 'student') {
      fetchMaterials();
    }
  }, [session.courseId, user?.role]);

  useEffect(() => {
    if (socket) {
      const handleSessionEnded = (data: { sessionId: string }) => {
        if (data.sessionId === session.id) {
          setSessionEnded(true);
        }
      };
      socket.on('session-ended', handleSessionEnded);
      return () => {
        socket.off('session-ended', handleSessionEnded);
      };
    }
  }, [socket, session.id]);

  // Check if session has ended based on liveSessions data
  useEffect(() => {
    const currentSession = liveSessions.find(s => s.id === session.id);
    if (currentSession && !currentSession.isLive) {
      setSessionEnded(true);
    }
  }, [liveSessions, session.id]);

  useEffect(() => {
    return () => {
      if (!hasLeftRef.current) {
        leaveLiveSession(session.id);
        hasLeftRef.current = true;
      }
    };
  }, [leaveLiveSession, session.id]);

  // Auto-refresh live session data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveSessions();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [fetchLiveSessions]);

  // Track session attendance
  useEffect(() => {
    if (user?.role === 'student' && session) {
      trackAnalytics('sessions_attended');
    }
  }, [user?.role, session, trackAnalytics]);

  // Check if session has ended
  useEffect(() => {
    if (user?.role === 'student' && !session) {
      Alert.alert(
        "Session Ended",
        "The live session has been ended by the lecturer.",
        [
          {
            text: "OK",
            onPress: () => {
              if (!hasLeftRef.current) {
                leaveLiveSession(route.params.session.id);
                hasLeftRef.current = true;
              }
              navigation.goBack();
            },
          },
        ],
      );
    }
  }, [session, user?.role, leaveLiveSession, route.params.session.id, navigation]);



  const handleLeaveClass = () => {
    Alert.alert(
      "Leave Class",
      "Are you sure you want to leave this live session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            leaveLiveSession(session.id);
            hasLeftRef.current = true;
            navigation.goBack();
          },
        },
      ],
    );
  };



  if (sessionEnded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.endedContainer}>
          <Feather name="x-circle" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ color: theme.text, marginTop: Spacing.lg }}>
            Session Ended
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
            The live session has been ended by the lecturer. You can no longer participate in this session.
          </ThemedText>
          <Pressable
            style={[styles.backButton, { backgroundColor: AppColors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText type="body" style={{ color: '#FFF' }}>
              Back to Sessions
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!session.isLive) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.endedContainer}>
          <Feather name="clock" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ color: theme.text, marginTop: Spacing.lg }}>
            Waiting for Session to Start
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
            The live session has not started yet. Please wait for the lecturer to begin the session.
          </ThemedText>
          <Pressable
            style={[styles.backButton, { backgroundColor: AppColors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText type="body" style={{ color: '#FFF' }}>
              Back to Sessions
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.headerSection,
          { paddingTop: headerHeight + Spacing.xl },
        ]}
      >
        <LinearGradient
          colors={[AppColors.primary, AppColors.secondary]}
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
                {session.participants} students
              </ThemedText>
            </View>
          </View>

          <View style={styles.classInfo}>
            <ThemedText type="h3" style={{ color: "#FFF" }}>
              {session.topic}
            </ThemedText>
            <ThemedText type="body" style={{ color: "rgba(255,255,255,0.8)" }}>
              {session.courseName} • {session.lecturerName}
            </ThemedText>
          </View>

          <View style={styles.controls}>
            <Pressable
              style={[
                styles.controlButton,
                { backgroundColor: isMuted ? '#DC2626' : "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => {
                const newMuted = !isMuted;
                setIsMuted(newMuted);
                updateMicState(session.id, user!.id, newMuted);
              }}
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
            {(user?.role === 'lecturer' || user?.role === 'student') && (
              <>
                <Pressable
                  style={[
                    styles.controlButton,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                  onPress={() => setShowMaterialsPicker(true)}
                >
                  <Feather name="file-text" size={20} color="#FFF" />
                </Pressable>
                {session.currentDocument && user?.role === 'lecturer' && (
                  <Pressable
                    style={[
                      styles.controlButton,
                      { backgroundColor: '#DC2626' },
                    ]}
                    onPress={() => {
                      // Stop sharing document - share null or empty
                      shareDocument(session.id, null);
                      Alert.alert("Document Sharing Stopped", "The document is no longer shared with the class.");
                    }}
                  >
                    <Feather name="x" size={20} color="#FFF" />
                  </Pressable>
                )}
                <Pressable
                  style={[
                    styles.controlButton,
                    { backgroundColor: "rgba(255,255,255,0.2)" },
                  ]}
                  onPress={() => Alert.prompt('Share Note', 'Enter your note:', (note) => shareNote(session.id, note, user!))}
                >
                  <Feather name="edit" size={20} color="#FFF" />
                </Pressable>
              </>
            )}

            <Pressable
              style={[
                styles.controlButton,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
              onPress={() => setShowChat(true)}
            >
              <Feather name="message-circle" size={20} color="#FFF" />
            </Pressable>
            <Pressable
              style={[styles.controlButton, styles.leaveButton]}
              onPress={handleLeaveClass}
            >
              <Feather name="log-out" size={20} color="#FFF" />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <VideoConference
          sessionId={session.id}
          isMuted={isMuted}
          isVideoEnabled={isVideoEnabled}
          onToggleMic={() => setIsMuted(!isMuted)}
          onToggleVideo={() => setIsVideoEnabled(!isVideoEnabled)}
          user={user}
          attendees={session.attendees}
          lecturerName={session.lecturerName}
          currentDocument={session.currentDocument}
          currentPage={session.currentPage}
          annotations={session.annotations}
          currentTool={session.currentTool}
          currentPath={session.currentPath}
          scrollPosition={session.scrollPosition}
          micStates={session.micStates}
          onPageChange={(page) => updateDocumentPage(session.id, page)}
          onAnnotationUpdate={(annotations) => updateDocumentAnnotations(session.id, annotations)}
          onToolChange={(tool) => updateDocumentTool(session.id, tool)}
          onCurrentPathChange={(path) => updateDocumentCurrentPath(session.id, path)}
          onScrollChange={(scrollPosition) => updateDocumentScroll(session.id, scrollPosition)}
          navigation={navigation}
        />
      </View>

      <Pressable
        style={[styles.chatToggle, { backgroundColor: AppColors.primary }]}
        onPress={() => setShowChat(true)}
      >
        <Feather name="message-circle" size={24} color="#FFF" />
      </Pressable>

      <Modal visible={showChat} animationType="fade" transparent={true} onRequestClose={() => setShowChat(false)}>
        <View style={styles.chatModalOverlay}>
          <View style={[styles.chatModal, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.chatHeader}>
              <Pressable onPress={() => setShowChat(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h4">Chat</ThemedText>
            </View>
            <Chat
              messages={session.messages}
              onSendMessage={(message) => sendMessage(session.id, message, user!)}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showMaterialsPicker} animationType="slide" onRequestClose={() => setShowMaterialsPicker(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowMaterialsPicker(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">
              {user?.role === 'lecturer' ? 'Select Document to Share' : 'Course Materials'}
            </ThemedText>
          </View>
          <FlatList
            data={materials}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.materialsList}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.materialItem, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  if (user?.role === 'lecturer') {
                    if (!item.fileUrl) {
                      Alert.alert("Cannot Share", "This sample material cannot be shared. Please upload a real document first.");
                      return;
                    }
                    const documentUrl = `${API_BASE_URL}${item.fileUrl}`;
                    shareDocument(session.id, {
                      id: String(item.id),
                      title: item.title,
                      url: documentUrl,
                    });
                    setShowMaterialsPicker(false);
                    Alert.alert("Document Shared", `${item.title} has been shared with the class.`);
                  } else {
                    setShowMaterialsPicker(false);
                    Alert.alert("Access Denied", "Only lecturers can share documents.");
                  }
                }}
              >
                <View style={[styles.fileIcon, { backgroundColor: AppColors.primary + "20" }]}>
                  <Feather name="file-text" size={20} color={AppColors.primary} />
                </View>
                <View style={styles.materialInfo}>
                  <ThemedText type="body" style={{ fontWeight: "500" }}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {item.description || 'No description'}
                  </ThemedText>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  No materials available for this course.
                </ThemedText>
              </View>
            }
          />
        </View>
      </Modal>


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
    gap: Spacing.lg,
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
  classInfo: {
    gap: Spacing.xs,
  },
  controls: {
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
  leaveButton: {
    backgroundColor: "#DC2626",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatToggle: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatModal: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: BorderRadius.lg,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    gap: Spacing.md,
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
  materialsList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  endedContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
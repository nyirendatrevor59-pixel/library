import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform, Modal, ScrollView, TextInput, PanResponder } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, AppColors } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import type { Note } from '@/contexts/LiveContext';
import DocumentViewer from '@/components/DocumentViewer';
import io from 'socket.io-client';

interface VideoConferenceProps {
  sessionId: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  user: { id: string; name: string; email: string; role: string } | null;
  attendees: { id: string; name: string; role: 'lecturer' | 'student' }[];
  lecturerName?: string;
  currentDocument?: { id: string; title: string; url: string } | null;
  currentPage?: number;
  annotations?: any[];
  currentTool?: string;
  currentPath?: any[];
  scrollPosition?: { top: number; left: number };
  micStates?: Map<string, boolean>;
  onShareDocument?: () => void;
  onPageChange?: (page: number) => void;
  onAnnotationUpdate?: (annotations: any[]) => void;
  onToolChange?: (tool: string) => void;
  onCurrentPathChange?: (path: any[]) => void;
  onScrollChange?: (scrollPosition: { top: number; left: number }) => void;
  navigation?: any;

}

interface WebRTCOfferData {
  sessionId: string;
  to: string;
  from: string;
  offer: RTCSessionDescriptionInit;
}

interface WebRTCAnswerData {
  sessionId: string;
  to: string;
  from: string;
  answer: RTCSessionDescriptionInit;
}

interface WebRTCIceCandidateData {
  sessionId: string;
  to: string;
  from: string;
  candidate: RTCIceCandidateInit;
}

export default function VideoConference({
  sessionId,
  isMuted,
  isVideoEnabled,
  onToggleMic,
  onToggleVideo,
  user,
  attendees,
  lecturerName,
  currentDocument,
  currentPage = 1,
  annotations = [],
  currentTool,
  currentPath,
  scrollPosition,
  micStates,
  onShareDocument,
  onPageChange,
  onAnnotationUpdate,
  onToolChange,
  onCurrentPathChange,
  onScrollChange,
  navigation,
}: VideoConferenceProps) {
  const { theme } = useTheme();
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [webStream, setWebStream] = useState<MediaStream | null>(null);
  const cameraRef = useRef<any>(null);
  const webStreamRef = useRef<MediaStream | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const socketRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  const [participants, setParticipants] = useState(attendees);
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  const [participantPositions, setParticipantPositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useRef((e: MouseEvent) => {
    if (draggingId) {
      const newX = Math.max(0, Math.min(900 - 80, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(600 - 60, e.clientY - dragOffset.y));
      setParticipantPositions(prev => new Map(prev.set(draggingId, { x: newX, y: newY })));
    }
  });

  const handleMouseUp = useRef(() => {
    setDraggingId(null);
    document.removeEventListener('mousemove', handleMouseMove.current);
    document.removeEventListener('mouseup', handleMouseUp.current);
  });

  useEffect(() => {
    setParticipants(attendees);
  }, [attendees]);

  useEffect(() => {
    const newPositions = new Map<string, {x: number, y: number}>();
    let studentIndex = 0;
    participants.forEach((participant) => {
      if (!participantPositions.has(participant.id)) {
        if (participant.role === 'lecturer') {
          newPositions.set(participant.id, { x: 0, y: 10 });
        } else {
          newPositions.set(participant.id, { x: 0, y: 110 + (studentIndex * 70) });
          studentIndex++;
        }
      } else {
        newPositions.set(participant.id, participantPositions.get(participant.id)!);
      }
    });
    setParticipantPositions(newPositions);
  }, [participants]);



  useEffect(() => {
    (async () => {
      if (permission && !permission.granted) {
        await requestPermission();
      }
    })();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      (async () => {
        try {
          const constraints = { video: isVideoEnabled, audio: !isMuted };
          const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (webStreamRef.current) {
            webStreamRef.current.getTracks().forEach(track => track.stop());
          }
          webStreamRef.current = mediaStream;
          setWebStream(mediaStream);

          // Update existing peer connections with new tracks
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            mediaStream.getTracks().forEach(track => {
              const existingSender = senders.find(s => s.track?.kind === track.kind);
              if (existingSender) {
                existingSender.replaceTrack(track);
              } else {
                pc.addTrack(track, mediaStream);
              }
            });
          });
        } catch (error: any) {
          console.error('Error accessing camera/mic on web:', error);
          if (error.name === 'NotAllowedError') {
            Alert.alert('Permission Denied', 'Please allow camera and microphone access to join the video conference.');
          } else if (error.name === 'NotFoundError') {
            Alert.alert('No Camera/Mic Found', 'No camera or microphone detected.');
          } else {
            Alert.alert('Media Error', 'Failed to access camera or microphone.');
          }
        }
      })();
    }
  }, [isVideoEnabled, isMuted]);

  useEffect(() => {
    return () => {
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // WebRTC setup for web platform
  useEffect(() => {
    if (Platform.OS !== 'web' || !user) return;

    socketRef.current = io("http://localhost:5001");

    // Join the session room for signaling
    socketRef.current.emit("join-live-class", {
      sessionId,
      userId: user.id,
      name: user.name || user.email.split('@')[0]
    });

    socketRef.current.on("webrtc-offer", async (data: WebRTCOfferData) => {
      if (data.to !== user.id) return;
      const pc = peerConnectionsRef.current.get(data.from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("webrtc-answer", {
        sessionId,
        to: data.from,
        from: user.id,
        answer,
      });
    });

    socketRef.current.on("webrtc-answer", async (data: WebRTCAnswerData) => {
      if (data.to !== user.id) return;
      const pc = peerConnectionsRef.current.get(data.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socketRef.current.on("webrtc-ice-candidate", async (data: WebRTCIceCandidateData) => {
      if (data.to !== user.id) return;
      const pc = peerConnectionsRef.current.get(data.from);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });



    socketRef.current.on("user-joined", (data: { userId: string; name: string }) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.id === data.userId);
        if (existing) return prev;
        return [...prev, { id: data.userId, name: data.name, role: 'student' }];
      });
    });

    socketRef.current.on("user-left", (data: { userId: string }) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    });

    return () => {
      socketRef.current?.emit("leave-live-class", { sessionId, userId: user.id });
      socketRef.current?.disconnect();
      peerConnectionsRef.current.forEach(pc => pc.close());
    };
  }, [sessionId, user]);

  // Create peer connections for each attendee
  useEffect(() => {
    if (Platform.OS !== 'web' || !user || !webStream) return;

    const createPeerConnection = async (attendeeId: string) => {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit("webrtc-ice-candidate", {
              sessionId,
              to: attendeeId,
              from: user.id,
              candidate: event.candidate,
            });
          }
        };

        pc.ontrack = (event) => {
          console.log(`Received stream from ${attendeeId}:`, event.streams[0]);
          remoteStreamsRef.current.set(attendeeId, event.streams[0]);
          setRemoteStreams(new Map(remoteStreamsRef.current));
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            console.warn(`WebRTC connection to ${attendeeId} failed`);
          }
        };

        // Add local stream tracks
        webStream.getTracks().forEach(track => {
          pc.addTrack(track, webStream);
        });

        peerConnectionsRef.current.set(attendeeId, pc);

        // Create offer if we are initiating
        if (user.id < attendeeId) { // Simple way to decide who initiates
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current.emit("webrtc-offer", {
            sessionId,
            to: attendeeId,
            from: user.id,
            offer,
          });
        }
      } catch (error) {
        console.error(`Error creating peer connection to ${attendeeId}:`, error);
      }
    };

    attendees.forEach(attendee => {
      if (attendee.id !== user.id && !peerConnectionsRef.current.has(attendee.id)) {
        createPeerConnection(attendee.id);
      }
    });

    return () => {
      // Cleanup on attendees change
      peerConnectionsRef.current.forEach((pc, id) => {
        if (!attendees.find(a => a.id === id)) {
          pc.close();
          peerConnectionsRef.current.delete(id);
          remoteStreamsRef.current.delete(id);
        }
      });
      setRemoteStreams(new Map(remoteStreamsRef.current));
    };
  }, [attendees, user, webStream, sessionId]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };





  const selectNextParticipant = () => {
    if (participants.length === 0) return;
    const currentIndex = selectedParticipant ? participants.findIndex(p => p.id === selectedParticipant.id) : -1;
    const nextIndex = (currentIndex + 1) % participants.length;
    setSelectedParticipant(participants[nextIndex]);
  };

  const selectPreviousParticipant = () => {
    if (participants.length === 0) return;
    const currentIndex = selectedParticipant ? participants.findIndex(p => p.id === selectedParticipant.id) : -1;
    const prevIndex = currentIndex === -1 ? participants.length - 1 : (currentIndex - 1 + participants.length) % participants.length;
    setSelectedParticipant(participants[prevIndex]);
  };

  if (Platform.OS !== ('web' as any) && (!permission || !permission.granted)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          style={[styles.permissionButton, { backgroundColor: AppColors.primary }]}
          onPress={requestPermission}
        >
          <Feather name="camera" size={24} color="#FFF" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background video for selected participant */}
      {selectedParticipant && (
        <View style={styles.backgroundVideo}>
          <View style={styles.participantPlaceholder}>
            <Feather name="user" size={64} color="#666" />
          </View>
          <ThemedText style={selectedParticipant.role === 'lecturer' ? styles.backgroundLecturerName : styles.backgroundStudentName}>
            {selectedParticipant.role === 'lecturer' ? selectedParticipant.name.toUpperCase() : selectedParticipant.name.toLowerCase()}
          </ThemedText>
          <Pressable style={styles.closeBackgroundButton} onPress={() => setSelectedParticipant(null)}>
            <Feather name="x" size={20} color="#FFF" />
          </Pressable>
        </View>
      )}
      {/* Document or Camera view */}
      {currentDocument ? (
        user?.role === 'student' ? (
          <Pressable
            style={styles.documentPressable}
            onPress={() => {
              if (navigation) {
                navigation.getParent()?.getParent()?.navigate("DocumentViewer", {
                  documentId: currentDocument.id,
                  title: currentDocument.title,
                  sessionId: sessionId,
                });
              }
            }}
          >
            <DocumentViewer
              document={currentDocument}
              currentPage={currentPage}
              annotations={annotations}
              currentTool={currentTool}
              currentPath={currentPath}
              scrollPosition={scrollPosition}
              user={user}
              lecturerName={lecturerName}
              onPageChange={onPageChange}
              onAnnotationUpdate={onAnnotationUpdate}
              onToolChange={onToolChange}
              onCurrentPathChange={onCurrentPathChange}
              onScrollChange={onScrollChange}
            />
          </Pressable>
        ) : (
          <DocumentViewer
            document={currentDocument}
            currentPage={currentPage}
            annotations={annotations}
            currentTool={currentTool}
            currentPath={currentPath}
            scrollPosition={scrollPosition}
            user={user}
            lecturerName={lecturerName}
            onPageChange={onPageChange}
            onAnnotationUpdate={onAnnotationUpdate}
            onToolChange={onToolChange}
            onCurrentPathChange={onCurrentPathChange}
            onScrollChange={onScrollChange}
          />
        )
      ) : isVideoEnabled ? (
        Platform.OS === ('web' as any) ? (
          webStream ? (
            <video
              style={{ flex: 1 }}
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video && webStream) {
                  video.srcObject = webStream;
                }
              }}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Feather name="video-off" size={64} color="#666" />
            </View>
          )
        ) : (
          <CameraView
            style={styles.camera}
            facing={facing}
            mode="video"
            ref={cameraRef}
          >
            {/* Local video overlay */}
            {user?.role === 'lecturer' && (
              <View style={styles.localVideoOverlay}>
                <Pressable
                  style={styles.flipButton}
                  onPress={toggleCameraFacing}
                >
                  <Feather name="rotate-cw" size={20} color="#FFF" />
                </Pressable>
              </View>
            )}
          </CameraView>
        )
      ) : (
        <View style={styles.videoPlaceholder}>
          <Feather name="video-off" size={64} color="#666" />
        </View>
      )}

      {/* Remote participants */}
      <View style={styles.remoteParticipants}>
        {/* Participant count icon */}
        <Pressable style={styles.participantCountIcon} onPress={() => setParticipantsModalVisible(true)}>
          <Feather name="users" size={20} color="#FFF" />
          <ThemedText style={styles.participantCountText}>{participants.filter(p => p.role === 'student').length}</ThemedText>
        </Pressable>
        {participants.map((participant) => {
          const pos = participantPositions.get(participant.id) || { x: 10, y: 10 };
          const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
              const newX = Math.max(0, Math.min(900 - 90, pos.x + gestureState.dx)); // constrain
              const newY = Math.max(0, Math.min(600 - 67, pos.y + gestureState.dy));
              setParticipantPositions(prev => new Map(prev.set(participant.id, { x: newX, y: newY })));
            },
            onPanResponderRelease: () => {},
          });
          const isMuted = micStates?.get(participant.id) ?? false; // true = muted
          return (
            <View
              key={participant.id}
              {...(Platform.OS === 'web' ? {} : panResponder.panHandlers)}
              {...(Platform.OS === 'web' ? {
                onMouseDown: (e: any) => {
                  setDraggingId(participant.id);
                  const rect = (e.currentTarget as any).getBoundingClientRect();
                  setDragOffset({ x: e.nativeEvent.pageX - rect.left, y: e.nativeEvent.pageY - rect.top });
                  document.addEventListener('mousemove', handleMouseMove.current);
                  document.addEventListener('mouseup', handleMouseUp.current);
                }
              } : {})}
              style={[participant.role === 'lecturer' ? styles.draggableLecturerVideo : styles.draggableStudentVideo, { left: pos.x, top: pos.y }]}
            >
              <Pressable onPress={() => setSelectedParticipant(participant)} style={{ flex: 1 }}>
                {Platform.OS === 'web' && remoteStreams.has(participant.id) && remoteStreams.get(participant.id)!.getVideoTracks().length > 0 ? (
                  <video
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    autoPlay
                    playsInline
                    ref={(video) => {
                      try {
                        if (video && remoteStreams.get(participant.id)) {
                          video.srcObject = remoteStreams.get(participant.id)!;
                          video.play().catch(e => console.log('Video play failed:', e));
                        }
                      } catch (error) {
                        console.error('Error setting video srcObject:', error);
                      }
                    }}
                  />
                ) : (
                  <View style={[styles.participantPlaceholder, participant.role === 'lecturer' ? styles.lecturerPlaceholder : styles.studentPlaceholder]}>
                    <Feather name="user" size={participant.role === 'lecturer' ? 20 : 16} color="#666" />
                  </View>
                )}
                <ThemedText style={participant.role === 'lecturer' ? styles.lecturerName : styles.studentName}>
                  {participant.role === 'lecturer' ? participant.name.toUpperCase() : participant.name.toLowerCase()}
                </ThemedText>
              </Pressable>
              {/* Mic Status Icon */}
              <View style={styles.micStatusIcon}>
                <Feather name={isMuted ? "mic-off" : "mic"} size={14} color={isMuted ? "#DC2626" : "#10B981"} />
              </View>
            </View>
          );
        })}
      </View>



      {/* Controls */}
      {user?.role === 'lecturer' ? (
        <View style={styles.controls}>
          <Pressable
            style={[styles.controlButton, { backgroundColor: isMuted ? '#DC2626' : 'rgba(255,255,255,0.2)' }]}
            onPress={onToggleMic}
          >
            <Feather name={isMuted ? "mic-off" : "mic"} size={20} color="#FFF" />
          </Pressable>

          <Pressable
            style={[styles.controlButton, { backgroundColor: !isVideoEnabled ? '#DC2626' : 'rgba(255,255,255,0.2)' }]}
            onPress={onToggleVideo}
          >
            <Feather name={!isVideoEnabled ? "video-off" : "video"} size={20} color="#FFF" />
          </Pressable>

          {selectedParticipant && (
            <Pressable
              style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => setSelectedParticipant(null)}
            >
              <Feather name="x" size={20} color="#FFF" />
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.controlsPlaceholder}>
          <Feather name="user" size={20} color="#FFF" />
          <ThemedText style={{ color: '#FFF', fontSize: 12, marginTop: 4 }}>Controls managed by lecturer</ThemedText>
        </View>
      )}

      {/* Participants Modal */}
      <Modal
        visible={participantsModalVisible}
        onRequestClose={() => setParticipantsModalVisible(false)}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Participants</ThemedText>
            <ScrollView style={styles.participantsList}>
              {participants.sort((a, b) => {
                // 1. Prioritize 'lecturer' role at the top
                if (a.role === 'lecturer' && b.role !== 'lecturer') return -1;
                if (b.role === 'lecturer' && a.role !== 'lecturer') return 1;
                // 2. If roles are equal, use hosting status as tie-breaker (e.g., session host priority)
                if (a.role === b.role) {
                  // Hosting status logic here (e.g., check if user is host)
                  // For now, assume no hosting field, so proceed to video priority
                }
                // 3. Then prioritize by active video tracks
                const aHasVideo = remoteStreams.has(a.id) && remoteStreams.get(a.id)!.getVideoTracks().length > 0;
                const bHasVideo = remoteStreams.has(b.id) && remoteStreams.get(b.id)!.getVideoTracks().length > 0;
                if (aHasVideo && !bHasVideo) return -1;
                if (!aHasVideo && bHasVideo) return 1;
                return 0;
              }).map(p => (
                <View key={p.id} style={styles.participantItem}>
                  <ThemedText style={styles.participantText}>{p.name.charAt(0).toUpperCase()}. {p.name} - {p.role.charAt(0).toUpperCase() + p.role.slice(1)}</ThemedText>
                </View>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCloseButton} onPress={() => setParticipantsModalVisible(false)}>
              <ThemedText style={styles.closeButtonText}>Back to Live Classroom</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  documentPressable: {
    flex: 1,
  },
  webPlaceholder: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginTop: Spacing.lg,
  },
  permissionButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'center',
    marginTop: Spacing.xl,
  },
  camera: {
    flex: 1,
  },
  localVideoOverlay: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
  },
  flipButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.sm,
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  remoteParticipants: {
    position: 'absolute',
    top: Spacing.xl * 2,
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.xl * 3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  participantPlaceholder: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lecturerPlaceholder: {
    height: 60,
  },
  studentPlaceholder: {
    height: 40,
  },
  draggableLecturerVideo: {
    position: 'absolute',
    width: 120,
    height: 90,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  draggableStudentVideo: {
    position: 'absolute',
    width: 80,
    height: 60,
    borderWidth: 1,
    borderColor: '#666', // Gray
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  lecturerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 2,
  },
  studentName: {
    fontSize: 10,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 1,
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  expandedControls: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },

  expandedLecturerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  expandedStudentName: {
    fontSize: 20,
    color: '#CCC',
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', // Semi-transparent overlay
    zIndex: 5,
  },
  backgroundLecturerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  backgroundStudentName: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  closeBackgroundButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.sm,
  },
  controls: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    zIndex: 10,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsPlaceholder: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  videoSwitchControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  switchButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    minWidth: 100,
  },
  participantCountIcon: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  participantCountText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '80%',
    maxHeight: '60%',
    borderRadius: BorderRadius.lg,
    padding: Platform.OS === 'web' ? Spacing.xl : Spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: '#000',
  },
  participantsList: {
    flex: 1,
  },
  participantItem: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  participantText: {
    fontSize: 14,
    color: '#000',
  },
  modalCloseButton: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: AppColors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  micStatusIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 2,
  },

});
import React, { useState, useMemo, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Modal, TextInput, RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";
import type { TutorRequest } from "@shared/schema";

export default function StudentRequestsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const { checkAccess } = useFeatureAccess();

  // Check if user has access to tutor requests feature
  const featureAccess = checkAccess('tutor_requests');

  const [selectedRequest, setSelectedRequest] = useState<TutorRequest | null>(null);
  const [followUpText, setFollowUpText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [allRequests, setAllRequests] = useState<TutorRequest[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const limit = 10;

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = statusFilter ? allRequests.filter(r => r.status === statusFilter) : allRequests;

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return (b.createdAt || 0) - (a.createdAt || 0);
        case 'status':
          return (a.status || 'pending').localeCompare(b.status || 'pending');
        default:
          return 0;
      }
    });
    return filtered;
  }, [statusFilter, allRequests, sortBy]);

  const fetchAllRequests = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllRequests(data.requests || []);
      } else {
        setError('Failed to fetch requests');
      }
    } catch (err) {
      setError('Failed to fetch requests');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setPage(1);
    try {
      await fetchAllRequests();
    } catch (err) {
      setError('Failed to refresh requests');
    }
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      // For now, just refetch - pagination can be implemented later
      await fetchAllRequests();
      setPage(nextPage);
    } catch (err) {
      setError('Failed to load more requests');
    }
    setLoading(false);
  };

  // Effect to fetch on filter change
  React.useEffect(() => {
    onRefresh();
  }, [statusFilter]);

  // Effect to fetch on mount
  React.useEffect(() => {
    fetchAllRequests();
  }, []);

  // Auto-refresh every 10 seconds for real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchAllRequests();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Parse messages when selectedRequest changes
  useEffect(() => {
    if (selectedRequest?.messages) {
      try {
        const parsedMessages = typeof selectedRequest.messages === 'string'
          ? JSON.parse(selectedRequest.messages)
          : selectedRequest.messages;
        setChatMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
      } catch (error) {
        console.error('Error parsing messages:', error);
        setChatMessages([]);
      }
    } else {
      setChatMessages([]);
    }
  }, [selectedRequest]);

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
        return AppColors.primary;
      case "resolved":
        return AppColors.success;
      default:
        return theme.textSecondary;
    }
  };

  const handleSendFollowUp = async () => {
    if (!selectedRequest || !followUpText.trim()) {
      Alert.alert('Error', 'Please enter a follow-up message');
      return;
    }

    const messageText = followUpText.trim();
    const newMessage = {
      sender: 'student',
      message: messageText,
      timestamp: Date.now(),
      status: 'sending'
    };

    // Add message to state immediately for real-time feedback
    setChatMessages(prev => [...prev, newMessage]);
    setFollowUpText("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${selectedRequest.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          sender: 'student'
        }),
      });

      if (response.ok) {
        // Update message status to sent
        setChatMessages(prev =>
          prev.map(msg =>
            msg.timestamp === newMessage.timestamp ? { ...msg, status: 'sent' } : msg
          )
        );
        Alert.alert('Message Sent', 'Your follow-up message has been sent to the tutor');
        // Refresh the request data
        fetchAllRequests();
      } else {
        // Remove the message on failure
        setChatMessages(prev => prev.filter(msg => msg.timestamp !== newMessage.timestamp));
        Alert.alert('Error', 'Failed to send message');
        setFollowUpText(messageText); // Restore text
      }
    } catch (error) {
      // Remove the message on failure
      setChatMessages(prev => prev.filter(msg => msg.timestamp !== newMessage.timestamp));
      Alert.alert('Error', 'Failed to send message');
      setFollowUpText(messageText); // Restore text
    }
  };

  const renderChatMessage = ({ item, index }: { item: any, index: number }) => {
    const isStudent = item.sender === 'student';
    const timestamp = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[
        styles.messageContainer,
        isStudent ? styles.studentMessage : styles.tutorMessage
      ]}>
        {!isStudent && (
          <View style={[styles.avatar, { backgroundColor: AppColors.primary + '20' }]}>
            <Feather name="user" size={16} color={AppColors.primary} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isStudent ? styles.studentBubble : styles.tutorBubble
        ]}>
          <ThemedText style={[
            styles.messageText,
            { color: isStudent ? '#FFF' : theme.text }
          ]}>
            {item.message}
          </ThemedText>
          <View style={styles.messageFooter}>
            <ThemedText style={[
              styles.timestamp,
              { color: isStudent ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
            ]}>
              {timestamp}
            </ThemedText>
            {isStudent && item.status && (
              <View style={styles.statusContainer}>
                <Feather
                  name={item.status === 'sent' ? 'check' : item.status === 'delivered' ? 'check-circle' : 'eye'}
                  size={12}
                  color={item.status === 'read' ? AppColors.success : 'rgba(255,255,255,0.7)'}
                />
              </View>
            )}
          </View>
        </View>
        {isStudent && (
          <View style={[styles.avatar, { backgroundColor: AppColors.secondary + '20' }]}>
            <Feather name="user" size={16} color={AppColors.secondary} />
          </View>
        )}
      </View>
    );
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    // For students, they can mark requests as resolved
    if (status !== 'resolved') return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Request marked as resolved');
        setSelectedRequest(null);
        fetchAllRequests(); // Refresh the list
      } else {
        Alert.alert('Error', 'Failed to update request status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const renderRequestItem = ({ item }: { item: TutorRequest }) => {
    return (
      <Pressable
        style={[styles.requestCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => setSelectedRequest(item)}
      >
        <View style={styles.requestHeader}>
          <ThemedText type="body" style={{ fontWeight: '600', flex: 1 }}>
            {item.title}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <ThemedText type="small" style={{ color: getStatusColor(item.status) }}>
              {(item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1)}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {getTypeLabel(item.type)}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString() : 'N/A'}
        </ThemedText>
      </Pressable>
    );
  };

  // Show subscription prompt if user doesn't have access
  if (!featureAccess.hasAccess) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
        <View style={[styles.subscriptionPrompt, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="lock" size={48} color={AppColors.primary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}>
            Premium Feature
          </ThemedText>
          <ThemedText type="body" style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
            {featureAccess.reason || 'This feature requires an active subscription.'}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            Upgrade your plan to access tutor requests and get personalized help with your studies.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText type="body" style={{ color: AppColors.error }}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.filterSection}>
          <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.md }}>Filter by Status:</ThemedText>
          <View style={styles.filterButtons}>
            <Pressable
              style={[styles.filterButton, statusFilter === null && { backgroundColor: AppColors.primary }]}
              onPress={() => setStatusFilter(null)}
            >
              <ThemedText type="small" style={{ color: statusFilter === null ? '#FFF' : theme.text }}>
                All
              </ThemedText>
            </Pressable>
            {(['pending', 'answered', 'resolved'] as const).map((status) => (
              <Pressable
                key={status}
                style={[styles.filterButton, statusFilter === status && { backgroundColor: getStatusColor(status) }]}
                onPress={() => setStatusFilter(status)}
              >
                <ThemedText type="small" style={{ color: statusFilter === status ? '#FFF' : getStatusColor(status) }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ThemedText type="small" style={{ fontWeight: '600', marginBottom: Spacing.sm }}>Sort by:</ThemedText>
          <View style={styles.filterButtons}>
            {(['date', 'status'] as const).map((sort) => (
              <Pressable
                key={sort}
                style={[styles.filterButton, sortBy === sort && { backgroundColor: AppColors.primary }]}
                onPress={() => setSortBy(sort)}
              >
                <ThemedText type="small" style={{ color: sortBy === sort ? '#FFF' : theme.text }}>
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.questionsSection}>
          <ThemedText type="h3">My Requests</ThemedText>
          {filteredAndSortedRequests.length > 0 ? (
            <FlatList
              data={filteredAndSortedRequests}
              keyExtractor={(item) => item.id}
              renderItem={renderRequestItem}
              contentContainerStyle={styles.questionsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={48} color={theme.textSecondary} />
              <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                No Requests
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
                Your tutor requests will appear here.
              </ThemedText>
            </View>
          )}
        </View>
  );

      <Modal visible={!!selectedRequest} animationType="slide" onRequestClose={() => setSelectedRequest(null)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailsHeader}>
              <Pressable onPress={() => setSelectedRequest(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Request Details</ThemedText>
            </View>

            <View style={styles.detailsContent}>
              <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
                {selectedRequest?.title}
              </ThemedText>

              <View style={styles.detailRow}>
                <ThemedText type="small" style={styles.detailLabel}>Type:</ThemedText>
                <ThemedText type="small">{selectedRequest ? getTypeLabel(selectedRequest.type) : ''}</ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" style={styles.detailLabel}>Status:</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: selectedRequest ? getStatusColor(selectedRequest.status) + '20' : '' }]}>
                  <ThemedText type="small" style={{ color: selectedRequest ? getStatusColor(selectedRequest.status) : '' }}>
                    {selectedRequest ? (selectedRequest.status || 'pending').charAt(0).toUpperCase() + (selectedRequest.status || 'pending').slice(1) : ''}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <ThemedText type="small" style={styles.detailLabel}>Created:</ThemedText>
                <ThemedText type="small">
                  {selectedRequest?.createdAt ? new Date(selectedRequest.createdAt * 1000).toLocaleString() : 'N/A'}
                </ThemedText>
              </View>

              {selectedRequest?.description && (
                <View style={styles.description}>
                  <ThemedText type="small" style={styles.detailLabel}>Description:</ThemedText>
                  <ThemedText type="body" style={{ marginTop: Spacing.sm }}>
                    {selectedRequest.description}
                  </ThemedText>
                </View>
              )}

              <View style={styles.chatContainer}>
                <ScrollView
                  style={styles.chatMessages}
                  showsVerticalScrollIndicator={false}
                  ref={(ref) => {
                    // Auto scroll to bottom when new messages arrive
                    if (ref && chatMessages.length > 0) {
                      setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
                    }
                  }}
                >
                  {chatMessages.map((message, index) => (
                    <View key={index}>
                      {renderChatMessage({ item: message, index })}
                    </View>
                  ))}

                  {selectedRequest?.response && !chatMessages.some(m => m.message === selectedRequest.response) && (
                    <View style={styles.messageContainer}>
                      <View style={[styles.avatar, { backgroundColor: AppColors.primary + '20' }]}>
                        <Feather name="user" size={16} color={AppColors.primary} />
                      </View>
                      <View style={styles.tutorBubble}>
                        <ThemedText style={{ color: theme.text }}>
                          {selectedRequest.response}
                        </ThemedText>
                        <View style={styles.messageFooter}>
                          <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
                            {selectedRequest.createdAt ? new Date(selectedRequest.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  )}

                  {isTyping && (
                    <View style={styles.typingIndicator}>
                      <View style={[styles.avatar, { backgroundColor: AppColors.primary + '20' }]}>
                        <Feather name="user" size={16} color={AppColors.primary} />
                      </View>
                      <View style={styles.typingDots}>
                        <View style={styles.typingDot} />
                        <View style={[styles.typingDot, { opacity: 0.7 }]} />
                        <View style={[styles.typingDot, { opacity: 0.4 }]} />
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.followUpSection}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.followUpInput, { color: theme.text, borderColor: theme.textSecondary }]}
                      placeholder="Type your message..."
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      value={followUpText}
                      onChangeText={(text) => {
                        setFollowUpText(text);
                        // Simulate typing indicator
                        if (text.trim() && !isTyping) {
                          setIsTyping(true);
                          setTimeout(() => setIsTyping(false), 2000);
                        }
                      }}
                    />
                    <Pressable
                      style={[styles.followUpButton, {
                        backgroundColor: followUpText.trim() ? AppColors.primary : '#9CA3AF'
                      }]}
                      onPress={handleSendFollowUp}
                      disabled={!followUpText.trim()}
                    >
                      <Feather name="send" size={16} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.md }}>
                  Update Status:
                </ThemedText>
                <View style={styles.statusButtons}>
                  {(['pending', 'answered', 'resolved'] as const).map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusButton,
                        selectedRequest && (selectedRequest.status || 'pending') === status && { backgroundColor: getStatusColor(status) },
                      ]}
                      onPress={() => selectedRequest && handleUpdateStatus(selectedRequest.id, status)}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: selectedRequest && (selectedRequest.status || 'pending') === status ? '#FFF' : getStatusColor(status),
                        }}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    padding: Spacing.lg,
    backgroundColor: AppColors.error + '20',
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  filterSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
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
  questionsSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  questionsList: {
    gap: Spacing.md,
  },
  requestCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing["5xl"],
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
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
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
  responseSection: {
    gap: Spacing.sm,
  },
  responseDisplay: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  followUpSection: {
    gap: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  followUpInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 40,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  followUpButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
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
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: Spacing.xs,
    maxWidth: '80%',
  },
  studentMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  tutorMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs,
  },
  messageBubble: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: '85%',
  },
  studentBubble: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: BorderRadius.xs,
  },
  tutorBubble: {
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  timestamp: {
    fontSize: 12,
  },
  statusContainer: {
    marginLeft: Spacing.xs,
  },
  chatContainer: {
    flex: 1,
    maxHeight: 300,
  },
  chatMessages: {
    padding: Spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.md,
    margin: Spacing.sm,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    marginLeft: Spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  subscriptionPrompt: {
    alignItems: 'center',
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    margin: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
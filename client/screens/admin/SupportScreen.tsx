import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAdmin } from "@/contexts/AdminContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import type { SupportRequest } from "../../../shared/schema";

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { supportRequests, users, fetchSupportRequests, updateSupportRequest, hasPermission } = useAdmin();

  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open': return AppColors.error;
      case 'in_progress': return AppColors.accent;
      case 'resolved': return AppColors.success;
      case 'closed': return theme.textSecondary;
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'open': return 'circle';
      case 'in_progress': return 'clock';
      case 'resolved': return 'check-circle';
      case 'closed': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    const success = await updateSupportRequest(requestId, { status });
    if (success) {
      Alert.alert('Success', 'Support request status updated');
      setSelectedRequest(null);
    } else {
      Alert.alert('Error', 'Failed to update support request');
    }
  };

  const renderRequestItem = ({ item }: { item: SupportRequest }) => {
    const user = users.find(u => u.id === item.userId);
    return (
      <Pressable
        style={[styles.requestCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => setSelectedRequest(item)}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {item.title}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {user?.name || 'Unknown User'}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString() : 'N/A'}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'open') + '20' }]}>
            <Feather name={getStatusIcon(item.status || 'open')} size={14} color={getStatusColor(item.status || 'open')} />
            <ThemedText type="small" style={{ color: getStatusColor(item.status || 'open'), marginLeft: Spacing.xs }}>
              {(item.status || 'open').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!hasPermission('canHandleSupport')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.centerContent}>
          <Feather name="help-circle" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            Access Denied
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            You don't have permission to handle support requests.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={supportRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="help-circle" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No Support Requests
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Support requests from users will appear here.
            </ThemedText>
          </View>
        }
      />

      {/* Request Details Modal */}
      <Modal visible={!!selectedRequest} animationType="slide" onRequestClose={() => setSelectedRequest(null)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelectedRequest(null)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Support Request Details</ThemedText>
          </View>

          {selectedRequest && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.requestDetail}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
                  {selectedRequest.title}
                </ThemedText>

                <View style={styles.detailRow}>
                  <ThemedText type="small" style={styles.detailLabel}>Type:</ThemedText>
                  <ThemedText type="small">
                    {selectedRequest.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </ThemedText>
                </View>

                <View style={styles.detailRow}>
                  <ThemedText type="small" style={styles.detailLabel}>Status:</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status || 'open') + '20' }]}>
                    <Feather name={getStatusIcon(selectedRequest.status || 'open')} size={14} color={getStatusColor(selectedRequest.status || 'open')} />
                    <ThemedText type="small" style={{ color: getStatusColor(selectedRequest.status || 'open'), marginLeft: Spacing.xs }}>
                      {(selectedRequest.status || 'open').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <ThemedText type="small" style={styles.detailLabel}>User:</ThemedText>
                  <ThemedText type="small">
                    {users.find(u => u.id === selectedRequest.userId)?.name || 'Unknown'}
                  </ThemedText>
                </View>

                <View style={styles.detailRow}>
                  <ThemedText type="small" style={styles.detailLabel}>Created:</ThemedText>
                  <ThemedText type="small">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt * 1000).toLocaleString() : 'N/A'}
                  </ThemedText>
                </View>

                <View style={styles.description}>
                  <ThemedText type="small" style={styles.detailLabel}>Description:</ThemedText>
                  <ThemedText type="body" style={{ marginTop: Spacing.sm }}>
                    {selectedRequest.description || 'No description provided.'}
                  </ThemedText>
                </View>

                <View style={styles.actions}>
                  <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.md }}>
                    Update Status:
                  </ThemedText>
                  <View style={styles.statusButtons}>
                    {(['open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                      <Pressable
                        key={status}
                        style={[
                          styles.statusButton,
                          (selectedRequest.status || 'open') === status && { backgroundColor: getStatusColor(status) },
                        ]}
                        onPress={() => handleUpdateStatus(selectedRequest.id, status)}
                      >
                        <Feather name={getStatusIcon(status)} size={16} color={(selectedRequest.status || 'open') === status ? '#FFF' : getStatusColor(status)} />
                        <ThemedText
                          type="small"
                          style={{
                            color: (selectedRequest.status || 'open') === status ? '#FFF' : getStatusColor(status),
                            marginLeft: Spacing.xs
                          }}
                        >
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  requestCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  requestInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  requestDetail: {
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
  actions: {
    marginTop: Spacing.xl,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
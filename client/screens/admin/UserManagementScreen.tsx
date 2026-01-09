import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Modal, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAdmin } from "@/contexts/AdminContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import type { User } from "../../../shared/schema";

export default function UserManagementScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { users, fetchUsers, createUser, updateUser, deleteUser, changePassword, hasPermission } = useAdmin();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'student' as 'student' | 'lecturer' | 'tutor' | 'admin',
  });

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      role: 'student',
    });
  };

  const handleCreate = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const success = await createUser({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      name: formData.name,
      role: formData.role,
    });

    if (success) {
      setShowCreateModal(false);
      resetForm();
    } else {
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      name: user.name,
      role: user.role as 'student' | 'lecturer' | 'tutor' | 'admin',
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    const success = await updateUser(editingUser.id, {
      name: formData.name,
      role: formData.role,
    });

    if (success) {
      setEditingUser(null);
      resetForm();
    } else {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleDelete = (user: User) => {
    console.log('Delete icon pressed for user:', user.name);
    setDeleteUserTarget(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserTarget) return;

    console.log('Delete confirmed for user:', deleteUserTarget.id);
    const result = await deleteUser(deleteUserTarget.id);
    console.log('Delete result:', result);
    if (result.success) {
      setShowDeleteModal(false);
      setDeleteUserTarget(null);
      Alert.alert('Success', 'User deleted successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to delete user');
    }
  };

  const handleChangePassword = (user: User) => {
    console.log('Lock icon pressed for user:', user.name, user.id);
    setPasswordUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    console.log('handlePasswordSubmit called with passwordUser:', passwordUser?.name, 'newPassword length:', newPassword.length);
    if (!passwordUser || !newPassword.trim()) {
      console.log('Validation failed: missing user or password');
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    console.log('Calling changePassword...');
    const success = await changePassword(passwordUser.id, newPassword);
    console.log('changePassword returned:', success);
    if (success) {
      console.log('Password change successful, closing modal');
      setShowPasswordModal(false);
      setPasswordUser(null);
      setNewPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } else {
      console.log('Password change failed');
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={[styles.userCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.userInfo}>
        <ThemedText type="body" style={{ fontWeight: '600' }}>
          {item.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item.email} • {item.role}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Joined: {item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString() : 'N/A'}
        </ThemedText>
      </View>
      <View style={styles.userActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: AppColors.primary }]}
          onPress={() => handleEdit(item)}
        >
          <Feather name="edit" size={16} color="#FFF" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: AppColors.accent }]}
          onPress={() => handleChangePassword(item)}
        >
          <Feather name="lock" size={16} color="#FFF" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: AppColors.error }]}
          onPress={() => handleDelete(item)}
        >
          <Feather name="trash-2" size={16} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );

  if (!hasPermission('canManageUsers')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.centerContent}>
          <Feather name="shield" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            Access Denied
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>
            You don't have permission to manage users.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          { paddingTop: headerHeight + Spacing.lg, paddingBottom: Spacing.lg },
        ]}
      >
        <Pressable
          style={[styles.addButton, { backgroundColor: AppColors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={20} color="#FFF" />
          <ThemedText type="body" style={{ color: '#FFF', marginLeft: Spacing.sm }}>
            Add User
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Create User Modal */}
      <Modal visible={showCreateModal || !!editingUser} animationType="slide" onRequestClose={() => {
        setShowCreateModal(false);
        setEditingUser(null);
        resetForm();
      }}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => {
              setShowCreateModal(false);
              setEditingUser(null);
              resetForm();
            }}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">
              {editingUser ? 'Edit User' : 'Create New User'}
            </ThemedText>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Username</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholder="Enter username"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {!editingUser && (
              <View style={[styles.inputGroup, { borderColor: theme.border }]}>
                <ThemedText type="small" style={styles.label}>Password</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  placeholder="Enter password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                />
              </View>
            )}

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter full name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Role</ThemedText>
              <View style={styles.roleButtons}>
                {(['student', 'lecturer', 'tutor', 'admin'] as const).map((role) => (
                  <Pressable
                    key={role}
                    style={[
                      styles.roleButton,
                      formData.role === role && { backgroundColor: AppColors.primary },
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, role }))}
                  >
                    <ThemedText
                      type="small"
                      style={formData.role === role ? { color: '#FFF' } : { color: theme.text }}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button
              onPress={editingUser ? handleUpdate : handleCreate}
              style={{ marginTop: Spacing.lg }}
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" onRequestClose={() => {
        setShowPasswordModal(false);
        setPasswordUser(null);
        setNewPassword('');
      }}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => {
              setShowPasswordModal(false);
              setPasswordUser(null);
              setNewPassword('');
            }}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">
              Change Password
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ marginBottom: Spacing.lg, textAlign: 'center' }}>
              Enter new password for {passwordUser?.name}
            </ThemedText>

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>New Password</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <Button
              onPress={handlePasswordSubmit}
              style={{ marginTop: Spacing.lg }}
            >
              Change Password
            </Button>
          </View>
        </View>
      </Modal>

      {/* Delete User Modal */}
      <Modal visible={showDeleteModal} animationType="slide" onRequestClose={() => {
        setShowDeleteModal(false);
        setDeleteUserTarget(null);
      }}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => {
              setShowDeleteModal(false);
              setDeleteUserTarget(null);
            }}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">
              Delete User
            </ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ marginBottom: Spacing.lg, textAlign: 'center' }}>
              Are you sure you want to delete {deleteUserTarget?.name}?
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xl, textAlign: 'center' }}>
              This action cannot be undone.
            </ThemedText>

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Button
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteUserTarget(null);
                }}
                style={{ flex: 1, backgroundColor: theme.textSecondary }}
              >
                Cancel
              </Button>
              <Button
                onPress={handleDeleteConfirm}
                style={{ flex: 1, backgroundColor: AppColors.error }}
              >
                Delete
              </Button>
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
  header: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  userInfo: {
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
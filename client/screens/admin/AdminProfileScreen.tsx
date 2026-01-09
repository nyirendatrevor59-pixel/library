import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

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
        style={[
          styles.menuIcon,
          { backgroundColor: AppColors.secondary + "20" },
        ]}
      >
        <Feather name={icon as any} size={18} color={AppColors.secondary} />
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

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { updateUser, changePassword, permissions } = useAdmin();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleEditProfile = async () => {
    if (!user) return;

    const success = await updateUser(user.id, {
      name: editForm.name,
    });

    if (success) {
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    const success = await changePassword(user.id, passwordForm.newPassword);

    if (success) {
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } else {
      Alert.alert('Error', 'Failed to change password');
    }
  };

  const permissionList = [
    { key: 'canManageUsers', label: 'Manage Users', value: permissions.canManageUsers },
    { key: 'canViewAnalytics', label: 'View Analytics', value: permissions.canViewAnalytics },
    { key: 'canHandleSupport', label: 'Handle Support', value: permissions.canHandleSupport },
    { key: 'canAssignTutors', label: 'Assign Tutors', value: permissions.canAssignTutors },
    { key: 'canEditOwnProfile', label: 'Edit Own Profile', value: permissions.canEditOwnProfile },
    { key: 'canViewMaterials', label: 'View Materials', value: permissions.canViewMaterials },
    { key: 'canAttendSessions', label: 'Attend Sessions', value: permissions.canAttendSessions },
  ];

  return (
    <View style={{ flex: 1 }}>
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
            style={[
              styles.avatar,
              { backgroundColor: AppColors.secondary + "20" },
            ]}
          >
            <Feather name="user" size={32} color={AppColors.secondary} />
          </View>
          <ThemedText type="h3">{user?.name || "Admin"}</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {user?.email}
          </ThemedText>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: AppColors.secondary + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: AppColors.secondary, fontWeight: "600" }}
            >
              Administrator
            </ThemedText>
          </View>
        </View>

        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: AppColors.primary }}>
              {Object.values(permissions).filter(Boolean).length}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Permissions
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: AppColors.accent }}>
              100%
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Access Level
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText type="h3" style={{ color: AppColors.success }}>
              Active
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Status
            </ThemedText>
          </View>
        </Card>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Profile Management
          </ThemedText>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="edit"
              title="Edit Profile"
              subtitle="Update your name and email"
              onPress={() => {
                setEditForm({ name: user?.name || '', email: user?.email || '' });
                setShowEditModal(true);
              }}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="lock"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => setShowPasswordModal(true)}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="shield"
              title="Permissions"
              subtitle="View your access permissions"
              onPress={() => setShowPermissionsModal(true)}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Account
          </ThemedText>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="log-out"
              title="Sign Out"
              subtitle="Log out of your account"
              onPress={logout}
            />
          </Card>
        </View>
      </KeyboardAwareScrollViewCompat>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowEditModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Edit Profile</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={editForm.name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Email changes might require verification, so disabled for now
              />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                Email cannot be changed from this screen
              </ThemedText>
            </View>

            <Button onPress={handleEditProfile} style={{ marginTop: Spacing.lg }}>
              Update Profile
            </Button>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPasswordModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Change Password</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>New Password</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                placeholder="Enter new password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputGroup, { borderColor: theme.border }]}>
              <ThemedText type="small" style={styles.label}>Confirm New Password</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
              />
            </View>

            <Button onPress={handleChangePassword} style={{ marginTop: Spacing.lg }}>
              Change Password
            </Button>
          </View>
        </View>
      </Modal>

      {/* Permissions Modal */}
      <Modal visible={showPermissionsModal} animationType="slide" onRequestClose={() => setShowPermissionsModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowPermissionsModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Permissions</ThemedText>
          </View>

          <View style={styles.permissionsList}>
            {permissionList.map((permission) => (
              <View key={permission.key} style={styles.permissionItem}>
                <View style={styles.permissionInfo}>
                  <ThemedText type="body" style={{ fontWeight: '500' }}>
                    {permission.label}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {permission.value ? 'Granted' : 'Not granted'}
                  </ThemedText>
                </View>
                <View style={[styles.permissionStatus, {
                  backgroundColor: permission.value ? AppColors.success + '20' : AppColors.error + '20'
                }]}>
                  <Feather
                    name={permission.value ? 'check-circle' : 'x-circle'}
                    size={20}
                    color={permission.value ? AppColors.success : AppColors.error}
                  />
                </View>
              </View>
            ))}
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
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  permissionsList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionStatus: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
});
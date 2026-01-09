import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Modal, FlatList, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import type { LecturerTabParamList } from "@/navigation/LecturerTabNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES, SAMPLE_NOTES } from "@/lib/sampleData";
import { navigate } from "@/lib/navigation";
import { API_BASE_URL } from "@/lib/api";

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

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

export default function LecturerProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);

  const [lecturerMaterials, setLecturerMaterials] = useState<any[]>([]);

  useEffect(() => {
    fetchLecturerMaterials();
  }, []);

  const fetchLecturerMaterials = async () => {
    try {
      console.log("Fetching materials for lecturer:", user?.id);
      const response = await fetch(`${API_BASE_URL}/api/materials?lecturerId=${user?.id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched materials:", data);
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

  const handleOpenMaterial = (material: any) => {
    console.log("Opening material:", material);
    console.log("Navigation parent:", navigation.getParent());
    console.log("Root parent:", navigation.getParent()?.getParent());
    navigation.getParent()?.getParent()?.navigate("DocumentViewer", {
      documentId: String(material.id),
      title: material.title,
    });
  };

  const handleDeleteMaterial = async (material: any) => {
    if (!confirm(`Are you sure you want to delete "${material.title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/materials/${material.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Refresh the list
      await fetchLecturerMaterials();
    } catch (error) {
      console.error("Failed to delete material:", error);
      alert("Failed to delete material");
    }
  };

  const getMaterialIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return 'file-text';
    if (fileType?.includes('image')) return 'image';
    if (fileType?.includes('doc') || fileType?.includes('word')) return 'file-text';
    return 'file';
  };



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
        <ThemedText type="h3">{user?.name || "Professor"}</ThemedText>
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
            Lecturer
          </ThemedText>
        </View>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.primary }}>
            {lecturerMaterials.length}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Uploads
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.accent }}>
            4
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Courses
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h3" style={{ color: AppColors.success }}>
            156
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Students
          </ThemedText>
        </View>
      </Card>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Teaching
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="book"
            title="My Courses"
            subtitle="4 active courses"
            onPress={() => setShowCoursesModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="file-text"
            title="Uploaded Materials"
            subtitle={`${lecturerMaterials.length} documents`}
            onPress={() => setShowMaterialsModal(true)}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem
            icon="video"
            title="Class Recordings"
            subtitle="24 recordings"
          />
        </Card>
      </View>


      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Settings
        </ThemedText>
        <Card style={styles.menuCard}>
          <MenuItem icon="bell" title="Notifications" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="shield" title="Privacy" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="help-circle" title="Help & Support" />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <MenuItem icon="log-out" title="Sign Out" onPress={logout} />
        </Card>
      </View>

      <Modal visible={showCoursesModal} animationType="slide" onRequestClose={() => setShowCoursesModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCoursesModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">My Courses</ThemedText>
          </View>
          <FlatList
            data={AVAILABLE_COURSES.slice(0, 4)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.coursesList}
            renderItem={({ item }) => (
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
                  <ThemedText type="small" style={{ color: AppColors.accent }}>
                    45 students • Next: Tomorrow 10 AM
                  </ThemedText>
                </View>
                <View style={styles.courseActions}>
                  <Pressable
                    style={[styles.courseAction, { backgroundColor: AppColors.primary }]}
                    onPress={() => {
                      setShowCoursesModal(false);
                      navigation.navigate('Classroom' as never);
                      // Start class immediately
                    }}
                  >
                    <Feather name="play" size={16} color="#FFF" />
                    <ThemedText type="small" style={{ color: "#FFF", fontSize: 10 }}>Start</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.courseAction, { backgroundColor: AppColors.accent }]}
                    onPress={() => {
                      setShowCoursesModal(false);
                      navigation.navigate('ClassroomTab' as never);
                      // Schedule class
                    }}
                  >
                    <Feather name="calendar" size={16} color="#FFF" />
                    <ThemedText type="small" style={{ color: "#FFF", fontSize: 10 }}>Schedule</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.courseAction, { backgroundColor: AppColors.secondary }]}
                    onPress={() => {
                      // View course details or students
                      Alert.alert("Course Details", `Details for ${item.name}`);
                    }}
                  >
                    <Feather name="info" size={16} color="#FFF" />
                    <ThemedText type="small" style={{ color: "#FFF", fontSize: 10 }}>Details</ThemedText>
                  </Pressable>
                </View>
              </Card>
            )}
          />
        </View>
      </Modal>


    </KeyboardAwareScrollViewCompat>

    <Modal visible={showMaterialsModal} animationType="slide" onRequestClose={() => setShowMaterialsModal(false)}>
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowMaterialsModal(false)}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">My Materials</ThemedText>
        </View>
        <FlatList
          data={lecturerMaterials}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
          renderItem={({ item }) => (
            <Pressable onPress={() => {
              setShowMaterialsModal(false);
              handleOpenMaterial(item);
            }} style={[styles.materialItem, { backgroundColor: theme.backgroundDefault }]}>
              <View
                style={[
                  styles.materialIcon,
                  { backgroundColor: AppColors.primary + "20" },
                ]}
              >
                <Feather name={getMaterialIcon(item.fileType)} size={20} color={AppColors.primary} />
              </View>
              <View style={styles.materialInfo}>
                <ThemedText type="body" style={{ fontWeight: "500" }}>
                  {item.title}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {item.description || item.fileType || "No description"}
                </ThemedText>
                <ThemedText type="small" style={{ color: AppColors.accent }}>
                  {item.size ? formatSize(item.size) : "N/A"} • {item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString() : "N/A"}
                </ThemedText>
              </View>
              <View style={styles.itemActions}>
                <Pressable onPress={(e) => { e.stopPropagation(); handleDeleteMaterial(item); }} style={styles.actionButton}>
                  <Feather name="trash-2" size={16} color={AppColors.error} />
                </Pressable>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
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
                No materials available
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
  materialItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  materialInfo: {
    flex: 1,
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
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  coursesList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  courseInfo: {
    flex: 1,
  },
  courseActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  courseAction: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
});

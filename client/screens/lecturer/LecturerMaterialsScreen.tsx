import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useLive } from "@/contexts/LiveContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { API_BASE_URL } from "@/lib/api";
import { navigate } from "@/lib/navigation";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "file-text", color: AppColors.error },
  doc: { icon: "file", color: AppColors.primary },
  docx: { icon: "file", color: AppColors.primary },
  link: { icon: "link", color: AppColors.success },
};

const FILTER_OPTIONS = ["All", "PDF", "Word"];

export default function LecturerMaterialsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = 0; // Not in tab navigator
  const { theme } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { socket } = useLive();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showSearch, setShowSearch] = useState(false);
  const [lecturerMaterials, setLecturerMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  console.log('LecturerMaterialsScreen render - User:', user);
  console.log('LecturerMaterialsScreen render - User ID:', user?.id);
  console.log('LecturerMaterialsScreen render - User selectedCourses:', user?.selectedCourses);
  console.log('LecturerMaterialsScreen render - Materials:', lecturerMaterials);
  console.log('LecturerMaterialsScreen render - Courses state length:', courses.length);
  console.log('LecturerMaterialsScreen render - Materials courseIds:', lecturerMaterials.map(m => m.courseId));

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchLecturerMaterials();
    }
  }, [user?.id]);

  useEffect(() => {
    if (socket) {
      console.log('Setting up material-updated listener');
      socket.on('material-updated', (data) => {
        console.log('Received material-updated:', data);
        fetchLecturerMaterials();
      });
      return () => {
        socket.off('material-updated');
      };
    }
  }, [socket]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      const data = await response.json();
      console.log('Courses fetched successfully:', data.length, data);
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchLecturerMaterials = async () => {
    try {
      console.log('Fetching materials for lecturerId:', user?.id);
      const response = await fetch(`${API_BASE_URL}/api/materials?lecturerId=${user?.id}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched materials data:', data);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLecturerMaterials();
    setRefreshing(false);
  };

  const currentData = lecturerMaterials.map(m => {
    const course = courses.find(c => c.id === m.courseId);
    let normalizedFileType = "pdf"; // default
    if (m.fileType) {
      if (m.fileType.includes("pdf")) normalizedFileType = "pdf";
      else if (m.fileType.includes("word") || m.fileType.includes("doc")) normalizedFileType = "doc";
      else normalizedFileType = "link";
    }
    return {
      id: m.id,
      title: m.title,
      courseName: course ? course.name : "Course " + m.courseId,
      fileType: normalizedFileType,
      size: m.size || "N/A",
      uploadedAt: new Date(m.createdAt * 1000).toLocaleDateString(), // createdAt is in seconds
    };
  });
  console.log('currentData length:', currentData.length);
  console.log('currentData courseNames:', currentData.map(d => d.courseName));

  const filteredNotes = currentData.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "All" ||
      (selectedFilter === "PDF" && note.fileType === "pdf") ||
      (selectedFilter === "Word" &&
        (note.fileType === "doc" || note.fileType === "docx"));
    return matchesSearch && matchesFilter;
  });
  console.log('filteredNotes length:', filteredNotes.length);

  // Include all user's courses, even if no materials
  const userCourseNames = courses
    .filter(c => user?.selectedCourses?.includes(c.id))
    .map(c => c.name);

  const groupedNotes = userCourseNames.reduce(
    (acc, courseName) => {
      acc[courseName] = [];
      return acc;
    },
    {} as Record<string, any[]>,
  );

  filteredNotes.forEach(note => {
    if (groupedNotes[note.courseName]) {
      groupedNotes[note.courseName].push(note);
    }
  });

  console.log('groupedNotes keys:', Object.keys(groupedNotes));
  console.log('groupedNotes counts:', Object.keys(groupedNotes).map(key => `${key}: ${groupedNotes[key].length}`));

  const handleOpenDocument = (note: any) => {
    console.log("Opening document:", note);
    navigation.getParent()?.getParent()?.navigate("DocumentViewer", {
      documentId: String(note.id),
      title: note.title,
    });
  };

  const handleDeleteMaterial = async (note: any) => {
    // Confirm delete
    if (!confirm(`Are you sure you want to delete "${note.title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/materials/${note.id}`, {
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

  const renderNoteItem = (note: any) => {
    const fileConfig = FILE_TYPE_ICONS[note.fileType] || {
      icon: "file",
      color: theme.textSecondary,
    };

    return (
      <Pressable
        key={note.id}
        style={[styles.noteItem, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => handleOpenDocument(note)}
      >
        <View
          style={[
            styles.fileIcon,
            { backgroundColor: fileConfig.color + "20" },
          ]}
        >
          <Feather
            name={fileConfig.icon as any}
            size={20}
            color={fileConfig.color}
          />
        </View>
        <View style={styles.noteInfo}>
          <ThemedText
            type="body"
            style={{ fontWeight: "500" }}
            numberOfLines={1}
          >
            {note.title}
          </ThemedText>
          <View style={styles.noteMetadata}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {note.size}
            </ThemedText>
            <View style={styles.dot} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {note.uploadedAt}
            </ThemedText>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => handleDeleteMaterial(note)} style={styles.actionButton}>
            <Feather name="trash-2" size={20} color={AppColors.error} />
          </Pressable>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: headerHeight + Spacing.lg }]}>
        {showSearch ? (
          <View
            style={[
              styles.searchBar,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search documents..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <Pressable
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            >
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <ThemedText type="h2">Materials</ThemedText>
            <Pressable onPress={() => setShowSearch(true)}>
              <Feather name="search" size={24} color={theme.text} />
            </Pressable>
          </View>
        )}

        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedFilter === item
                      ? AppColors.primary
                      : theme.backgroundDefault,
                },
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <ThemedText
                type="small"
                style={{ color: selectedFilter === item ? "#FFF" : theme.text }}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={Object.entries(groupedNotes)}
        keyExtractor={([courseName]) => courseName}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: [courseName, notes] }) => (
          <View style={styles.courseSection}>
            <ThemedText type="h4" style={styles.courseName}>
              {courseName}
            </ThemedText>
            {(notes as any[]).length > 0 ? (
              <View style={styles.notesList}>{(notes as any[]).map(renderNoteItem)}</View>
            ) : (
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
                  No materials available for this course
                </ThemedText>
              </View>
            )}
          </View>
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
              {searchQuery
                ? "Try a different search term"
                : "No materials available"}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterList: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  courseSection: {
    gap: Spacing.md,
  },
  courseName: {
    marginBottom: Spacing.xs,
  },
  notesList: {
    gap: Spacing.sm,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  noteInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  noteMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#9CA3AF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
});
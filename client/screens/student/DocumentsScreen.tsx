import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { SAMPLE_NOTES } from "@/lib/sampleData";
import { Note } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { API_BASE_URL } from "@/lib/api";

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "file-text", color: AppColors.error },
  doc: { icon: "file", color: AppColors.primary },
  docx: { icon: "file", color: AppColors.primary },
  link: { icon: "link", color: AppColors.success },
};

const FILTER_OPTIONS = ["All", "PDF", "Word"];
const TAB_OPTIONS = ["Shared Documents", "Lecturer Materials"];

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Shared Documents");
  const [lecturerMaterials, setLecturerMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedTab === "Lecturer Materials") {
      console.log('Fetching lecturer materials for user:', {
        userId: user?.id,
        selectedCourses: user?.selectedCourses,
        role: user?.role
      });
      fetchLecturerMaterials();
    }
  }, [selectedTab, user?.selectedCourses]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchLecturerMaterials = async () => {
    try {
      const courseIds = user?.selectedCourses?.join(',') || '';
      const url = courseIds
        ? `${API_BASE_URL}/api/materials?courseIds=${courseIds}`
        : `${API_BASE_URL}/api/materials`;

      const response = await fetch(url);
      const data = await response.json();

      setLecturerMaterials(data);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
      setLecturerMaterials([]); // Ensure we have an empty array on error
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLecturerMaterials();
    setRefreshing(false);
  };

  const currentData = selectedTab === "Shared Documents" ? SAMPLE_NOTES : lecturerMaterials.map(m => {
    const course = courses.find(c => c.id === m.courseId);
    return {
      id: m.id,
      title: m.title || "Untitled",
      courseName: course ? course.name : "Course " + (m.courseId || "Unknown"),
      fileType: m.fileType || "pdf",
      size: m.size || "N/A",
      uploadedAt: m.createdAt ? new Date(m.createdAt * 1000).toLocaleDateString() : "N/A",
    };
  });

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

  const groupedNotes = filteredNotes.reduce(
    (acc, note) => {
      try {
        const courseName = note.courseName || "Unknown Course";
        if (!acc[courseName]) {
          acc[courseName] = [];
        }
        acc[courseName].push(note);
      } catch (error) {
        console.error("Error grouping note:", note, error);
      }
      return acc;
    },
    {} as Record<string, any[]>,
  );

  console.log('DocumentsScreen render data:', {
    selectedTab,
    lecturerMaterialsCount: lecturerMaterials.length,
    currentDataCount: currentData.length,
    filteredNotesCount: filteredNotes.length,
    groupedNotesKeys: Object.keys(groupedNotes),
    sampleGroupedNote: Object.entries(groupedNotes)[0]?.[1]?.[0]
  });

  const handleOpenDocument = (note: Note) => {
    console.log('Opening document:', note);
    Alert.alert('Debug', `Opening document: ${note.title} (ID: ${note.id})`);
    navigation.navigate("DocumentViewer", {
      documentId: note.id,
      title: note.title,
    });
  };

  const renderNoteItem = (note: Note) => {
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
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
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
            <ThemedText type="h2">Documents</ThemedText>
            <Pressable onPress={() => setShowSearch(true)}>
              <Feather name="search" size={24} color={theme.text} />
            </Pressable>
          </View>
        )}



        <FlatList
          horizontal
          data={TAB_OPTIONS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedTab === item
                      ? AppColors.primary
                      : theme.backgroundDefault,
                },
              ]}
              onPress={() => setSelectedTab(item)}
            >
              <ThemedText
                type="small"
                style={{ color: selectedTab === item ? "#FFF" : theme.text }}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />

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
            <View style={styles.notesList}>{(notes as Note[]).map(renderNoteItem)}</View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="folder" size={48} color={theme.textSecondary} />
            <ThemedText
              type="h4"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
            >
              No Documents Found
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
                : selectedTab === "Lecturer Materials"
                ? "No lecturer materials available yet"
                : "Your course documents will appear here"}
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

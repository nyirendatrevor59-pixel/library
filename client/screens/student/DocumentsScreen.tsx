import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { SAMPLE_NOTES } from "@/lib/sampleData";
import { Note } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "file-text", color: AppColors.error },
  doc: { icon: "file", color: AppColors.primary },
  docx: { icon: "file", color: AppColors.primary },
};

const FILTER_OPTIONS = ["All", "PDF", "Word"];

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showSearch, setShowSearch] = useState(false);

  const filteredNotes = SAMPLE_NOTES.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "All" ||
      (selectedFilter === "PDF" && note.fileType === "pdf") ||
      (selectedFilter === "Word" && (note.fileType === "doc" || note.fileType === "docx"));
    return matchesSearch && matchesFilter;
  });

  const groupedNotes = filteredNotes.reduce((acc, note) => {
    if (!acc[note.courseName]) {
      acc[note.courseName] = [];
    }
    acc[note.courseName].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const handleOpenDocument = (note: Note) => {
    navigation.navigate("DocumentViewer", { documentId: note.id, title: note.title });
  };

  const renderNoteItem = (note: Note) => {
    const fileConfig = FILE_TYPE_ICONS[note.fileType] || { icon: "file", color: theme.textSecondary };
    
    return (
      <Pressable
        key={note.id}
        style={[styles.noteItem, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => handleOpenDocument(note)}
      >
        <View style={[styles.fileIcon, { backgroundColor: fileConfig.color + "20" }]}>
          <Feather name={fileConfig.icon as any} size={20} color={fileConfig.color} />
        </View>
        <View style={styles.noteInfo}>
          <ThemedText type="body" style={{ fontWeight: "500" }} numberOfLines={1}>
            {note.title}
          </ThemedText>
          <View style={styles.noteMetadata}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {note.size}
            </ThemedText>
            <View style={styles.dot} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
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
          <View style={[styles.searchBar, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search documents..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <Pressable onPress={() => { setShowSearch(false); setSearchQuery(""); }}>
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
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterChip,
                { backgroundColor: selectedFilter === item ? AppColors.primary : theme.backgroundDefault },
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
        renderItem={({ item: [courseName, notes] }) => (
          <View style={styles.courseSection}>
            <ThemedText type="h4" style={styles.courseName}>{courseName}</ThemedText>
            <View style={styles.notesList}>
              {notes.map(renderNoteItem)}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="folder" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No Documents Found
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              {searchQuery ? "Try a different search term" : "Your course documents will appear here"}
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

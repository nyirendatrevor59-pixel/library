import React, { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES } from "@/lib/sampleData";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const CATEGORIES = [
  "All",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Business",
  "Literature",
];

export default function CourseSelectionScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { selectCourses } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const filteredCourses = AVAILABLE_COURSES.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId],
    );
  };

  const handleContinue = async () => {
    await selectCourses(selectedCourseIds);
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const renderCourseItem = ({
    item,
  }: {
    item: (typeof AVAILABLE_COURSES)[0];
  }) => {
    const isSelected = selectedCourseIds.includes(item.id);
    return (
      <Pressable
        style={[
          styles.courseCard,
          { backgroundColor: theme.backgroundDefault },
          isSelected && { borderColor: AppColors.primary, borderWidth: 2 },
        ]}
        onPress={() => toggleCourse(item.id)}
      >
        <View style={styles.courseInfo}>
          <View style={styles.courseHeader}>
            <View
              style={[
                styles.courseCodeBadge,
                { backgroundColor: AppColors.primary + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: AppColors.primary, fontWeight: "600" }}
              >
                {item.code}
              </ThemedText>
            </View>
          </View>
          <ThemedText type="h4" style={styles.courseName}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.lecturerName}
          </ThemedText>
        </View>
        <View
          style={[
            styles.checkbox,
            { borderColor: isSelected ? AppColors.primary : theme.border },
            isSelected && { backgroundColor: AppColors.primary },
          ]}
        >
          {isSelected ? <Feather name="check" size={16} color="#FFF" /> : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.searchContainer,
          { paddingTop: headerHeight + Spacing.lg },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search courses..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === item
                      ? AppColors.primary
                      : theme.backgroundDefault,
                },
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <ThemedText
                type="small"
                style={{
                  color: selectedCategory === item ? "#FFF" : theme.text,
                }}
              >
                {item}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.courseList,
          { paddingBottom: insets.bottom + 100 },
        ]}
        renderItem={renderCourseItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={theme.textSecondary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
            >
              No courses found
            </ThemedText>
          </View>
        }
      />

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + Spacing.lg,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {selectedCourseIds.length} course
          {selectedCourseIds.length !== 1 ? "s" : ""} selected
        </ThemedText>
        <Button
          onPress={handleContinue}
          disabled={selectedCourseIds.length === 0}
          style={styles.continueButton}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
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
  categoryList: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  courseList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  courseInfo: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  courseCodeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  courseName: {
    marginBottom: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  continueButton: {
    paddingHorizontal: Spacing["3xl"],
  },
});

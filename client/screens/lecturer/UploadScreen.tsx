import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES } from "@/lib/sampleData";

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showCourseSelector, setShowCourseSelector] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        if (!title) {
          setTitle(result.assets[0].name.replace(/\.[^/.]+$/, ""));
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !selectedCourse) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      Alert.alert("Success", "Your notes have been uploaded successfully!", [
        {
          text: "OK",
          onPress: () => {
            setSelectedFile(null);
            setTitle("");
            setDescription("");
            setSelectedCourse("");
          },
        },
      ]);
    }, 2000);
  };

  const selectedCourseName = AVAILABLE_COURSES.find((c) => c.id === selectedCourse)?.name;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerHeight + Spacing.xl, paddingBottom: tabBarHeight + Spacing.xl },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.header}>
        <ThemedText type="h2">Upload Material</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Share course materials with your students
        </ThemedText>
      </View>

      <Pressable
        style={[
          styles.fileUploadArea,
          { backgroundColor: theme.backgroundDefault, borderColor: selectedFile ? AppColors.success : theme.border },
        ]}
        onPress={handlePickDocument}
      >
        {selectedFile ? (
          <View style={styles.selectedFile}>
            <View style={[styles.fileTypeIcon, { backgroundColor: AppColors.success + "20" }]}>
              <Feather name="check-circle" size={24} color={AppColors.success} />
            </View>
            <View style={styles.fileDetails}>
              <ThemedText type="body" style={{ fontWeight: "500" }} numberOfLines={1}>
                {selectedFile.name}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {((selectedFile.size || 0) / 1024 / 1024).toFixed(2)} MB
              </ThemedText>
            </View>
            <Pressable onPress={() => setSelectedFile(null)}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.uploadIcon, { backgroundColor: AppColors.primary + "20" }]}>
              <Feather name="upload-cloud" size={32} color={AppColors.primary} />
            </View>
            <ThemedText type="body" style={{ fontWeight: "500" }}>Tap to select file</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              PDF or Word documents up to 50MB
            </ThemedText>
          </>
        )}
      </Pressable>

      <View style={styles.formSection}>
        <ThemedText type="body" style={styles.label}>Title *</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
          placeholder="Enter document title"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.formSection}>
        <ThemedText type="body" style={styles.label}>Course *</ThemedText>
        <Pressable
          style={[styles.selector, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          onPress={() => setShowCourseSelector(!showCourseSelector)}
        >
          <ThemedText type="body" style={{ color: selectedCourseName ? theme.text : theme.textSecondary }}>
            {selectedCourseName || "Select a course"}
          </ThemedText>
          <Feather name={showCourseSelector ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
        </Pressable>
        {showCourseSelector ? (
          <View style={[styles.courseList, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            {AVAILABLE_COURSES.map((course) => (
              <Pressable
                key={course.id}
                style={[styles.courseOption, selectedCourse === course.id && { backgroundColor: AppColors.primary + "15" }]}
                onPress={() => {
                  setSelectedCourse(course.id);
                  setShowCourseSelector(false);
                }}
              >
                <ThemedText type="body">{course.name}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>{course.code}</ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.formSection}>
        <ThemedText type="body" style={styles.label}>Description (Optional)</ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Add a description for this material"
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Button
        onPress={handleUpload}
        disabled={isUploading || !selectedFile || !title || !selectedCourse}
        style={styles.uploadButton}
      >
        {isUploading ? (
          <View style={styles.uploadingContent}>
            <ActivityIndicator color="#FFF" size="small" />
            <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600", marginLeft: Spacing.sm }}>
              Uploading...
            </ThemedText>
          </View>
        ) : (
          "Upload Material"
        )}
      </Button>
    </KeyboardAwareScrollViewCompat>
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
  header: {
    gap: Spacing.xs,
  },
  fileUploadArea: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  selectedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    width: "100%",
  },
  fileTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  fileDetails: {
    flex: 1,
  },
  formSection: {
    gap: Spacing.sm,
  },
  label: {
    fontWeight: "500",
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  courseList: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
    maxHeight: 200,
  },
  courseOption: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  uploadButton: {
    marginTop: Spacing.md,
  },
  uploadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

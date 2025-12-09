import React, { useState } from "react";
import { View, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { SAMPLE_NOTES } from "@/lib/sampleData";

type Props = NativeStackScreenProps<RootStackParamList, "DocumentViewer">;

export default function DocumentViewerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  const document = SAMPLE_NOTES.find((n) => n.id === route.params.documentId);
  const isPdf = document?.fileType === "pdf";

  const samplePdfUrl = "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.jpg";
  const sampleDocContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: #111827;
            background: #fff;
          }
          h1 { color: #2563EB; margin-bottom: 16px; }
          h2 { color: #374151; margin-top: 24px; }
          p { margin-bottom: 16px; }
          .highlight { background: #FEF3C7; padding: 2px 6px; border-radius: 4px; }
          ul { padding-left: 24px; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>${document?.title || "Document"}</h1>
        <p><strong>Course:</strong> ${document?.courseName || "N/A"}</p>
        <p><strong>Uploaded by:</strong> ${document?.uploadedBy || "N/A"}</p>
        <p><strong>Date:</strong> ${document?.uploadedAt || "N/A"}</p>
        
        <h2>Introduction</h2>
        <p>This document provides an overview of the key concepts covered in this course module. Please review the following sections carefully and take notes as needed.</p>
        
        <h2>Key Concepts</h2>
        <ul>
          <li><span class="highlight">Concept 1:</span> Understanding fundamental principles</li>
          <li><span class="highlight">Concept 2:</span> Application of theoretical knowledge</li>
          <li><span class="highlight">Concept 3:</span> Practical implementation strategies</li>
          <li><span class="highlight">Concept 4:</span> Best practices and common patterns</li>
        </ul>
        
        <h2>Learning Objectives</h2>
        <p>By the end of this module, you should be able to:</p>
        <ul>
          <li>Explain the core principles discussed in class</li>
          <li>Apply these concepts to solve practical problems</li>
          <li>Analyze different approaches and their trade-offs</li>
          <li>Design solutions using the methodologies covered</li>
        </ul>
        
        <h2>Summary</h2>
        <p>This module covers essential topics that will form the foundation for advanced study in this field. Make sure to complete all practice exercises and reach out if you have any questions.</p>
        
        <p style="margin-top: 32px; color: #6B7280; font-size: 14px;">
          Page ${currentPage} of ${totalPages}
        </p>
      </body>
    </html>
  `;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="body" style={{ fontWeight: "600" }} numberOfLines={1}>
            {route.params.title}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Page {currentPage} of {totalPages}
          </ThemedText>
        </View>
        <Pressable style={styles.headerButton}>
          <Feather name="share" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.documentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              Loading document...
            </ThemedText>
          </View>
        ) : null}
        
        <WebView
          source={{ html: sampleDocContent }}
          style={[styles.webView, isLoading && styles.hidden]}
          onLoadEnd={() => setIsLoading(false)}
          scalesPageToFit={true}
          scrollEnabled={true}
          showsVerticalScrollIndicator={true}
        />
      </View>

      <View style={[styles.toolbar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.toolbarSection}>
          <Pressable
            style={[styles.toolButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setZoom(Math.max(50, zoom - 25))}
          >
            <Feather name="zoom-out" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="small" style={styles.zoomText}>{zoom}%</ThemedText>
          <Pressable
            style={[styles.toolButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setZoom(Math.min(200, zoom + 25))}
          >
            <Feather name="zoom-in" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.toolbarSection}>
          <Pressable
            style={[styles.toolButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          >
            <Feather name="chevron-left" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={[styles.toolButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          >
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.toolbarSection}>
          <Pressable style={[styles.toolButton, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="bookmark" size={20} color={theme.text} />
          </Pressable>
          <Pressable style={[styles.toolButton, { backgroundColor: AppColors.primary }]}>
            <Feather name="download" size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  documentContainer: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  webView: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  toolbarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomText: {
    minWidth: 40,
    textAlign: "center",
  },
});

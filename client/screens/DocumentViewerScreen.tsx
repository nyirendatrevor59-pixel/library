import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { SAMPLE_NOTES } from "@/lib/sampleData";
import { API_BASE_URL } from "@/lib/api";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLive } from "@/contexts/LiveContext";

type Props = NativeStackScreenProps<RootStackParamList, "DocumentViewer">;

export default function DocumentViewerScreen({ route, navigation }: Props) {
  console.log("DocumentViewerScreen params:", route.params);

  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { liveSessions } = useLive();
  const { user } = useAuth();
  const { trackAnalytics } = useAdmin();

  // State declarations
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(12);
  const [isLoading, setIsLoading] = useState(Platform.OS !== 'web');
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [lecturerMaterial, setLecturerMaterial] = useState<any>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track document viewing
  React.useEffect(() => {
    if (user) {
      trackAnalytics('documents_viewed');
    }
  }, [user, trackAnalytics]);

  const session = route.params.sessionId ? liveSessions.find(s => s.id === route.params.sessionId) : null;
  const document = SAMPLE_NOTES.find((n) => n.id === route.params.documentId);

  const isDocumentLoading = isLoading || isLoadingMaterial;

  // Update currentPage when session changes (real-time updates)
  useEffect(() => {
    if (session?.currentPage) {
      setCurrentPage(session.currentPage);
    }
  }, [session?.currentPage]);

  const decodedContent = lecturerMaterial?.content ? (() => {
    try {
      return atob(lecturerMaterial.content);
    } catch (e) {
      console.error('Failed to decode content:', e);
      return lecturerMaterial.content; // fallback
    }
  })() : null;

  useEffect(() => {
    if (!document) {
      setIsLoadingMaterial(true);
      setError(null);
      // Try to find in lecturer materials
      fetch(`${API_BASE_URL}/api/materials`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(async (materials) => {
          const material = materials.find((m: any) => String(m.id) === route.params.documentId);
          if (material) {
            setLecturerMaterial(material);
            // Fetch course name if we have courseId
            if (material.courseId) {
              try {
                const coursesRes = await fetch(`${API_BASE_URL}/api/courses`);
                if (coursesRes.ok) {
                  const courses = await coursesRes.json();
                  const course = courses.find((c: any) => c.id === material.courseId);
                  if (course) {
                    setCourseName(course.name);
                  }
                }
              } catch (courseError) {
                console.error("Failed to fetch course:", courseError);
                // Don't set main error for course fetch failure
              }
            }
          } else {
            setError("Document not found in lecturer materials");
          }
          setIsLoadingMaterial(false);
        })
        .catch(error => {
          console.error("Failed to fetch material:", error);
          setError(`Failed to load document: ${error.message}`);
          setIsLoadingMaterial(false);
        });
    } else {
      // Document found in SAMPLE_NOTES, clear any previous errors
      setError(null);
    }
  }, [route.params.documentId, document]);

  const currentDocument = document || lecturerMaterial;
  const isPdf = currentDocument?.fileType === "pdf" || currentDocument?.fileType === "application/pdf";
  const hasFileUrl = !!currentDocument?.fileUrl || !!currentDocument?.url;
  const hasContent = currentDocument?.content;
  const displayType = isPdf ? 'pdf' : (currentDocument?.fileType?.startsWith('image/') ? 'image' : (['doc', 'docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(currentDocument?.fileType || '') ? 'doc' : 'other'));

  const mimeType = currentDocument?.fileType === 'pdf' ? 'application/pdf' :
                   currentDocument?.fileType === 'doc' ? 'application/msword' :
                   currentDocument?.fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                   currentDocument?.fileType || 'application/pdf';

  const dataUri = hasContent ? `data:${mimeType};base64,${currentDocument.content}` : null;
  const pdfUrl = !dataUri && hasFileUrl ? (currentDocument.fileUrl ? `${API_BASE_URL}${currentDocument.fileUrl}` : currentDocument.url) : null;
  const sampleDocContent = currentDocument ? `
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
        <h1>${currentDocument?.title || "Document"}</h1>
        <p><strong>Course:</strong> ${currentDocument?.courseName || courseName || currentDocument?.courseId || "N/A"}</p>
        <p><strong>Uploaded by:</strong> ${currentDocument?.uploadedBy || currentDocument?.lecturerId || "N/A"}</p>
        <p><strong>Date:</strong> ${currentDocument?.uploadedAt || (currentDocument?.createdAt ? new Date(currentDocument.createdAt * 1000).toLocaleDateString() : "N/A")}</p>
        ${currentDocument?.description ? `<p><strong>Description:</strong> ${currentDocument.description}</p>` : ''}

        ${lecturerMaterial ? `
          <h2>Material Content</h2>
          ${decodedContent ? `<p>${decodedContent.replace(/\n/g, '<br>')}</p>` : hasFileUrl ? `<p><a href="${pdfUrl}" target="_blank" download>Download and view the file</a></p>` : '<p>This material contains file content that can be downloaded.</p>'}
        ` : `
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
        `}

        <p style="margin-top: 32px; color: #6B7280; font-size: 14px;">
          Page ${currentPage} of ${totalPages}
        </p>
      </body>
    </html>
  ` : `
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
          p { margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h1>Document Not Found</h1>
        <p>The requested document could not be found. Please check the document ID and try again.</p>
      </body>
    </html>
  `;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText
            type="body"
            style={{ fontWeight: "600" }}
            numberOfLines={1}
          >
            {route.params.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Page {currentPage} of {totalPages}
          </ThemedText>
        </View>
        <Pressable style={styles.headerButton} onPress={() => {
          const url = dataUri || pdfUrl;
          if (url) {
            if (Platform.OS === 'web') {
              // For web, use navigator.share if available
              if (navigator.share) {
                navigator.share({
                  title: route.params.title,
                  url: url,
                });
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(url).then(() => {
                  alert("Link copied to clipboard");
                });
              }
            } else {
              // For mobile, use Share.share
              Share.share({
                message: `${route.params.title}: ${url}`,
              });
            }
          } else {
            alert(`Share: ${route.params.title}`);
          }
        }}>
          <Feather name="share" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.documentContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#DC2626" />
            <ThemedText
              type="body"
              style={{ color: '#DC2626', marginTop: Spacing.md, textAlign: 'center' }}
            >
              {error}
            </ThemedText>
          </View>
        ) : webViewError ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#DC2626" />
            <ThemedText
              type="body"
              style={{ color: '#DC2626', marginTop: Spacing.md, textAlign: 'center' }}
            >
              {webViewError}
            </ThemedText>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}
            >
              URL: {pdfUrl || dataUri || 'N/A'}
            </ThemedText>
          </View>
        ) : isDocumentLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
            >
              Loading document...
            </ThemedText>
          </View>
        ) : null}

        {Platform.OS === 'web' ? (
          displayType === 'pdf' ? (
            pdfUrl ? (
              <iframe
                src={`${pdfUrl}#page=${currentPage}`}
                style={{
                  flex: 1,
                  border: 'none',
                  width: '100%',
                  height: '100%',
                }}
                onLoad={() => setIsLoading(false)}
              />
            ) : dataUri ? (
              <iframe
                src={dataUri}
                style={{
                  flex: 1,
                  border: 'none',
                  width: '100%',
                  height: '100%',
                }}
                onLoad={() => setIsLoading(false)}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  lineHeight: 1.6,
                  color: theme.text,
                  backgroundColor: theme.backgroundRoot,
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: sampleDocContent.replace('<html>', '').replace('</html>', '').replace('<head>', '').replace('</head>', '').replace('<body>', '').replace('</body>', '') }}
                onLoad={() => setIsLoading(false)}
              />
            )
          ) : displayType === 'image' ? (
            <img
              src={dataUri || pdfUrl || ''}
              style={{
                flex: 1,
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onLoad={() => setIsLoading(false)}
            />
          ) : displayType === 'doc' ? (
            pdfUrl ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                style={{
                  flex: 1,
                  border: 'none',
                  width: '100%',
                  height: '100%',
                }}
                onLoad={() => setIsLoading(false)}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  padding: '20px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  lineHeight: 1.6,
                  color: theme.text,
                  backgroundColor: theme.backgroundRoot,
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: sampleDocContent.replace('<html>', '').replace('</html>', '').replace('<head>', '').replace('</head>', '').replace('<body>', '').replace('</body>', '') }}
                onLoad={() => setIsLoading(false)}
              />
            )
          ) : (
            <div
              style={{
                flex: 1,
                padding: '20px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                lineHeight: 1.6,
                color: theme.text,
                backgroundColor: theme.backgroundRoot,
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: sampleDocContent.replace('<html>', '').replace('</html>', '').replace('<head>', '').replace('</head>', '').replace('<body>', '').replace('</body>', '') }}
              onLoad={() => setIsLoading(false)}
            />
          )
        ) : displayType === 'pdf' ? (
          (() => {
            console.log('Debug PDF WebView:', { displayType, dataUri, pdfUrl, hasContent, hasFileUrl, currentDocument: !!currentDocument });
            const source = dataUri ? { uri: dataUri } : pdfUrl ? { uri: `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true` } : { html: sampleDocContent };
            console.log('PDF source:', source);
            return (
              <WebView
                source={source}
                style={[styles.webView, isDocumentLoading && styles.hidden]}
                onLoadEnd={() => setIsLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                  setWebViewError('Failed to load PDF: ' + nativeEvent.description);
                  setIsLoading(false);
                }}
                scalesPageToFit={true}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
              />
            );
          })()
        ) : displayType === 'image' ? (
          <WebView
            source={{ html: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;"><img src="${dataUri || pdfUrl || ''}" style="max-width:100%;max-height:100%;object-fit:contain;" /></body></html>` }}
            style={[styles.webView, isDocumentLoading && styles.hidden]}
            onLoadEnd={() => setIsLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setWebViewError('Failed to load image: ' + nativeEvent.description);
              setIsLoading(false);
            }}
            scalesPageToFit={true}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        ) : displayType === 'doc' ? (
          <WebView
            source={pdfUrl || dataUri ? { uri: `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl || dataUri)}&embedded=true` } : { html: sampleDocContent }}
            style={[styles.webView, isDocumentLoading && styles.hidden]}
            onLoadEnd={() => setIsLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setWebViewError('Failed to load document: ' + nativeEvent.description);
              setIsLoading(false);
            }}
            scalesPageToFit={true}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <WebView
            source={pdfUrl ? { uri: `${pdfUrl}#page=${currentPage}` } : dataUri ? { uri: dataUri } : { html: sampleDocContent }}
            style={[styles.webView, isDocumentLoading && styles.hidden]}
            onLoadEnd={() => setIsLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setWebViewError('Failed to load document: ' + nativeEvent.description);
              setIsLoading(false);
            }}
            scalesPageToFit={true}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        )}
      </View>

      <View
        style={[styles.toolbar, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <View style={styles.toolbarSection}>
          <Pressable
            style={[
              styles.toolButton,
              { backgroundColor: theme.backgroundDefault },
            ]}
            onPress={() => setZoom(Math.max(50, zoom - 25))}
          >
            <Feather name="zoom-out" size={20} color={theme.text} />
          </Pressable>
          <ThemedText type="small" style={styles.zoomText}>
            {zoom}%
          </ThemedText>
          <Pressable
            style={[
              styles.toolButton,
              { backgroundColor: theme.backgroundDefault },
            ]}
            onPress={() => setZoom(Math.min(200, zoom + 25))}
          >
            <Feather name="zoom-in" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* Only show page controls if not in live session or if lecturer */}
        {(session && user?.role === 'lecturer') || !session ? (
          <View style={styles.toolbarSection}>
            <Pressable
              style={[
                styles.toolButton,
                { backgroundColor: theme.backgroundDefault },
              ]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              <Feather name="chevron-left" size={20} color={theme.text} />
            </Pressable>
            <Pressable
              style={[
                styles.toolButton,
                { backgroundColor: theme.backgroundDefault },
              ]}
              onPress={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.toolbarSection}>
          <Pressable
            style={[
              styles.toolButton,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather name="bookmark" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={[styles.toolButton, { backgroundColor: AppColors.primary }]}
            onPress={() => {
              const url = dataUri || pdfUrl;
              if (url) {
                WebBrowser.openBrowserAsync(url);
              } else {
                // For non-file documents, could implement other download logic
                Alert.alert("Download", "Download functionality for this document type is not yet implemented.");
              }
            }}
          >
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
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
  pdfContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});

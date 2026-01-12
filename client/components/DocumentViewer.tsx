import React, { useRef, useState, lazy, Suspense } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, PinchGestureHandlerGestureEvent, PinchGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';
const PdfComponent = Platform.OS === 'web' ? null : lazy(() => import('react-native-pdf'));
import Svg, { Path, Circle, Text } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, AppColors } from '@/constants/theme';
import { ThemedText } from './ThemedText';

interface DocumentViewerProps {
  document: {
    id: string;
    title: string;
    url: string;
  };
  currentPage?: number;
  annotations?: any[];
  currentTool?: string;
  currentPath?: any[];
  scrollPosition?: { top: number; left: number };
  user?: { id: string; role: string } | null;
  lecturerName?: string;
  onPageChange?: (page: number) => void;
  onAnnotationUpdate?: (annotations: any[]) => void;
  onToolChange?: (tool: string) => void;
  onCurrentPathChange?: (path: any[]) => void;
  onScrollChange?: (scrollPosition: { top: number; left: number }) => void;
  onCompressionChange?: (compressionScale: number) => void;
}

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  type: 'draw' | 'highlight' | 'text';
  path?: Point[];
  position?: Point;
  text?: string;
  color: string;
}

export default function DocumentViewer({ document, currentPage = 1, annotations: sharedAnnotations = [], currentTool, currentPath, scrollPosition, user, lecturerName, onPageChange, onAnnotationUpdate, onToolChange, onCurrentPathChange, onScrollChange, onCompressionChange }: DocumentViewerProps) {
  const { theme } = useTheme();
  const webViewRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(sharedAnnotations);
  const [localCurrentPath, setLocalCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'draw' | 'highlight' | 'text' | 'eraser'>(currentTool as 'draw' | 'highlight' | 'text' | 'eraser' || 'draw');
  const [color, setColor] = useState('#FF0000');
  const [lastTouch, setLastTouch] = useState<Point>({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [compressionScale, setCompressionScale] = useState(1);
  const [scrollMode, setScrollMode] = useState(false);

  React.useEffect(() => {
    console.log("DocumentViewer: annotations updated", sharedAnnotations);
    setAnnotations(sharedAnnotations);
  }, [sharedAnnotations]);

  React.useEffect(() => {
    if (currentTool) {
      setTool(currentTool as 'draw' | 'highlight' | 'text' | 'eraser');
    }
  }, [currentTool]);

  React.useEffect(() => {
    if (currentPath) {
      setLocalCurrentPath(currentPath);
    }
  }, [currentPath]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (scrollPosition && iframeRef.current && Platform.OS === 'web') {
      iframeRef.current.scrollTop = scrollPosition.top;
      iframeRef.current.scrollLeft = scrollPosition.left;
    }
  }, [scrollPosition]);

  const onPinchGestureEvent = (event: PinchGestureHandlerGestureEvent) => {
    const { scale } = event.nativeEvent;
    const newZoomScale = Math.max(0.5, Math.min(3, scale));
    setZoomScale(newZoomScale);
    // Adjust compression based on zoom level - higher zoom = more compression
    const newCompressionScale = Math.max(0.1, Math.min(1, 2 - newZoomScale));
    setCompressionScale(newCompressionScale);
    onCompressionChange?.(newCompressionScale);
  };

  const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      setIsZooming(false);
    } else if (event.nativeEvent.state === State.BEGAN) {
      setIsZooming(true);
    }
  };

  const onPanGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;
    if (isZooming) {
      setPanOffset({ x: translationX, y: translationY });
    } else if (scrollMode) {
      // In scroll mode, pan the document
      setPanOffset(prev => ({
        x: prev.x + translationX,
        y: prev.y + translationY
      }));
    } else {
      const { x, y } = event.nativeEvent;
      setLastTouch({ x, y });
      if (!isDrawing) return;
      setLocalCurrentPath(prev => [...prev, { x: x / zoomScale - panOffset.x, y: y / zoomScale - panOffset.y }]);
    }
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.END) {
      if (localCurrentPath.length > 0 && tool !== 'eraser') {
        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}`,
          type: tool as 'draw' | 'highlight',
          path: localCurrentPath,
          color,
        };

        const updatedAnnotations = [...annotations, newAnnotation];
        setAnnotations(updatedAnnotations);
        onAnnotationUpdate?.(updatedAnnotations);
        setLocalCurrentPath([]);
        setIsDrawing(false);
      } else if (tool === 'text') {
        addTextAnnotation(lastTouch.x, lastTouch.y);
        setTool('draw');
      } else if (tool === 'eraser') {
        eraseAnnotation(lastTouch.x, lastTouch.y);
      }
    } else if (event.nativeEvent.state === State.BEGAN) {
      if (tool !== 'text' && tool !== 'eraser') {
        setIsDrawing(true);
        setLocalCurrentPath([]);
      }
    }
  };

  const addTextAnnotation = (x: number, y: number) => {
    const newAnnotation: Annotation = {
      id: `text-${Date.now()}`,
      type: 'text',
      position: { x, y },
      text: 'Sample text',
      color,
    };

    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    onAnnotationUpdate?.(updatedAnnotations);
  };

  const clearAnnotations = () => {
    setAnnotations([]);
    onAnnotationUpdate?.([]);
  };

  const findAnnotationAt = (x: number, y: number) => {
    // Check text annotations first
    for (const ann of annotations.slice().reverse()) {
      if (ann.type === 'text' && ann.position) {
        const dist = Math.sqrt((ann.position.x - x) ** 2 + (ann.position.y - y) ** 2);
        if (dist < 20) return ann;
      }
    }
    // Check path annotations
    for (const ann of annotations.slice().reverse()) {
      if (ann.path) {
        for (const p of ann.path) {
          const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
          if (dist < 10) return ann;
        }
      }
    }
    return null;
  };

  const eraseAnnotation = (x: number, y: number) => {
    const ann = findAnnotationAt(x, y);
    if (ann) {
      const updated = annotations.filter(a => a.id !== ann.id);
      setAnnotations(updated);
      onAnnotationUpdate?.(updated);
    }
  };

  const handleMouseDown = (e: any) => {
    if (user?.role !== 'lecturer' || tool === 'eraser') return;
    setIsDrawing(true);
    setLocalCurrentPath([]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.nativeEvent.pageX - rect.left;
    const y = e.nativeEvent.pageY - rect.top;
    setLocalCurrentPath(prev => {
      const newPath = [...prev, { x, y }];
      onCurrentPathChange?.(newPath);
      return newPath;
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || localCurrentPath.length === 0 || tool === 'eraser') return;
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      type: tool as 'draw' | 'highlight',
      path: localCurrentPath,
      color,
    };
    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    onAnnotationUpdate?.(updatedAnnotations);
    setLocalCurrentPath([]);
    setIsDrawing(false);
  };

  const renderAnnotation = (annotation: Annotation) => {
    switch (annotation.type) {
      case 'draw':
      case 'highlight':
        if (!annotation.path) return null;
        const pathData = annotation.path
          .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
          .join(' ');

        return (
          <Path
            key={annotation.id}
            d={pathData}
            stroke={annotation.color}
            strokeWidth={annotation.type === 'highlight' ? 20 : 3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={annotation.type === 'highlight' ? 0.3 : 1}
          />
        );

      case 'text':
        if (!annotation.position || !annotation.text) return null;
        return (
          <Text
            key={annotation.id}
            x={annotation.position.x}
            y={annotation.position.y}
            fill={annotation.color}
            fontSize={16}
          >
            {annotation.text}
          </Text>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.backgroundSecondary }]}>
        {/* Compression Indicator */}
        <View style={styles.compressionIndicator}>
          <ThemedText style={styles.compressionText}>
            Video Compression: {Math.round(compressionScale * 100)}% | Mode: {scrollMode ? 'Scroll' : 'Draw'}
          </ThemedText>
        </View>
        {user?.role === 'lecturer' && (
          <View style={styles.pageControls}>
            <Pressable
              style={styles.pageButton}
              onPress={() => onPageChange?.(Math.max(1, currentPage - 1))}
            >
              <Feather name="chevron-left" size={20} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.pageText}>Page {currentPage}</ThemedText>
            <Pressable
              style={styles.pageButton}
              onPress={() => onPageChange?.(currentPage + 1)}
            >
              <Feather name="chevron-right" size={20} color={theme.text} />
            </Pressable>
          </View>
        )}

        {user?.role === 'lecturer' && (
          <View style={styles.tools}>
            <Pressable
              style={[styles.toolButton, scrollMode && { backgroundColor: AppColors.primary }]}
              onPress={() => {
                console.log("Scroll mode toggled:", !scrollMode);
                setScrollMode(!scrollMode);
              }}
            >
              <Feather name="move" size={20} color={scrollMode ? '#FFF' : theme.text} />
            </Pressable>

            <Pressable
              style={[styles.toolButton, tool === 'draw' && { backgroundColor: AppColors.primary }]}
              onPress={() => { setTool('draw'); onToolChange?.('draw'); setScrollMode(false); }}
            >
              <Feather name="edit-3" size={20} color={tool === 'draw' ? '#FFF' : theme.text} />
            </Pressable>

            <Pressable
              style={[styles.toolButton, tool === 'highlight' && { backgroundColor: AppColors.primary }]}
              onPress={() => { setTool('highlight'); onToolChange?.('highlight'); setScrollMode(false); }}
            >
              <Feather name="minus" size={20} color={tool === 'highlight' ? '#FFF' : theme.text} />
            </Pressable>

            <Pressable
              style={[styles.toolButton, tool === 'text' && { backgroundColor: AppColors.primary }]}
              onPress={() => { setTool('text'); onToolChange?.('text'); setScrollMode(false); }}
            >
              <Feather name="type" size={20} color={tool === 'text' ? '#FFF' : theme.text} />
            </Pressable>

            <Pressable
              style={[styles.toolButton, tool === 'eraser' && { backgroundColor: AppColors.primary }]}
              onPress={() => { setTool('eraser'); onToolChange?.('eraser'); setScrollMode(false); }}
            >
              <Feather name="minus-circle" size={20} color={tool === 'eraser' ? '#FFF' : theme.text} />
            </Pressable>
          </View>
        )}

        {user?.role === 'lecturer' && (
          <View style={styles.colors}>
            {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'].map(colorOption => (
              <Pressable
                key={colorOption}
                style={[styles.colorButton, { backgroundColor: colorOption }, color === colorOption && styles.selectedColor]}
                onPress={() => setColor(colorOption)}
              />
            ))}
          </View>
        )}

        {user?.role === 'lecturer' && (
          <Pressable style={styles.clearButton} onPress={clearAnnotations}>
            <Feather name="trash-2" size={20} color={theme.text} />
          </Pressable>
        )}
      </View>

      {/* Document Viewer */}
      <View style={styles.viewer}>
        {/* Static Video Element on Left */}
        <View style={styles.staticVideoContainer}>
          <View style={styles.staticVideo}>
            <Feather name="video" size={32} color="#FFF" />
            <ThemedText style={styles.staticVideoText}>{lecturerName || 'Lecturer'}</ThemedText>
          </View>
        </View>

        {/* Document Container */}
        <View style={styles.documentContainer}>
          {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            src={`${document.url}#page=${currentPage}`}
            style={{ flex: 1, border: 'none' }}
            title={document.title}
            onScroll={(e) => {
              if (onScrollChange) {
                const target = e.target as HTMLIFrameElement;
                onScrollChange({ top: target.scrollTop, left: target.scrollLeft });
              }
            }}
          />
        ) : (
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <View style={styles.gestureContainer}>
              <PanGestureHandler
                onGestureEvent={onPanGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
              >
                <View style={styles.gestureContainer}>
                  <View
                    style={[
                      styles.zoomableContainer,
                      {
                        transform: [
                          { scale: zoomScale },
                          { translateX: panOffset.x },
                          { translateY: panOffset.y }
                        ]
                      }
                    ]}
                  >
                    {PdfComponent && <Suspense fallback={<View />}><PdfComponent
                      source={{ uri: document.url }}
                      page={currentPage}
                      style={styles.fixedWebView}
                      onLoadComplete={(numberOfPages: number, path: string, size: {height: number, width: number}) => {
                        console.log(`PDF loaded with ${numberOfPages} pages`);
                      }}
                      onPageChanged={(page: number, numberOfPages: number) => {
                        onPageChange?.(page);
                      }}
                      onError={(error: any) => {
                        console.error('PDF error:', error);
                      }}
                    /></Suspense>}
                  </View>
                </View>
              </PanGestureHandler>
            </View>
          </PinchGestureHandler>
          )}

          {/* Annotation Overlay */}
          <View style={styles.annotationOverlay}>
            <Svg style={styles.svg}>
              {annotations.map(renderAnnotation)}
              {currentPath && currentPath.length > 0 && (
                <Path
                  d={currentPath
                    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                    .join(' ')}
                  stroke={'red'}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              )}
            </Svg>
          </View>
        </View>



        {/* Interactive Overlay for Lecturers */}
        {user?.role === 'lecturer' && (
          Platform.OS === 'web' ? (
            <View
              ref={overlayRef}
              style={styles.interactiveOverlay}
              {...{ onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onClick: (e: any) => {
                const rect = overlayRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.nativeEvent.pageX - rect.left;
                const y = e.nativeEvent.pageY - rect.top;
                if (tool === 'text') {
                  addTextAnnotation(x, y);
                  setTool('draw');
                } else if (tool === 'eraser') {
                  eraseAnnotation(x, y);
                }
              } }}
            />
          ) : (
            <PanGestureHandler
              onGestureEvent={onPanGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <View style={styles.interactiveOverlay} />
            </PanGestureHandler>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  compressionIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  compressionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pageButton: {
    padding: Spacing.sm,
  },
  pageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tools: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toolButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  colors: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginLeft: Spacing.md,
  },
  colorButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#000',
  },
  clearButton: {
    marginLeft: 'auto',
    padding: Spacing.sm,
  },
  viewer: {
    flex: 1,
    flexDirection: 'row',
  },
  staticVideoContainer: {
    width: 120,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  staticVideo: {
    width: 100,
    height: 75,
    backgroundColor: '#333',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  staticVideoText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 4,
  },
  documentContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  webView: {
    flex: 1,
    minHeight: '100%',
  },
  gestureContainer: {
    flex: 1,
  },
  zoomableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedWebView: {
    width: 400,
    height: 600,
    minHeight: '100%',
  },
  annotationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    backgroundColor: 'transparent',
  },
  interactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'auto',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  svg: {
    flex: 1,
  },
});
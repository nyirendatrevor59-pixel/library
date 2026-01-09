import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Text } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, AppColors } from '@/constants/theme';

interface RecordingManagerProps {
  sessionId: string;
  isRecording: boolean;
  onRecordingStateChange: (recording: boolean) => void;
}

export default function RecordingManager({
  sessionId,
  isRecording,
  onRecordingStateChange,
}: RecordingManagerProps) {
  const { theme } = useTheme();
  const [recording, setRecording] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Audio recording permission is required to record sessions.');
        return;
      }

      // Start recording
      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      onRecordingStateChange(true);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording saved to:', uri);

        // Here you would upload the recording to your server
        // uploadRecording(sessionId, uri, recordingDuration);

        setRecording(null);
        onRecordingStateChange(false);
        setRecordingDuration(0);

        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        Alert.alert('Recording Saved', `Session recording saved (${formatDuration(recordingDuration)})`);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to save recording.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.recordButton,
          { backgroundColor: isRecording ? '#DC2626' : AppColors.primary }
        ]}
        onPress={toggleRecording}
      >
        <Feather
          name={isRecording ? "square" : "circle"}
          size={20}
          color="#FFF"
        />
      </Pressable>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <View style={styles.durationContainer}>
            <Feather name="clock" size={14} color="#DC2626" />
            <Text style={styles.durationText}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});
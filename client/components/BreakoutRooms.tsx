import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, FlatList, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, AppColors } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';

interface Attendee {
  id: string;
  name: string;
  role: 'lecturer' | 'student';
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: Attendee[];
}

interface BreakoutRoomsProps {
  attendees: Attendee[];
  onCreateRooms: (rooms: BreakoutRoom[]) => void;
  onClose: () => void;
}

export default function BreakoutRooms({ attendees, onCreateRooms, onClose }: BreakoutRoomsProps) {
  const { theme } = useTheme();
  const [numRooms, setNumRooms] = useState(2);
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const createBreakoutRooms = () => {
    if (numRooms < 2 || numRooms > 10) {
      Alert.alert('Invalid Number', 'Please select between 2 and 10 rooms.');
      return;
    }

    const students = attendees.filter(a => a.role === 'student');
    const lecturer = attendees.find(a => a.role === 'lecturer');

    // Distribute students evenly across rooms
    const newRooms: BreakoutRoom[] = [];
    for (let i = 0; i < numRooms; i++) {
      newRooms.push({
        id: `room-${i + 1}`,
        name: `Breakout Room ${i + 1}`,
        participants: [],
      });
    }

    // Add lecturer to first room
    if (lecturer) {
      newRooms[0].participants.push(lecturer);
    }

    // Distribute students
    students.forEach((student, index) => {
      const roomIndex = index % numRooms;
      newRooms[roomIndex].participants.push(student);
    });

    setRooms(newRooms);
    setIsCreating(true);
  };

  const handleConfirmRooms = () => {
    onCreateRooms(rooms);
    onClose();
  };

  const renderRoom = ({ item }: { item: BreakoutRoom }) => (
    <Card style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <ThemedText type="body" style={{ fontWeight: '600' }}>
          {item.name}
        </ThemedText>
        <View style={styles.participantCount}>
          <Feather name="users" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.participants.length}
          </ThemedText>
        </View>
      </View>
      <View style={styles.participants}>
        {item.participants.map(participant => (
          <View key={participant.id} style={styles.participant}>
            <View style={[
              styles.participantDot,
              { backgroundColor: participant.role === 'lecturer' ? AppColors.primary : AppColors.accent }
            ]} />
            <ThemedText type="small">{participant.name}</ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <Modal visible={true} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">Breakout Rooms</ThemedText>
          <View />
        </View>

        {!isCreating ? (
          <View style={styles.setup}>
            <ThemedText type="body" style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
              Create breakout rooms to divide participants into smaller discussion groups.
            </ThemedText>

            <View style={styles.roomCount}>
              <ThemedText type="body">Number of rooms:</ThemedText>
              <View style={styles.counter}>
                <Pressable
                  style={[styles.counterButton, { backgroundColor: AppColors.primary }]}
                  onPress={() => setNumRooms(Math.max(2, numRooms - 1))}
                >
                  <Feather name="minus" size={16} color="#FFF" />
                </Pressable>
                <ThemedText type="h4" style={{ marginHorizontal: Spacing.md }}>
                  {numRooms}
                </ThemedText>
                <Pressable
                  style={[styles.counterButton, { backgroundColor: AppColors.primary }]}
                  onPress={() => setNumRooms(Math.min(10, numRooms + 1))}
                >
                  <Feather name="plus" size={16} color="#FFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Feather name="users" size={20} color={theme.textSecondary} />
                <ThemedText type="body">{attendees.length} total participants</ThemedText>
              </View>
              <View style={styles.stat}>
                <Feather name="user-check" size={20} color={theme.textSecondary} />
                <ThemedText type="body">{attendees.filter(a => a.role === 'lecturer').length} lecturer</ThemedText>
              </View>
              <View style={styles.stat}>
                <Feather name="user" size={20} color={theme.textSecondary} />
                <ThemedText type="body">{attendees.filter(a => a.role === 'student').length} students</ThemedText>
              </View>
            </View>

            <Pressable
              style={[styles.createButton, { backgroundColor: AppColors.primary }]}
              onPress={createBreakoutRooms}
            >
              <Feather name="grid" size={20} color="#FFF" />
              <ThemedText type="body" style={{ color: '#FFF', fontWeight: '600' }}>
                Create Rooms
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.roomsList}>
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={renderRoom}
              contentContainerStyle={styles.roomsContent}
              ListHeaderComponent={
                <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
                  Room Distribution
                </ThemedText>
              }
            />

            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setIsCreating(false)}
              >
                <ThemedText type="body" style={{ color: theme.text }}>
                  Back
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.actionButton, { backgroundColor: AppColors.primary }]}
                onPress={handleConfirmRooms}
              >
                <ThemedText type="body" style={{ color: '#FFF', fontWeight: '600' }}>
                  Start Breakout Sessions
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  setup: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCount: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  roomsList: {
    flex: 1,
  },
  roomsContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  roomCard: {
    padding: Spacing.lg,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  participantCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  participants: {
    gap: Spacing.sm,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  participantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
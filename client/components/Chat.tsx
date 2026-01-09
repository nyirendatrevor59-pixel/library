import React, { useState } from "react";
import { View, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import type { ChatMessage } from "@/contexts/LiveContext";

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export default function Chat({ messages, onSendMessage }: ChatProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={styles.messageContainer}>
      <ThemedText type="small" style={{ fontWeight: "600", color: AppColors.primary }}>
        {item.name}
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.text }}>
        {item.message}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </ThemedText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.textSecondary}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, { backgroundColor: AppColors.primary }]}
          onPress={handleSend}
        >
          <Feather name="send" size={16} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  messagesList: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  messageContainer: {
    gap: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  input: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
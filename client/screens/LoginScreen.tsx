import React, { useState } from "react";
import { View, StyleSheet, Image, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

type Role = "student" | "lecturer";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await login(email, password, selectedRole);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[AppColors.primary, AppColors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAwareScrollViewCompat
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h1" style={styles.appName}>StudyHub</ThemedText>
          <ThemedText type="body" style={styles.tagline}>
            Your Learning Companion
          </ThemedText>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.backgroundRoot }]}>
          <ThemedText type="h3" style={styles.formTitle}>Welcome Back</ThemedText>
          
          <View style={styles.roleSelector}>
            <Pressable
              style={[
                styles.roleButton,
                selectedRole === "student" && { backgroundColor: AppColors.primary },
              ]}
              onPress={() => setSelectedRole("student")}
            >
              <Feather
                name="user"
                size={20}
                color={selectedRole === "student" ? "#FFF" : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={[
                  styles.roleText,
                  selectedRole === "student" && styles.roleTextActive,
                ]}
              >
                Student
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.roleButton,
                selectedRole === "lecturer" && { backgroundColor: AppColors.primary },
              ]}
              onPress={() => setSelectedRole("lecturer")}
            >
              <Feather
                name="briefcase"
                size={20}
                color={selectedRole === "lecturer" ? "#FFF" : theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={[
                  styles.roleText,
                  selectedRole === "lecturer" && styles.roleTextActive,
                ]}
              >
                Lecturer
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <Feather name="mail" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
              <Feather name="lock" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <Button onPress={handleLogin} disabled={isLoading || !email || !password}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              "Sign In"
            )}
          </Button>

          <ThemedText type="small" style={styles.signupText}>
            New to StudyHub? Contact your institution
          </ThemedText>
        </View>

        <ThemedText type="caption" style={styles.footerText}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </KeyboardAwareScrollViewCompat>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  appName: {
    color: "#FFF",
    marginBottom: Spacing.xs,
  },
  tagline: {
    color: "rgba(255,255,255,0.8)",
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  roleSelector: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  roleText: {
    fontWeight: "500",
  },
  roleTextActive: {
    color: "#FFF",
  },
  inputContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  signupText: {
    textAlign: "center",
    marginTop: Spacing.lg,
    opacity: 0.7,
  },
  footerText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
  },
});

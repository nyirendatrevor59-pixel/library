import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "@/contexts/AuthContext";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

import LoginScreen from "@/screens/LoginScreen";
import CourseSelectionScreen from "@/screens/CourseSelectionScreen";
import DocumentViewerScreen from "@/screens/DocumentViewerScreen";
import StudentTabNavigator from "@/navigation/StudentTabNavigator";
import LecturerTabNavigator from "@/navigation/LecturerTabNavigator";

export type RootStackParamList = {
  Login: undefined;
  CourseSelection: undefined;
  Main: undefined;
  DocumentViewer: { documentId: string; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  const isAuthenticated = !!user;
  const needsCourseSelection = user?.role === "student" && (!user.selectedCourses || user.selectedCourses.length === 0);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : needsCourseSelection ? (
        <Stack.Screen
          name="CourseSelection"
          component={CourseSelectionScreen}
          options={{ headerTitle: "Select Your Courses" }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={user?.role === "lecturer" ? LecturerTabNavigator : StudentTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

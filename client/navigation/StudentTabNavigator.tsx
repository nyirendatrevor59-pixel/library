import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import StudentHomeScreen from "@/screens/student/StudentHomeScreen";
import ClassroomScreen from "@/screens/student/ClassroomScreen";
import DocumentsScreen from "@/screens/student/DocumentsScreen";
import StudentProfileScreen from "@/screens/student/StudentProfileScreen";
import StudentRequestsScreen from "@/screens/student/StudentRequestsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";

export type StudentTabParamList = {
  HomeTab: undefined;
  ClassroomTab: undefined;
  RequestsTab: undefined;
  DocumentsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

export default function StudentTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={StudentHomeScreen}
        options={{
          title: "Home",
          headerTitle: () => <HeaderTitle title="StudyHub" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ClassroomTab"
        component={ClassroomScreen}
        options={{
          title: "Classroom",
          headerTitle: "Live Classroom",
          tabBarIcon: ({ color, size }) => (
            <Feather name="video" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="RequestsTab"
        component={StudentRequestsScreen}
        options={{
          title: "Requests",
          headerTitle: "My Requests",
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DocumentsTab"
        component={DocumentsScreen}
        options={{
          title: "Documents",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="folder" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={StudentProfileScreen}
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

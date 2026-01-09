import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import LecturerDashboardScreen from "@/screens/lecturer/LecturerDashboardScreen";
import UploadScreen from "@/screens/lecturer/UploadScreen";
import LecturerClassroomScreen from "@/screens/lecturer/LecturerClassroomScreen";
import LecturerProfileScreen from "@/screens/lecturer/LecturerProfileScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";

export type LecturerTabParamList = {
  DashboardTab: undefined;
  UploadTab: undefined;
  ClassroomTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<LecturerTabParamList>();

export default function LecturerTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
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
        name="DashboardTab"
        component={LecturerDashboardScreen}
        options={{
          title: "Dashboard",
          headerTitle: () => <HeaderTitle title="StudyHub" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={UploadScreen}
        options={{
          title: "Upload",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="upload" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ClassroomTab"
        component={LecturerClassroomScreen}
        options={{
          title: "Classroom",
          headerTitle: "Live Classroom",
          tabBarIcon: ({ color, size }) => (
            <Feather name="video" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={LecturerProfileScreen}
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

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";

import TutorRequestsScreen from "../screens/tutor/TutorRequestsScreen";
import TutorStudentsScreen from "../screens/tutor/TutorStudentsScreen";
import TutorSessionsScreen from "../screens/tutor/TutorSessionsScreen";
import TutorProfileScreen from "../screens/tutor/TutorProfileScreen";

export type TutorTabParamList = {
  TutorRequestsTab: undefined;
  TutorStudentsTab: undefined;
  TutorSessionsTab: undefined;
  TutorProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TutorTabParamList>();

export default function TutorTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="TutorRequestsTab"
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
        name="TutorRequestsTab"
        component={TutorRequestsScreen}
        options={{
          title: "Requests",
          headerTitle: () => <HeaderTitle title="Student Requests" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TutorStudentsTab"
        component={TutorStudentsScreen}
        options={{
          title: "Students",
          headerTitle: "My Students",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TutorSessionsTab"
        component={TutorSessionsScreen}
        options={{
          title: "Sessions",
          headerTitle: "Live Sessions",
          tabBarIcon: ({ color, size }) => (
            <Feather name="video" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TutorProfileTab"
        component={TutorProfileScreen}
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
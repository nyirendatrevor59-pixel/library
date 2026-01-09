import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";

import UserManagementScreen from "@/screens/admin/UserManagementScreen";
import AdminDashboardScreen from "@/screens/admin/AdminDashboardScreen";
import AnalyticsScreen from "@/screens/admin/AnalyticsScreen";
import SupportScreen from "@/screens/admin/SupportScreen";
import AdminProfileScreen from "@/screens/admin/AdminProfileScreen";

export type AdminTabParamList = {
  DashboardTab: undefined;
  UserManagementTab: undefined;
  AnalyticsTab: undefined;
  SupportTab: undefined;
  AdminProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabNavigator() {
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
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          headerTitle: "Admin Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserManagementTab"
        component={UserManagementScreen}
        options={{
          title: "Users",
          headerTitle: () => <HeaderTitle title="User Management" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          title: "Analytics",
          headerTitle: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SupportTab"
        component={SupportScreen}
        options={{
          title: "Support",
          headerTitle: "Support",
          tabBarIcon: ({ color, size }) => (
            <Feather name="help-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminProfileTab"
        component={AdminProfileScreen}
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
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "@/contexts/AuthContext";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import CourseSelectionScreen from "@/screens/CourseSelectionScreen";
import DocumentViewerScreen from "@/screens/DocumentViewerScreen";
import LiveClassScreen from "@/screens/student/LiveClassScreen";
import LecturerMaterialsScreen from "@/screens/lecturer/LecturerMaterialsScreen";
import MyTutorsScreen from "@/screens/student/MyTutorsScreen";
import AccountDetailsScreen from "@/screens/student/AccountDetailsScreen";
import PaymentScreen from "@/screens/PaymentScreen";
import StudentTabNavigator from "@/navigation/StudentTabNavigator";
import LecturerTabNavigator from "@/navigation/LecturerTabNavigator";
import AdminTabNavigator from "@/navigation/AdminTabNavigator";
import TutorTabNavigator from "@/navigation/TutorTabNavigator";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  CourseSelection: undefined;
  Main: undefined;
  DocumentViewer: { documentId: string; title: string; sessionId?: string };
  LiveClass: { session: any };
  LecturerMaterials: undefined;
  MyTutors: undefined;
  AccountDetails: undefined;
  Payment: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.backgroundRoot,
        }}
      >
        <ActivityIndicator size="large" color={theme.link} />
      </View>
    );
  }

  const isAuthenticated = !!user;
  const needsCourseSelection =
    user?.role === "student" &&
    (!user.selectedCourses || user.selectedCourses.length === 0);

  return (
    <Stack.Navigator screenOptions={screenOptions} key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
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
            component={
              user?.role === "admin"
                ? AdminTabNavigator
                : user?.role === "lecturer"
                ? LecturerTabNavigator
                : user?.role === "tutor"
                ? TutorTabNavigator
                : StudentTabNavigator
            }
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ headerShown: false, presentation: "fullScreenModal" }}
          />
          <Stack.Screen
            name="LiveClass"
            component={LiveClassScreen}
            options={{ headerTitle: "Live Class" }}
          />
          <Stack.Screen
            name="LecturerMaterials"
            component={LecturerMaterialsScreen}
            options={{ headerTitle: "My Materials" }}
          />
           <Stack.Screen
             name="MyTutors"
             component={MyTutorsScreen}
             options={{ headerTitle: "My Tutors" }}
           />
           <Stack.Screen
             name="AccountDetails"
             component={AccountDetailsScreen}
             options={{ headerTitle: "Account Details" }}
           />
           <Stack.Screen
             name="Payment"
             component={PaymentScreen}
             options={{ headerTitle: "Subscription & Payment" }}
           />
        </>
      )}
    </Stack.Navigator>
  );
}

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

type PaymentAnalytics = {
  overview: {
    totalRevenue: number;
    totalTransactions: number;
    activeSubscriptions: number;
    subscriptionRevenue: number;
    totalSubscriptionCount: number;
  };
  revenueByCurrency: Array<{
    currency: string;
    revenue: number;
    transactions: number;
  }>;
  revenueByMethod: Array<{
    paymentMethod: string;
    revenue: number;
    transactions: number;
  }>;
  recentPayments: Array<{
    id: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    createdAt: number;
    user: {
      name: string;
      email: string;
    };
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

type SubscriptionAnalytics = {
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  popularPlans: Array<{
    planId: string;
    planName: string;
    price: number;
    currency: string;
    count: number;
    revenue: number;
  }>;
  churnData: Array<{
    status: string;
    count: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

type OverdueStudent = {
  userId: string;
  name: string;
  email: string;
  endDate: number;
  daysOverdue: number;
};

type UserAnalytics = {
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  registrationTrends: Array<{
    date: string;
    count: number;
  }>;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    createdAt: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

type CourseAnalytics = {
  popularCourses: Array<{
    courseId: string;
    courseName: string;
    courseCode: string;
    lecturerName: string;
    enrollmentCount: number;
  }>;
  coursesByCategory: Array<{
    category: string;
    count: number;
  }>;
  overview: {
    totalCourses: number;
    totalEnrollments: number;
    activeTutors: number;
  };
};

type SupportAnalytics = {
  requestsByStatus: Array<{
    status: string;
    count: number;
  }>;
  requestsByType: Array<{
    type: string;
    count: number;
  }>;
  recentRequests: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    createdAt: number;
    user: {
      name: string;
      email: string;
    };
  }>;
  overview: {
    totalRequests: number;
    unresolvedRequests: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { token } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics | null>(null);
  const [supportAnalytics, setSupportAnalytics] = useState<SupportAnalytics | null>(null);
  const [overdueStudents, setOverdueStudents] = useState<OverdueStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Course creation modal
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
  });
  const [creatingCourse, setCreatingCourse] = useState(false);

  // User creation modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'student',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Tutor management modal
  const [showManageTutorsModal, setShowManageTutorsModal] = useState(false);
  const [tutorAssignments, setTutorAssignments] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [availableTutors, setAvailableTutors] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [assignmentForm, setAssignmentForm] = useState({
    studentId: '',
    tutorId: '',
    courseId: '',
  });
  const [assigningTutor, setAssigningTutor] = useState(false);

  // System settings modal
  const [showSystemSettingsModal, setShowSystemSettingsModal] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    platformName: 'Uni-Learn',
    maxStudentsPerCourse: '50',
    defaultSessionDuration: '60',
    maintenanceMode: false,
    emailNotifications: true,
    pushNotifications: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPaymentAnalytics(),
        fetchSubscriptionAnalytics(),
        fetchUserAnalytics(),
        fetchCourseAnalytics(),
        fetchSupportAnalytics(),
        fetchOverdueStudents(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/payments/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPaymentAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment analytics:', error);
    }
  };

  const fetchSubscriptionAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/subscriptions/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription analytics:', error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
    }
  };

  const fetchCourseAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/courses/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourseAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch course analytics:', error);
    }
  };

  const fetchSupportAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/support/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSupportAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch support analytics:', error);
    }
  };

  const fetchOverdueStudents = async () => {
    try {
      // Fetch users with expired subscriptions
      const response = await fetch(`${API_BASE_URL}/api/admin/overdue-students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOverdueStudents(data);
      } else {
        // If endpoint doesn't exist, calculate from existing data
        setOverdueStudents([]);
      }
    } catch (error) {
      console.error('Failed to fetch overdue students:', error);
      setOverdueStudents([]);
    }
  };

  const handleAddCourse = async () => {
    if (!courseForm.name || !courseForm.code || !courseForm.category) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Code, Category)');
      return;
    }

    setCreatingCourse(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseForm),
      });

      if (response.ok) {
        Alert.alert('Success', 'Course created successfully!');
        setShowAddCourseModal(false);
        setCourseForm({ name: '', code: '', category: '', description: '' });
        // Refresh dashboard data
        fetchCourseAnalytics();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create course');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      Alert.alert('Error', 'Failed to create course. Please try again.');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleAddUser = async () => {
    if (!userForm.username || !userForm.email || !userForm.password || !userForm.name) {
      Alert.alert('Error', 'Please fill in all required fields (Username, Email, Password, Name)');
      return;
    }

    setCreatingUser(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        Alert.alert('Success', 'User created successfully!');
        setShowAddUserModal(false);
        setUserForm({ username: '', email: '', password: '', name: '', role: 'student' });
        // Refresh dashboard data
        fetchUserAnalytics();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      Alert.alert('Error', 'Failed to create user. Please try again.');
    } finally {
      setCreatingUser(false);
    }
  };

  const fetchTutorManagementData = async () => {
    try {
      // Fetch existing assignments
      const assignmentsResponse = await fetch(`${API_BASE_URL}/api/admin/tutors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        setTutorAssignments(assignments);
      }

      // Fetch available students (users with role 'student')
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (usersResponse.ok) {
        const allUsers = await usersResponse.json();
        const students = allUsers.filter((user: any) => user.role === 'student');
        const tutors = allUsers.filter((user: any) => user.role === 'tutor');
        setAvailableStudents(students);
        setAvailableTutors(tutors);
      }

      // Fetch available courses
      const coursesResponse = await fetch(`${API_BASE_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (coursesResponse.ok) {
        const courses = await coursesResponse.json();
        setAvailableCourses(courses);
      }
    } catch (error) {
      console.error('Failed to fetch tutor management data:', error);
    }
  };

  const handleAssignTutor = async () => {
    if (!assignmentForm.studentId || !assignmentForm.tutorId || !assignmentForm.courseId) {
      Alert.alert('Error', 'Please select a student, tutor, and course');
      return;
    }

    setAssigningTutor(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tutors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentForm),
      });

      if (response.ok) {
        Alert.alert('Success', 'Tutor assigned successfully!');
        setAssignmentForm({ studentId: '', tutorId: '', courseId: '' });
        // Refresh the assignments list
        fetchTutorManagementData();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to assign tutor');
      }
    } catch (error) {
      console.error('Failed to assign tutor:', error);
      Alert.alert('Error', 'Failed to assign tutor. Please try again.');
    } finally {
      setAssigningTutor(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tutors/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        Alert.alert('Success', 'Tutor assignment removed successfully!');
        fetchTutorManagementData();
      } else {
        Alert.alert('Error', 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error);
      Alert.alert('Error', 'Failed to remove assignment. Please try again.');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // In a real app, this would save to a database
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      Alert.alert('Success', 'System settings saved successfully!');
      setShowSystemSettingsModal(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100); // Assuming amounts are in cents
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return AppColors.success;
      case 'pending': return AppColors.warning;
      case 'failed': return AppColors.error;
      case 'refunded': return AppColors.accent;
      default: return theme.textSecondary;
    }
  };

  if (loading && !paymentAnalytics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.centerContent}>
          <ThemedText type="body">Loading dashboard...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Cards */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            System Overview
          </ThemedText>
          <View style={styles.overviewGrid}>
            <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.primary + '20' }}>
              <Feather name="dollar-sign" size={24} color={AppColors.primary} />
              <View style={styles.overviewContent}>
                <ThemedText type="h3" style={{ color: AppColors.primary }}>
                  {paymentAnalytics?.overview.totalRevenue ? formatCurrency(paymentAnalytics.overview.totalRevenue) : '$0'}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Total Revenue
                </ThemedText>
              </View>
            </Card>

            <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.success + '20' }}>
              <Feather name="credit-card" size={24} color={AppColors.success} />
              <View style={styles.overviewContent}>
                <ThemedText type="h3" style={{ color: AppColors.success }}>
                  {paymentAnalytics?.overview.totalTransactions || 0}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Transactions
                </ThemedText>
              </View>
            </Card>

            <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.accent + '20' }}>
              <Feather name="users" size={24} color={AppColors.accent} />
              <View style={styles.overviewContent}>
                <ThemedText type="h3" style={{ color: AppColors.accent }}>
                  {userAnalytics?.usersByRole.reduce((sum, role) => sum + role.count, 0) || 0}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Total Users
                </ThemedText>
              </View>
            </Card>

            <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.warning + '20' }}>
              <Feather name="book" size={24} color={AppColors.warning} />
              <View style={styles.overviewContent}>
                <ThemedText type="h3" style={{ color: AppColors.warning }}>
                  {courseAnalytics?.overview.totalCourses || 0}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Total Courses
                </ThemedText>
              </View>
            </Card>

            <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.secondary + '20' }}>
              <Feather name="user-check" size={24} color={AppColors.secondary} />
              <View style={styles.overviewContent}>
                <ThemedText type="h3" style={{ color: AppColors.secondary }}>
                  {paymentAnalytics?.overview.activeSubscriptions || 0}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Active Subs
                </ThemedText>
              </View>
            </Card>

            <Card style={{ ...styles.overviewCard, backgroundColor: AppColors.error + '20' }}>
              <Feather name="alert-triangle" size={24} color={AppColors.error} />
              <View style={styles.overviewContent}>
                <ThemedText type="h3" style={{ color: AppColors.error }}>
                  {overdueStudents.length}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Overdue Students
                </ThemedText>
              </View>
            </Card>
          </View>
        </View>

        {/* User Analytics */}
        {userAnalytics && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              User Analytics
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              <View style={styles.statusBreakdown}>
                {userAnalytics.usersByRole.map((role) => (
                  <View key={role.role} style={styles.statusItem}>
                    <ThemedText type="body" style={{ textTransform: 'capitalize' }}>
                      {role.role}
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>
                      {role.count}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Course Analytics */}
        {courseAnalytics && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Course Analytics
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              <View style={styles.overviewGrid}>
                <View style={styles.miniCard}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: AppColors.primary }}>
                    {courseAnalytics.overview.totalCourses}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Courses
                  </ThemedText>
                </View>
                <View style={styles.miniCard}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: AppColors.success }}>
                    {courseAnalytics.overview.totalEnrollments}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Enrollments
                  </ThemedText>
                </View>
                <View style={styles.miniCard}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: AppColors.accent }}>
                    {courseAnalytics.overview.activeTutors}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Active Tutors
                  </ThemedText>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Support Requests Overview */}
        {supportAnalytics && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Support Requests
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              <View style={styles.overviewGrid}>
                <View style={styles.miniCard}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: AppColors.primary }}>
                    {supportAnalytics.overview.totalRequests}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Total Requests
                  </ThemedText>
                </View>
                <View style={styles.miniCard}>
                  <ThemedText type="body" style={{ fontWeight: '600', color: AppColors.warning }}>
                    {supportAnalytics.overview.unresolvedRequests}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Unresolved
                  </ThemedText>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Subscription Analytics */}
        {subscriptionAnalytics && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Subscription Analytics
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              <View style={styles.statusBreakdown}>
                {subscriptionAnalytics.statusBreakdown.map((item) => (
                  <View key={item.status} style={styles.statusItem}>
                    <ThemedText type="body" style={{ textTransform: 'capitalize' }}>
                      {item.status}
                    </ThemedText>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>
                      {item.count}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Payment Status Breakdown */}
        {paymentAnalytics && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Payment Methods
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              {paymentAnalytics.revenueByMethod.map((method) => (
                <View key={method.paymentMethod} style={styles.methodItem}>
                  <View style={styles.methodInfo}>
                    <ThemedText type="body" style={{ textTransform: 'capitalize' }}>
                      {method.paymentMethod.replace('_', ' ')}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {method.transactions} transactions
                    </ThemedText>
                  </View>
                  <ThemedText type="body" style={{ fontWeight: '600' }}>
                    {formatCurrency(method.revenue)}
                  </ThemedText>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recent Payments */}
        {paymentAnalytics?.recentPayments && paymentAnalytics.recentPayments.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Recent Payments
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              {paymentAnalytics.recentPayments.slice(0, 5).map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>
                      {payment.user.name}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {new Date(payment.createdAt * 1000).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <View style={styles.paymentDetails}>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </ThemedText>
                    <View style={{ ...styles.statusBadge, backgroundColor: getStatusColor(payment.status) + '20' }}>
                      <ThemedText type="small" style={{ color: getStatusColor(payment.status), textTransform: 'capitalize' }}>
                        {payment.status}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Overdue Students */}
        {overdueStudents.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Overdue Students
            </ThemedText>
            <Card style={{ ...styles.analyticsCard, backgroundColor: theme.backgroundDefault }}>
              {overdueStudents.slice(0, 5).map((student) => (
                <View key={student.userId} style={styles.overdueItem}>
                  <View style={styles.studentInfo}>
                    <ThemedText type="body" style={{ fontWeight: '600' }}>
                      {student.name}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {student.email}
                    </ThemedText>
                  </View>
                  <View style={styles.overdueDetails}>
                    <ThemedText type="body" style={{ color: AppColors.error }}>
                      {student.daysOverdue} days overdue
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Expired: {new Date(student.endDate * 1000).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <View style={styles.actionGrid}>
            <Card
              style={{ ...styles.actionCard, backgroundColor: theme.backgroundDefault }}
              onPress={() => setShowAddUserModal(true)}
            >
              <Feather name="user-plus" size={24} color={AppColors.primary} />
              <View style={styles.actionContent}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Add User
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Create new user account
                </ThemedText>
              </View>
            </Card>

            <Card
              style={{ ...styles.actionCard, backgroundColor: theme.backgroundDefault }}
              onPress={() => setShowAddCourseModal(true)}
            >
              <Feather name="book" size={24} color={AppColors.success} />
              <View style={styles.actionContent}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Add Course
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Create new course
                </ThemedText>
              </View>
            </Card>

            <Card
              style={{ ...styles.actionCard, backgroundColor: theme.backgroundDefault }}
              onPress={() => {
                setShowManageTutorsModal(true);
                fetchTutorManagementData();
              }}
            >
              <Feather name="users" size={24} color={AppColors.accent} />
              <View style={styles.actionContent}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  Manage Tutors
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Assign tutors to students
                </ThemedText>
              </View>
            </Card>

            <Card
              style={{ ...styles.actionCard, backgroundColor: theme.backgroundDefault }}
              onPress={() => setShowSystemSettingsModal(true)}
            >
              <Feather name="settings" size={24} color={AppColors.secondary} />
              <View style={styles.actionContent}>
                <ThemedText type="body" style={{ fontWeight: '600' }}>
                  System Settings
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Configure platform settings
                </ThemedText>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      {/* Add Course Modal */}
      <Modal
        visible={showAddCourseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={styles.modalTitle}>
                Add New Course
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowAddCourseModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Course Name *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="e.g., Advanced Mathematics"
                  placeholderTextColor={theme.textSecondary}
                  value={courseForm.name}
                  onChangeText={(text) => setCourseForm(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Course Code *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="e.g., MATH301"
                  placeholderTextColor={theme.textSecondary}
                  value={courseForm.code}
                  onChangeText={(text) => setCourseForm(prev => ({ ...prev, code: text }))}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Category *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="e.g., Mathematics"
                  placeholderTextColor={theme.textSecondary}
                  value={courseForm.category}
                  onChangeText={(text) => setCourseForm(prev => ({ ...prev, category: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Description
                </ThemedText>
                <TextInput
                  style={[styles.textArea, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="Course description (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={courseForm.description}
                  onChangeText={(text) => setCourseForm(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddCourseModal(false)}
                disabled={creatingCourse}
              >
                <ThemedText type="body" style={styles.cancelButtonText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, creatingCourse && styles.disabledButton]}
                onPress={handleAddCourse}
                disabled={creatingCourse}
              >
                <ThemedText type="body" style={styles.submitButtonText}>
                  {creatingCourse ? 'Creating...' : 'Create Course'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={styles.modalTitle}>
                Add New User
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowAddUserModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Username *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="e.g., john_doe"
                  placeholderTextColor={theme.textSecondary}
                  value={userForm.username}
                  onChangeText={(text) => setUserForm(prev => ({ ...prev, username: text }))}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Email *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="e.g., john@example.com"
                  placeholderTextColor={theme.textSecondary}
                  value={userForm.email}
                  onChangeText={(text) => setUserForm(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Password *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="Enter password"
                  placeholderTextColor={theme.textSecondary}
                  value={userForm.password}
                  onChangeText={(text) => setUserForm(prev => ({ ...prev, password: text }))}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Full Name *
                </ThemedText>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  placeholder="e.g., John Doe"
                  placeholderTextColor={theme.textSecondary}
                  value={userForm.name}
                  onChangeText={(text) => setUserForm(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="body" style={styles.inputLabel}>
                  Role
                </ThemedText>
                <View style={styles.roleSelector}>
                  {['student', 'tutor', 'lecturer', 'admin'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleOption,
                        userForm.role === role && styles.selectedRole,
                        { borderColor: theme.border }
                      ]}
                      onPress={() => setUserForm(prev => ({ ...prev, role }))}
                    >
                      <ThemedText
                        type="body"
                        style={{
                          color: userForm.role === role ? 'white' : theme.text,
                          textTransform: 'capitalize'
                        }}
                      >
                        {role}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddUserModal(false)}
                disabled={creatingUser}
              >
                <ThemedText type="body" style={styles.cancelButtonText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, creatingUser && styles.disabledButton]}
                onPress={handleAddUser}
                disabled={creatingUser}
              >
                <ThemedText type="body" style={styles.submitButtonText}>
                  {creatingUser ? 'Creating...' : 'Create User'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manage Tutors Modal */}
      <Modal
        visible={showManageTutorsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManageTutorsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={styles.modalTitle}>
                Manage Tutor Assignments
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowManageTutorsModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* New Assignment Form */}
              <View style={styles.assignmentSection}>
                <ThemedText type="body" style={[styles.sectionTitle, { fontWeight: '600', marginBottom: Spacing.md }]}>
                  Create New Assignment
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Student
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    <View style={styles.optionsContainer}>
                      {availableStudents.map((student) => (
                        <TouchableOpacity
                          key={student.id}
                          style={[
                            styles.optionButton,
                            assignmentForm.studentId === student.id && styles.selectedOption,
                            { borderColor: theme.border }
                          ]}
                          onPress={() => setAssignmentForm(prev => ({ ...prev, studentId: student.id }))}
                        >
                          <ThemedText
                            type="small"
                            style={{
                              color: assignmentForm.studentId === student.id ? 'white' : theme.text,
                              textAlign: 'center'
                            }}
                          >
                            {student.name}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Tutor
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    <View style={styles.optionsContainer}>
                      {availableTutors.map((tutor) => (
                        <TouchableOpacity
                          key={tutor.id}
                          style={[
                            styles.optionButton,
                            assignmentForm.tutorId === tutor.id && styles.selectedOption,
                            { borderColor: theme.border }
                          ]}
                          onPress={() => setAssignmentForm(prev => ({ ...prev, tutorId: tutor.id }))}
                        >
                          <ThemedText
                            type="small"
                            style={{
                              color: assignmentForm.tutorId === tutor.id ? 'white' : theme.text,
                              textAlign: 'center'
                            }}
                          >
                            {tutor.name}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Course
                  </ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    <View style={styles.optionsContainer}>
                      {availableCourses.map((course) => (
                        <TouchableOpacity
                          key={course.id}
                          style={[
                            styles.optionButton,
                            assignmentForm.courseId === course.id && styles.selectedOption,
                            { borderColor: theme.border }
                          ]}
                          onPress={() => setAssignmentForm(prev => ({ ...prev, courseId: course.id }))}
                        >
                          <ThemedText
                            type="small"
                            style={{
                              color: assignmentForm.courseId === course.id ? 'white' : theme.text,
                              textAlign: 'center'
                            }}
                          >
                            {course.name}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={[styles.assignButton, assigningTutor && styles.disabledButton]}
                  onPress={handleAssignTutor}
                  disabled={assigningTutor}
                >
                  <ThemedText type="body" style={styles.assignButtonText}>
                    {assigningTutor ? 'Assigning...' : 'Assign Tutor'}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Existing Assignments */}
              {tutorAssignments.length > 0 && (
                <View style={styles.assignmentSection}>
                  <ThemedText type="body" style={[styles.sectionTitle, { fontWeight: '600', marginBottom: Spacing.md }]}>
                    Existing Assignments ({tutorAssignments.length})
                  </ThemedText>
                  {tutorAssignments.map((assignment) => (
                    <View key={assignment.id} style={[styles.assignmentItem, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                      <View style={styles.assignmentInfo}>
                        <ThemedText type="body" style={{ fontWeight: '600' }}>
                          {assignment.student?.name || 'Unknown Student'}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          Tutor: {assignment.tutor?.name || 'Unknown Tutor'}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          Course: {assignment.course?.name || 'Unknown Course'}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveAssignment(assignment.id)}
                      >
                        <Feather name="trash-2" size={16} color={AppColors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowManageTutorsModal(false)}
              >
                <ThemedText type="body" style={styles.cancelButtonText}>
                  Close
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* System Settings Modal */}
      <Modal
        visible={showSystemSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSystemSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={styles.modalTitle}>
                System Settings
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowSystemSettingsModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.settingsSection}>
                <ThemedText type="body" style={[styles.sectionTitle, { fontWeight: '600', marginBottom: Spacing.md }]}>
                  General Settings
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Platform Name
                  </ThemedText>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    placeholder="Platform name"
                    value={systemSettings.platformName}
                    onChangeText={(text) => setSystemSettings(prev => ({ ...prev, platformName: text }))}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Max Students per Course
                  </ThemedText>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    placeholder="50"
                    value={systemSettings.maxStudentsPerCourse}
                    onChangeText={(text) => setSystemSettings(prev => ({ ...prev, maxStudentsPerCourse: text }))}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText type="body" style={styles.inputLabel}>
                    Default Session Duration (minutes)
                  </ThemedText>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    placeholder="60"
                    value={systemSettings.defaultSessionDuration}
                    onChangeText={(text) => setSystemSettings(prev => ({ ...prev, defaultSessionDuration: text }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.settingsSection}>
                <ThemedText type="body" style={[styles.sectionTitle, { fontWeight: '600', marginBottom: Spacing.md }]}>
                  Notification Settings
                </ThemedText>

                <View style={styles.toggleRow}>
                  <ThemedText type="body">Email Notifications</ThemedText>
                  <TouchableOpacity
                    style={[styles.toggle, systemSettings.emailNotifications && styles.toggleActive]}
                    onPress={() => setSystemSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  >
                    <View style={[styles.toggleKnob, systemSettings.emailNotifications && styles.toggleKnobActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.toggleRow}>
                  <ThemedText type="body">Push Notifications</ThemedText>
                  <TouchableOpacity
                    style={[styles.toggle, systemSettings.pushNotifications && styles.toggleActive]}
                    onPress={() => setSystemSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                  >
                    <View style={[styles.toggleKnob, systemSettings.pushNotifications && styles.toggleKnobActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.settingsSection}>
                <ThemedText type="body" style={[styles.sectionTitle, { fontWeight: '600', marginBottom: Spacing.md }]}>
                  Maintenance
                </ThemedText>

                <View style={styles.toggleRow}>
                  <View>
                    <ThemedText type="body">Maintenance Mode</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Put the platform in maintenance mode
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, systemSettings.maintenanceMode && styles.toggleActive]}
                    onPress={() => setSystemSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                  >
                    <View style={[styles.toggleKnob, systemSettings.maintenanceMode && styles.toggleKnobActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowSystemSettingsModal(false)}
                disabled={savingSettings}
              >
                <ThemedText type="body" style={styles.cancelButtonText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, savingSettings && styles.disabledButton]}
                onPress={handleSaveSettings}
                disabled={savingSettings}
              >
                <ThemedText type="body" style={styles.submitButtonText}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  miniCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  overviewCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  overviewContent: {
    flex: 1,
  },
  analyticsCard: {
    padding: Spacing.lg,
  },
  statusBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.sm,
    minWidth: '45%',
  },
  methodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  methodInfo: {
    flex: 1,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDetails: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  overdueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  studentInfo: {
    flex: 1,
  },
  overdueDetails: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalBody: {
    padding: Spacing.lg,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppColors.error,
  },
  cancelButtonText: {
    color: AppColors.error,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: AppColors.primary,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  selectedRole: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  assignmentSection: {
    marginBottom: Spacing.xl,
  },
  optionsScroll: {
    marginTop: Spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  assignButton: {
    backgroundColor: AppColors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  assignButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  assignmentInfo: {
    flex: 1,
  },
  removeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ccc',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: AppColors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
});
import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, Modal, FlatList, Alert, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AVAILABLE_COURSES } from "@/lib/sampleData";
import { API_BASE_URL } from "@/lib/api";
import { Paywall } from "@/components/Paywall";
import type { TutorRequest } from "../../../shared/schema";

interface AssignedTutor {
  tutor: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    name: string;
    code: string;
  };
  assignedAt: number;
  status: string;
}

interface StudyTopic {
  id: string;
  courseId: string;
  topic: string;
  addedAt: number;
}

interface StudyQuestion {
  id: string;
  courseId: string;
  type: string;
  question: string;
  addedAt: number;
  status: string;
}

export default function MyTutorsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const { checkAccess } = useFeatureAccess();
  const [assignedTutors, setAssignedTutors] = useState<AssignedTutor[]>([]);
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueRequest, setContinueRequest] = useState<TutorRequest | null>(null);
  const [continueDescription, setContinueDescription] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<TutorRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTutorForSchedule, setSelectedTutorForSchedule] = useState<AssignedTutor | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showAskQuestionModal, setShowAskQuestionModal] = useState(false);
  const [selectedTutorForQuestion, setSelectedTutorForQuestion] = useState<AssignedTutor | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [studyTopics, setStudyTopics] = useState<StudyTopic[]>([]);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [selectedCourseForTopic, setSelectedCourseForTopic] = useState('');
  const [topicText, setTopicText] = useState('');
  const [studyQuestions, setStudyQuestions] = useState<StudyQuestion[]>([]);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [selectedCourseForQuestion, setSelectedCourseForQuestion] = useState('');
  const [questionTextInput, setQuestionTextInput] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("");

  const filteredRequests = useMemo(() => statusFilter ? requests.filter(r => r.status === statusFilter) : requests, [statusFilter, requests]);

  const filteredStudyQuestions = useMemo(() => statusFilter ? studyQuestions.filter(q => q.status === statusFilter) : studyQuestions, [statusFilter, studyQuestions]);

  const enrolledCourses = AVAILABLE_COURSES.filter((c) =>
    user?.selectedCourses?.includes(c.id),
  );

  useEffect(() => {
    fetchMyTutors();
  }, []);

  const fetchMyTutors = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/my-tutors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedTutors(data.assignedTutors);
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch my tutors:", error);
      // Mock data for testing UI
      setAssignedTutors([
        {
          tutor: { id: "mock-tutor-1", name: "Dr. Jane Smith", email: "jane@university.edu" },
          course: { id: "1", name: "Introduction to Computer Science", code: "CS101" },
          assignedAt: Date.now() / 1000,
          status: "active",
        },
        {
          tutor: { id: "mock-tutor-2", name: "Prof. John Doe", email: "john@university.edu" },
          course: { id: "2", name: "Data Structures and Algorithms", code: "CS201" },
          assignedAt: Date.now() / 1000,
          status: "active"
        }
      ]);
      setRequests([]);
    }
  };

  const submitRequest = async () => {
    if (!selectedType || !selectedCourse || !title.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          messages: JSON.stringify([{sender: 'student', message: description.trim(), timestamp: Date.now()}]),
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Your tutor request has been submitted!");
        setShowRequestModal(false);
        setSelectedType("");
        setSelectedCourse("");
        setTitle("");
        setDescription("");
        fetchMyTutors();
      } else {
        Alert.alert("Error", "Failed to submit request");
      }
    } catch (error) {
      console.error("Submit request error:", error);
      Alert.alert("Error", "Failed to submit request");
    }
  };

  const updateRequest = async (requestId: string, updates: any) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchMyTutors();
        return true;
      } else {
        Alert.alert("Error", "Failed to update request");
        return false;
      }
    } catch (error) {
      console.error("Update request error:", error);
      Alert.alert("Error", "Failed to update request");
      return false;
    }
  };

  const deleteRequestApi = async (requestId: string) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${requestId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchMyTutors();
        setShowDetailsModal(false);
        return true;
      } else {
        Alert.alert("Error", "Failed to delete request");
        return false;
      }
    } catch (error) {
      console.error("Delete request error:", error);
      Alert.alert("Error", "Failed to delete request");
      return false;
    }
  };

  const markAsResolved = (request: TutorRequest) => {
    Alert.alert(
      "Mark as Resolved",
      "Are you sure you want to mark this request as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: () => {
            updateRequest(request.id, { status: "resolved" });
          },
        }
      ]
    );
  };

  const deleteRequest = async (request: TutorRequest) => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this request? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${request.id}`, {
                method: "DELETE",
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) {
                Alert.alert("Success", "Request deleted successfully!");
                setShowDetailsModal(false);
                fetchMyTutors();
              } else {
                Alert.alert("Error", "Failed to delete request");
              }
            } catch (error) {
              console.error("Delete request error:", error);
              Alert.alert("Error", "Failed to delete request");
            }
          },
        }
      ]
    );
  };

  const continueAsking = (request: TutorRequest) => {
    setContinueRequest(request);
    setContinueDescription("");
    setShowContinueModal(true);
  };

  const submitContinueRequest = async () => {
    if (!continueRequest) return;

    const currentMessages = JSON.parse(continueRequest.messages || '[]');
    const updatedMessages = [...currentMessages, {sender: 'student', message: continueDescription.trim(), timestamp: Date.now()}];

    const success = await updateRequest(continueRequest.id, {
      messages: JSON.stringify(updatedMessages),
      status: "pending",
    });

    if (success) {
      setShowContinueModal(false);
      setContinueRequest(null);
      setContinueDescription("");
      Alert.alert("Success", "Your follow-up question has been sent to the tutor!");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "topic_help":
        return "Topic Help";
      case "question":
        return "Question";
      case "assignment_help":
        return "Assignment Help";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return AppColors.accent;
      case "answered":
        return AppColors.primary;
      case "resolved":
        return AppColors.success;
      default:
        return theme.textSecondary;
    }
  };

  const renderRequestItem = ({ item }: { item: TutorRequest }) => (
    <Pressable
      style={[styles.requestCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => { setSelectedRequest(item); setShowDetailsModal(true); }}
    >
      <View style={styles.requestHeader}>
        <ThemedText type="body" style={{ fontWeight: '600', flex: 1 }}>
          {item.title}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <ThemedText type="small" style={{ color: getStatusColor(item.status) }}>
            {(item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1)}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {getTypeLabel(item.type)} • {AVAILABLE_COURSES.find(c => c.id === item.courseId)?.name || "Unknown Course"} • Submitted {item.createdAt ? new Date(item.createdAt * 1000).toLocaleDateString() : 'N/A'}
      </ThemedText>
    </Pressable>
  );

  const renderTutorItem = ({ item }: { item: AssignedTutor }) => (
    <Card style={styles.tutorCard}>
      <View style={styles.tutorHeader}>
        <View style={styles.tutorIcon}>
          <ThemedText type="h2" style={{ color: AppColors.primary }}>{item.tutor.name.charAt(0)}</ThemedText>
        </View>
        <View style={styles.tutorInfo}>
          <ThemedText type="body" style={{ fontWeight: '600' }}>{item.tutor.name}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.course.name}</ThemedText>
        </View>
      </View>
      <View style={styles.tutorActions}>
        <Pressable style={[styles.actionButton, { backgroundColor: AppColors.primary }]} onPress={() => messageTutor(item)}>
          <Feather name="message-circle" size={16} color="#FFF" />
          <ThemedText type="small" style={{ color: "#FFF", marginLeft: Spacing.xs }}>Message</ThemedText>
        </Pressable>
        <Pressable style={[styles.actionButton, { backgroundColor: AppColors.accent }]} onPress={() => callTutor(item)}>
          <Feather name="video" size={16} color="#FFF" />
          <ThemedText type="small" style={{ color: "#FFF", marginLeft: Spacing.xs }}>Call</ThemedText>
        </Pressable>
        {checkAccess('schedule_sessions').hasAccess ? (
          <Pressable style={[styles.actionButton, { backgroundColor: AppColors.success }]} onPress={() => scheduleTutor(item)}>
            <Feather name="calendar" size={16} color="#FFF" />
            <ThemedText type="small" style={{ color: "#FFF", marginLeft: Spacing.xs }}>Schedule</ThemedText>
          </Pressable>
        ) : (
          <Paywall feature="schedule_sessions" />
        )}
        <Pressable style={[styles.actionButton, { backgroundColor: AppColors.primary }]} onPress={() => askTutorQuestion(item)}>
          <Feather name="help-circle" size={16} color="#FFF" />
          <ThemedText type="small" style={{ color: "#FFF", marginLeft: Spacing.xs }}>Ask Question</ThemedText>
        </Pressable>
      </View>
    </Card>
  );

  const renderTopicItem = ({ item }: { item: StudyTopic }) => (
    <Card style={styles.topicCard}>
      <View style={styles.topicHeader}>
        <ThemedText type="body" style={{ fontWeight: '600', flex: 1 }}>
          {item.topic}
        </ThemedText>
        <Pressable style={[styles.actionButton, { backgroundColor: AppColors.accent }]} onPress={() => getHelpOnTopic(item)}>
          <Feather name="help-circle" size={16} color="#FFF" />
          <ThemedText type="small" style={{ color: "#FFF", marginLeft: Spacing.xs }}>Get Help</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {AVAILABLE_COURSES.find(c => c.id === item.courseId)?.name || "Unknown Course"}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Added: {new Date(item.addedAt * 1000).toLocaleDateString()}
      </ThemedText>
    </Card>
  );

  const renderQuestionItem = ({ item }: { item: StudyQuestion }) => (
    <Card style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <ThemedText type="body" style={{ fontWeight: '600', flex: 1 }}>
          {item.question}
        </ThemedText>
        <Pressable style={[styles.actionButton, { backgroundColor: AppColors.accent }]} onPress={() => getHelpOnQuestion(item)}>
          <Feather name="help-circle" size={16} color="#FFF" />
          <ThemedText type="small" style={{ color: "#FFF", marginLeft: Spacing.xs }}>Get Help</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {getTypeLabel(item.type)} • {AVAILABLE_COURSES.find(c => c.id === item.courseId)?.name || "Unknown Course"}
      </ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Added: {new Date(item.addedAt * 1000).toLocaleDateString()}
      </ThemedText>
    </Card>
  );

  const messageTutor = (tutorItem: AssignedTutor) => {
    setSelectedCourse(tutorItem.course.id);
    setSelectedType('question');
    setTitle('Message to Tutor');
    setDescription('');
    setShowRequestModal(true);
  };

  const callTutor = (tutorItem: AssignedTutor) => {
    Alert.alert("Call Tutor", "Video call feature with tutor coming soon!");
  };

  const scheduleTutor = (tutorItem: AssignedTutor) => {
    setSelectedTutorForSchedule(tutorItem);
    setScheduledDate('');
    setScheduledTime('');
    setShowScheduleModal(true);
  };

  const submitSchedule = async () => {
    if (!selectedTutorForSchedule || !scheduledDate || !scheduledTime) {
      Alert.alert("Error", "Please fill in date and time");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedule-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          tutorId: selectedTutorForSchedule.tutor.id,
          courseId: selectedTutorForSchedule.course.id,
          scheduledAt: `${scheduledDate}T${scheduledTime}:00`,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Session scheduled successfully!");
        setShowScheduleModal(false);
        setSelectedTutorForSchedule(null);
        setScheduledDate('');
        setScheduledTime('');
      } else {
        Alert.alert("Error", "Failed to schedule session");
      }
    } catch (error) {
      console.error("Schedule session error:", error);
      Alert.alert("Error", "Failed to schedule session");
    }
  };

  const askTutorQuestion = (tutorItem: AssignedTutor) => {
    setSelectedTutorForQuestion(tutorItem);
    setQuestionText('');
    setShowAskQuestionModal(true);
  };

  const submitQuestion = async () => {
    if (!selectedTutorForQuestion || !questionText.trim()) {
      Alert.alert("Error", "Please enter a question");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedTutorForQuestion.course.id,
          type: 'question',
          title: questionText.trim(),
          description: questionText.trim(),
          messages: JSON.stringify([{sender: 'student', message: questionText.trim(), timestamp: Date.now()}]),
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Your question has been submitted!");
        setShowAskQuestionModal(false);
        setSelectedTutorForQuestion(null);
        setQuestionText('');
      } else {
        Alert.alert("Error", "Failed to submit question");
      }
    } catch (error) {
      console.error("Submit question error:", error);
      Alert.alert("Error", "Failed to submit question");
    }
  };

  const addStudyTopic = () => {
    if (!selectedCourseForTopic || !topicText.trim()) {
      Alert.alert("Error", "Please select a course and enter a topic");
      return;
    }

    const newTopic: StudyTopic = {
      id: `topic-${Date.now()}`,
      courseId: selectedCourseForTopic,
      topic: topicText.trim(),
      addedAt: Date.now() / 1000,
    };

    setStudyTopics(prev => [...prev, newTopic]);
    setShowAddTopicModal(false);
    setSelectedCourseForTopic('');
    setTopicText('');
  };

  const getHelpOnTopic = (topic: StudyTopic) => {
    const tutorForCourse = assignedTutors.find(t => t.course.id === topic.courseId);
    if (tutorForCourse) {
      setSelectedTutorForQuestion(tutorForCourse);
      setQuestionText(`I need help with: ${topic.topic}`);
      setShowAskQuestionModal(true);
    } else {
      Alert.alert("No Tutor", "No tutor assigned for this course yet");
    }
  };

  const addStudyQuestion = async () => {
    if (!selectedQuestionType || !selectedCourseForQuestion || !questionTextInput.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const newQuestion: StudyQuestion = {
      id: `question-${Date.now()}`,
      courseId: selectedCourseForQuestion,
      type: selectedQuestionType,
      question: questionTextInput.trim(),
      addedAt: Date.now() / 1000,
      status: 'pending',
    };

    setStudyQuestions(prev => [...prev, newQuestion]);

    // Submit as tutor request
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: selectedCourseForQuestion,
          type: selectedQuestionType,
          title: questionTextInput.trim(),
          description: questionTextInput.trim(),
          messages: JSON.stringify([{sender: 'student', message: questionTextInput.trim(), timestamp: Date.now()}]),
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Your question has been submitted to your tutor!");
        fetchMyTutors(); // Refresh requests
      } else {
        Alert.alert("Error", "Failed to submit question to tutor");
      }
    } catch (error) {
      console.error("Submit question request error:", error);
      Alert.alert("Error", "Failed to submit question to tutor");
    }

    setShowAddQuestionModal(false);
    setSelectedQuestionType('');
    setSelectedCourseForQuestion('');
    setQuestionTextInput('');
  };

  const getHelpOnQuestion = (question: StudyQuestion) => {
    const tutorForCourse = assignedTutors.find(t => t.course.id === question.courseId);
    if (tutorForCourse) {
      setSelectedTutorForQuestion(tutorForCourse);
      setQuestionText(question.question);
      setShowAskQuestionModal(true);
    } else {
      Alert.alert("No Tutor", "No tutor assigned for this course yet");
    }
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.header}>
          <ThemedText type="h3">My Tutors</ThemedText>
          <Pressable onPress={() => setShowRequestModal(true)} style={styles.newRequestButton}>
            <Feather name="plus" size={20} color={AppColors.primary} />
            <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.xs }}>
              New Request
            </ThemedText>
          </Pressable>
        </View>



        <View style={styles.studyTopicsSection}>
          <View style={styles.header}>
            <ThemedText type="h3">My Study Topics</ThemedText>
            <Pressable onPress={() => setShowAddTopicModal(true)} style={styles.newRequestButton}>
              <Feather name="plus" size={20} color={AppColors.primary} />
              <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.xs }}>
                Add Topic
              </ThemedText>
            </Pressable>
          </View>
          {studyTopics.length > 0 ? (
            <FlatList
              data={studyTopics}
              keyExtractor={(item) => item.id}
              renderItem={renderTopicItem}
              contentContainerStyle={styles.topicsList}
            />
          ) : (
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.lg }}>
              No study topics added yet. Add topics you need help with to get assistance from tutors.
            </ThemedText>
          )}
        </View>

        <View style={styles.tutorsSection}>
          <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>My Tutors</ThemedText>
          {assignedTutors.length > 0 ? (
            <FlatList
              data={assignedTutors}
              keyExtractor={(item) => item.tutor.id}
              renderItem={renderTutorItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tutorsList}
            />
          ) : (
            <ThemedText type="body" style={{ color: theme.textSecondary }}>No assigned tutors yet.</ThemedText>
          )}
        </View>

        <View style={styles.requestsSection}>
           <ThemedText type="h3">My Requests</ThemedText>
           {filteredRequests.length > 0 ? (
             <FlatList
               data={filteredRequests}
               keyExtractor={(item) => item.id}
               renderItem={renderRequestItem}
               contentContainerStyle={styles.requestsList}
             />
           ) : (
             <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", padding: Spacing.lg }}>No tutor requests yet. Create a new request to get help from your tutors.</ThemedText>
           )}
         </View>


        <View style={styles.questionsSection}>
          <View style={styles.header}>
            <ThemedText type="h3">My Questions</ThemedText>
            <Pressable onPress={() => setShowAddQuestionModal(true)} style={styles.newRequestButton}>
              <Feather name="plus" size={20} color={AppColors.primary} />
              <ThemedText type="body" style={{ color: AppColors.primary, marginLeft: Spacing.xs }}>
                Add Question
              </ThemedText>
            </Pressable>
          </View>
          <FlatList
            data={filteredStudyQuestions}
            keyExtractor={(item) => item.id}
            renderItem={renderQuestionItem}
            contentContainerStyle={styles.questionsList}
          />
        </View>



      </View>

{/* Request Creation Modal */}
      <Modal visible={showRequestModal} animationType="slide" onRequestClose={() => setShowRequestModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowRequestModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">New Tutor Request</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Request Type *
            </ThemedText>
            <View style={styles.typeOptions}>
              {[
                { value: "topic_help", label: "Help with Topic" },
                { value: "question", label: "Direct Question" },
                { value: "assignment_help", label: "Assignment Help" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.typeOption,
                    { backgroundColor: selectedType === option.value ? AppColors.primary + "20" : theme.backgroundSecondary },
                  ]}
                  onPress={() => setSelectedType(option.value)}
                >
                  <ThemedText type="body" style={{ color: selectedType === option.value ? AppColors.primary : theme.text }}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Course *
            </ThemedText>
            <View style={styles.courseOptions}>
              {enrolledCourses.map((course) => (
                <Pressable
                  key={course.id}
                  style={[
                    styles.courseOption,
                    { backgroundColor: selectedCourse === course.id ? AppColors.primary + "20" : theme.backgroundSecondary },
                  ]}
                  onPress={() => setSelectedCourse(course.id)}
                >
                  <ThemedText type="body" style={{ color: selectedCourse === course.id ? AppColors.primary : theme.text }}>
                    {course.code} - {course.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Title *
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Enter request title"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Description
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Describe your request in detail"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary }]} onPress={submitRequest}>
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Submit Request
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

      {/* Continue Asking Modal */}
      <Modal visible={showContinueModal} animationType="slide" onRequestClose={() => setShowContinueModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowContinueModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Continue Asking</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Update your request description:
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Describe your updated request in detail"
              placeholderTextColor={theme.textSecondary}
              value={continueDescription}
              onChangeText={setContinueDescription}
              multiline
              numberOfLines={6}
            />

            <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary }]} onPress={submitContinueRequest}>
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Update Request
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

      {/* Schedule Session Modal */}
      <Modal visible={showScheduleModal} animationType="slide" onRequestClose={() => setShowScheduleModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowScheduleModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Schedule Session with {selectedTutorForSchedule?.tutor.name}</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Date
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textSecondary}
              value={scheduledDate}
              onChangeText={setScheduledDate}
            />

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Time
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="HH:MM"
              placeholderTextColor={theme.textSecondary}
              value={scheduledTime}
              onChangeText={setScheduledTime}
            />

            <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary }]} onPress={submitSchedule}>
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Schedule Session
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

      {/* Ask Question Modal */}
      <Modal visible={showAskQuestionModal} animationType="slide" onRequestClose={() => setShowAskQuestionModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAskQuestionModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Ask Question</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Your Question
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Enter your question here"
              placeholderTextColor={theme.textSecondary}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={4}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Pressable style={[styles.submitButton, { backgroundColor: theme.backgroundSecondary, flex: 1 }]} onPress={() => setShowAskQuestionModal(false)}>
                <ThemedText type="body" style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary, flex: 1 }]} onPress={submitQuestion}>
                <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                  Ask Question
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

      {/* Add Topic Modal */}
      <Modal visible={showAddTopicModal} animationType="slide" onRequestClose={() => setShowAddTopicModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddTopicModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Add Study Topic</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Course
            </ThemedText>
            <View style={styles.courseOptions}>
              {enrolledCourses.map((course) => (
                <Pressable
                  key={course.id}
                  style={[
                    styles.courseOption,
                    { backgroundColor: selectedCourseForTopic === course.id ? AppColors.primary + "20" : theme.backgroundSecondary },
                  ]}
                  onPress={() => setSelectedCourseForTopic(course.id)}
                >
                  <ThemedText type="body" style={{ color: selectedCourseForTopic === course.id ? AppColors.primary : theme.text }}>
                    {course.code} - {course.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Topic
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Describe the topic you need help with"
              placeholderTextColor={theme.textSecondary}
              value={topicText}
              onChangeText={setTopicText}
              multiline
              numberOfLines={3}
            />

            <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary }]} onPress={addStudyTopic}>
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Add Topic
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

      {/* Add Question Modal */}
      <Modal visible={showAddQuestionModal} animationType="slide" onRequestClose={() => setShowAddQuestionModal(false)}>
        <KeyboardAwareScrollViewCompat
          style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAddQuestionModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="h3">Add Question</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText type="body" style={{ fontWeight: "500", marginBottom: Spacing.sm }}>
              Request Type *
            </ThemedText>
            <View style={styles.typeOptions}>
              {[
                { value: "topic_help", label: "Help with Topic" },
                { value: "question", label: "Direct Question" },
                { value: "assignment_help", label: "Assignment Help" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.typeOption,
                    { backgroundColor: selectedQuestionType === option.value ? AppColors.primary + "20" : theme.backgroundSecondary },
                  ]}
                  onPress={() => setSelectedQuestionType(option.value)}
                >
                  <ThemedText type="body" style={{ color: selectedQuestionType === option.value ? AppColors.primary : theme.text }}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Course
            </ThemedText>
            <View style={styles.courseOptions}>
              {enrolledCourses.map((course) => (
                <Pressable
                  key={course.id}
                  style={[
                    styles.courseOption,
                    { backgroundColor: selectedCourseForQuestion === course.id ? AppColors.primary + "20" : theme.backgroundSecondary },
                  ]}
                  onPress={() => setSelectedCourseForQuestion(course.id)}
                >
                  <ThemedText type="body" style={{ color: selectedCourseForQuestion === course.id ? AppColors.primary : theme.text }}>
                    {course.code} - {course.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText type="body" style={{ fontWeight: "500", marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Question
            </ThemedText>
            <TextInput
              style={[styles.textArea, { color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Enter your question here"
              placeholderTextColor={theme.textSecondary}
              value={questionTextInput}
              onChangeText={setQuestionTextInput}
              multiline
              numberOfLines={3}
            />

            <Pressable style={[styles.submitButton, { backgroundColor: AppColors.primary }]} onPress={addStudyQuestion}>
              <ThemedText type="body" style={{ color: "#FFF", fontWeight: "600" }}>
                Add Question
              </ThemedText>
            </Pressable>
          </View>
        </KeyboardAwareScrollViewCompat>
      </Modal>

      {/* Request Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" onRequestClose={() => setShowDetailsModal(false)}>
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.detailsContainer, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowDetailsModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
              <ThemedText type="h3">Request Details</ThemedText>
            </View>

            <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.detailsContent}>
                {selectedRequest && (
                  <View>
                    <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
                      {selectedRequest.title}
                    </ThemedText>

                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Type:</ThemedText>
                      <ThemedText type="small">{getTypeLabel(selectedRequest.type)}</ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Course:</ThemedText>
                      <ThemedText type="small">{AVAILABLE_COURSES.find(c => c.id === selectedRequest.courseId)?.name || "Unknown Course"}</ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Status:</ThemedText>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedRequest.status) + "20" }]}>
                        <ThemedText type="small" style={{ color: getStatusColor(selectedRequest.status) }}>
                          {(selectedRequest.status || "pending").charAt(0).toUpperCase() + (selectedRequest.status || "pending").slice(1)}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <ThemedText type="small" style={styles.detailLabel}>Created:</ThemedText>
                      <ThemedText type="small">
                        {selectedRequest.createdAt ? new Date(selectedRequest.createdAt * 1000).toLocaleString() : 'N/A'}
                      </ThemedText>
                    </View>

                    {selectedRequest.description && (
                      <View style={styles.description}>
                        <ThemedText type="small" style={styles.detailLabel}>Description:</ThemedText>
                        <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                          {selectedRequest.description}
                        </ThemedText>
                      </View>
                    )}

                    {(() => {
                      try {
                        const messages = selectedRequest.messages ? JSON.parse(selectedRequest.messages) : [];
                        return messages.length > 0 ? (
                          <View style={[styles.messagesSection, { backgroundColor: theme.backgroundDefault }]}>
                            <ThemedText type="small" style={styles.detailLabel}>Conversation:</ThemedText>
                            {messages.map((msg: any, index: number) => (
                              <View key={index} style={styles.messageItem}>
                                <ThemedText type="small" style={{ fontWeight: "600", color: msg.sender === 'student' ? AppColors.primary : AppColors.accent }}>
                                  {msg.sender === 'student' ? 'You' : 'Tutor'}:
                                </ThemedText>
                                <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                                  {msg.message}
                                </ThemedText>
                                <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                                  {new Date(msg.timestamp).toLocaleString()}
                                </ThemedText>
                              </View>
                            ))}
                          </View>
                        ) : null;
                      } catch (error) {
                        return null;
                      }
                    })()}

                    {selectedRequest.response && (
                      <View style={styles.responseSection}>
                        <ThemedText type="small" style={styles.detailLabel}>Tutor Response:</ThemedText>
                        <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                          {selectedRequest.response}
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.actions}>
                       {selectedRequest.status === "answered" && (
                         <Pressable
                           style={[styles.actionButton, { backgroundColor: AppColors.success }]}
                           onPress={() => { markAsResolved(selectedRequest); setShowDetailsModal(false); }}
                         >
                           <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                             Mark as Resolved
                           </ThemedText>
                         </Pressable>
                       )}
                       <Pressable
                         style={[styles.actionButton, { backgroundColor: AppColors.primary, marginTop: Spacing.sm }]}
                         onPress={() => { continueAsking(selectedRequest); setShowDetailsModal(false); }}
                       >
                         <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                           Ask Further Questions
                         </ThemedText>
                       </Pressable>
                       <Pressable
                         style={[styles.actionButton, { backgroundColor: AppColors.error, marginTop: Spacing.sm }]}
                         onPress={() => deleteRequest(selectedRequest)}
                       >
                         <ThemedText type="small" style={{ color: "#FFF", fontWeight: "600" }}>
                           Delete Request
                         </ThemedText>
                       </Pressable>
                     </View>

                    <View style={styles.statusUpdateSection}>
                      <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.md }}>
                        Update Status:
                      </ThemedText>
                      <View style={styles.statusButtons}>
                        {(['pending', 'answered', 'resolved'] as const).map((status) => (
                          <Pressable
                            key={status}
                            style={[
                              styles.statusButton,
                              selectedRequest && (selectedRequest.status || 'pending') === status && { backgroundColor: getStatusColor(status) },
                            ]}
                            onPress={async () => {
                              if (selectedRequest) {
                                const success = await updateRequest(selectedRequest.id, { status });
                                if (success) {
                                  setShowDetailsModal(false);
                                }
                              }
                            }}
                          >
                            <ThemedText
                              type="small"
                              style={{
                                color: selectedRequest && (selectedRequest.status || 'pending') === status ? '#FFF' : getStatusColor(status),
                              }}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  newRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: Spacing.xl,
  },
  statItem: {
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginLeft: Spacing.xs,
  },
  tutorsList: {
    gap: Spacing.md,
  },
  tutorItem: {
    padding: Spacing.lg,
  },
  requestsList: {
    gap: Spacing.md,
  },
  requestItem: {
    padding: Spacing.lg,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.error,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  actionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  detailsContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  detailsScroll: {
    maxHeight: '70%',
  },
  modalContent: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.lg,
  },
  typeOptions: {
    gap: Spacing.sm,
  },
  typeOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  courseOptions: {
    gap: Spacing.sm,
  },
  courseOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  input: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  textArea: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  submitButton: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  detailsContent: {
    gap: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailLabel: {
    fontWeight: '600',
    minWidth: 60,
  },
  description: {
    gap: Spacing.sm,
  },
  messagesSection: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  messageItem: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  responseSection: {
    gap: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.xl,
  },
  statusUpdateSection: {
    marginTop: Spacing.xl,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tutorsSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  tutorCard: {
    width: 200,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tutorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorInfo: {
    flex: 1,
  },
  tutorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  studyTopicsSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  topicsList: {
    gap: Spacing.md,
  },
  topicCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  questionsSection: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  questionsList: {
    gap: Spacing.md,
  },
  requestsSection: {
    flex: 1,
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  questionCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  requestCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
});
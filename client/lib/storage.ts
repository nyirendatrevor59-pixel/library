import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER: "@studyhub_user",
  COURSES: "@studyhub_courses",
  NOTES: "@studyhub_notes",
  STUDY_GOALS: "@studyhub_study_goals",
  TIMETABLE: "@studyhub_timetable",
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "lecturer";
  avatar?: string;
  selectedCourses?: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  lecturerName: string;
}

export interface Note {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  fileType: "pdf" | "doc" | "docx";
  fileUri: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

export interface StudyGoal {
  id: string;
  title: string;
  targetHours: number;
  completedHours: number;
  deadline: string;
}

export interface TimetableEntry {
  id: string;
  courseId: string;
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}

export const storage = {
  async getUser(): Promise<User | null> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user:", error);
    }
  },

  async getCourses(): Promise<Course[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.COURSES);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async setCourses(courses: Course[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    } catch (error) {
      console.error("Error saving courses:", error);
    }
  },

  async getNotes(): Promise<Note[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.NOTES);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async setNotes(notes: Note[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  },

  async getStudyGoals(): Promise<StudyGoal[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.STUDY_GOALS);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async setStudyGoals(goals: StudyGoal[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STUDY_GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error("Error saving study goals:", error);
    }
  },

  async getTimetable(): Promise<TimetableEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.TIMETABLE);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async setTimetable(entries: TimetableEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(entries));
    } catch (error) {
      console.error("Error saving timetable:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};

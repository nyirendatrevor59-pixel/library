import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { io, Socket } from "socket.io-client";
import { AVAILABLE_COURSES } from "@/lib/sampleData";
import { User, storage } from "@/lib/storage";
import { API_BASE_URL } from "@/lib/api";
import { LiveSession as DBSession, ChatMessage as DBMessage } from "../../shared/schema";

export interface LiveSession {
  id: string;
  topic: string;
  courseName: string;
  courseId: string;
  lecturerName: string;
  participants: number;
  isLive: boolean;
  scheduledTime?: string;
  startTime?: string;
  currentDocument?: { id: string; title: string; url: string } | null;
  currentPage?: number;
  annotations?: any[];
  currentTool?: string;
  currentPath?: Point[];
  scrollPosition?: { top: number; left: number };
  messages: ChatMessage[];
  notes: Note[];
  attendees: Attendee[];
  micStates?: Map<string, boolean>; // true = muted, false = unmuted
}

export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  message: string;
  timestamp: string;
}

export interface Note {
  id: string;
  text: string;
  timestamp: string;
  lecturerName: string;
}

export interface Attendee {
  id: string;
  name: string;
  role: 'lecturer' | 'student';
}

interface Point {
  x: number;
  y: number;
}

interface LiveContextType {
  liveSessions: LiveSession[];
  scheduledSessions: LiveSession[];
  socket: Socket | null;
  startLiveSession: (courseId: string, lecturer: User) => Promise<LiveSession>;
  scheduleLiveSession: (courseId: string, lecturer: User, scheduledTime: string) => Promise<LiveSession>;
  endLiveSession: (sessionId: string) => void;
  joinLiveSession: (sessionId: string, user: User) => void;
  leaveLiveSession: (sessionId: string) => void;
  sendMessage: (sessionId: string, message: string, user: User) => void;
  shareNote: (sessionId: string, note: string, lecturer: User) => void;
  shareDocument: (sessionId: string, document: { id: string; title: string; url: string } | null) => void;
  updateDocumentPage: (sessionId: string, page: number) => void;
  updateDocumentAnnotations: (sessionId: string, annotations: any[]) => void;
  updateDocumentTool: (sessionId: string, tool: string) => void;
  updateDocumentCurrentPath: (sessionId: string, path: any[]) => void;
  updateDocumentScroll: (sessionId: string, scrollPosition: { top: number; left: number }) => void;
  updateMicState: (sessionId: string, userId: string, muted: boolean) => void;
  fetchLiveSessions: () => Promise<void>;
  cancelScheduledSession: (sessionId: string) => Promise<void>;
}

const LiveContext = createContext<LiveContextType | undefined>(undefined);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<LiveSession[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = __DEV__ ? "http://localhost:5001" : (typeof window !== 'undefined' ? window.location.origin : "http://localhost:5001");
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Fetch initial live sessions
    fetchLiveSessions();

    // Socket event listeners
    newSocket.on("user-joined", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? {
          ...s,
          participants: s.participants + 1,
          attendees: [...s.attendees, { id: data.userId, name: data.name, role: 'student' }]
        } : s
      ));
    });

    newSocket.on("user-left", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? {
          ...s,
          participants: Math.max(0, s.participants - 1),
          attendees: s.attendees.filter(a => a.id !== data.userId)
        } : s
      ));
    });

    newSocket.on("new-message", (data) => {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        userId: data.userId,
        name: data.name,
        message: data.message,
        timestamp: data.timestamp,
      };
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, messages: [...s.messages, message] } : s
      ));
    });

    newSocket.on("note-shared", (data) => {
      const note: Note = {
        id: `note-${Date.now()}`,
        text: data.note,
        timestamp: data.timestamp,
        lecturerName: data.lecturerName,
      };
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, notes: [...s.notes, note] } : s
      ));
    });

    newSocket.on("document-shared", (data) => {
      console.log("Received document-shared event:", data);
      setLiveSessions(prev => {
        const updated = prev.map(s =>
          s.id === data.sessionId ? { ...s, currentDocument: data.document, currentPage: 1, annotations: [], currentTool: 'draw' } : s
        );
        console.log("Updated liveSessions after document-shared:", updated.find(s => s.id === data.sessionId));
        return updated;
      });
    });

    newSocket.on("document-page-update", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, currentPage: data.page } : s
      ));
    });

    newSocket.on("document-annotations-update", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, annotations: data.annotations } : s
      ));
    });

    newSocket.on("document-tool-update", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, currentTool: data.tool } : s
      ));
    });

    newSocket.on("document-current-path-update", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, currentPath: data.path } : s
      ));
    });

    newSocket.on("document-scroll-update", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, scrollPosition: data.scrollPosition } : s
      ));
    });

    newSocket.on("session-ended", (data) => {
      console.log("Session ended:", data.sessionId);
      // Remove the session from live sessions
      setLiveSessions(prev => prev.filter(s => s.id !== data.sessionId));
    });

    newSocket.on("mic-state-changed", (data) => {
      setLiveSessions(prev => prev.map(s =>
        s.id === data.sessionId ? { ...s, micStates: new Map(s.micStates || new Map()).set(data.userId, data.muted) } : s
      ));
    });

    newSocket.on("session-started", (data) => {
      console.log("Received session-started event:", data);
      console.log("Adding session to liveSessions:", data.session);
      // Add the new session directly to liveSessions
      setLiveSessions(prev => {
        const existing = prev.find(s => s.id === data.session.id);
        if (!existing) {
          console.log("Session not existing, adding:", data.session.id);
          return [...prev, data.session];
        }
        console.log("Session already exists:", data.session.id);
        return prev;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Auto-start of scheduled sessions is disabled to require lecturer permission

  // Auto-refresh live sessions every 10 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchLiveSessions();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const startLiveSession = async (courseId: string, lecturer: User): Promise<LiveSession> => {
    console.log("startLiveSession called with courseId:", courseId, "returning Promise<LiveSession>");
    const course = AVAILABLE_COURSES.find(c => c.id === courseId);
    if (!course) throw new Error('Course not found');

    // Check if there's already a live session for this course
    const existingSession = liveSessions.find(s => s.courseId === courseId && s.isLive);
    if (existingSession) {
      console.log("Live session already exists for course:", courseId);
      return existingSession;
    }

    const newSession: LiveSession = {
      id: `live-${Date.now()}`,
      topic: `${course.name} Live Session`,
      courseName: course.name,
      courseId,
      lecturerName: lecturer.name || lecturer.email.split('@')[0],
      participants: 1,
      isLive: true,
      startTime: new Date().toISOString(),
      messages: [],
      notes: [],
      attendees: [{ id: lecturer.id, name: lecturer.name || lecturer.email.split('@')[0], role: 'lecturer' }],
    };

    // Add to local state immediately
    setLiveSessions(prev => [...prev, newSession]);

    try {
      console.log("Sending to server", { courseId, lecturerId: lecturer.id, topic: newSession.topic });
      const token = await storage.getToken();
      const response = await fetch("http://localhost:5001/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          lecturerId: lecturer.id,
          topic: newSession.topic,
        }),
      });

      if (response.ok) {
        const dbSession = await response.json();
        console.log("Session created on server:", dbSession);
        // Update with server ID if successful
        setLiveSessions(prev => prev.map(s =>
          s.id === newSession.id ? { ...s, id: dbSession.id } : s
        ));
        newSession.id = dbSession.id;
        // Emit event to notify other clients
        if (socket) {
          socket.emit("session-started", { session: dbSession });
        }
      } else {
        console.warn("Server session creation failed, using local session");
      }
    } catch (error) {
      console.error("Error syncing live session with server:", error);
      // Session remains local
    }

    return newSession;
  };

  const scheduleLiveSession = async (courseId: string, lecturer: User, scheduledTime: string): Promise<LiveSession> => {
    const course = AVAILABLE_COURSES.find(c => c.id === courseId);
    if (!course) throw new Error('Course not found');

    const newSession: LiveSession = {
      id: `scheduled-${Date.now()}`,
      topic: `${course.name} Scheduled Session`,
      courseName: course.name,
      courseId,
      lecturerName: lecturer.name || lecturer.email.split('@')[0],
      participants: 0,
      isLive: false,
      scheduledTime,
      messages: [],
      notes: [],
      attendees: [{ id: lecturer.id, name: lecturer.name || lecturer.email.split('@')[0], role: 'lecturer' }],
    };

    // Add to local state immediately
    setScheduledSessions(prev => [...prev, newSession]);

    try {
      const token = await storage.getToken();
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          lecturerId: lecturer.id,
          topic: newSession.topic,
          scheduledTime,
        }),
      });

      if (response.ok) {
        const dbSession = await response.json();
        // Update with server ID if successful
        setScheduledSessions(prev => prev.map(s =>
          s.id === newSession.id ? { ...s, id: dbSession.id } : s
        ));
        newSession.id = dbSession.id;
      } else {
        console.warn("Server scheduling failed, using local session");
      }
    } catch (error) {
      console.error("Error syncing scheduled session with server:", error);
      // Session remains local
    }

    return newSession;
  };

  const endLiveSession = async (sessionId: string) => {
    try {
      const token = await storage.getToken();
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/end`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to end live session");
      }
    } catch (error) {
      console.error("Error ending live session:", error);
    }
    setLiveSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const joinLiveSession = (sessionId: string, user: User) => {
    // Check if session is still live
    const session = liveSessions.find(s => s.id === sessionId);
    if (!session || !session.isLive) {
      console.warn("Cannot join ended session:", sessionId);
      return;
    }

    if (socket) {
      socket.emit("join-live-class", {
        sessionId,
        name: user.name || user.email.split('@')[0]
      });
    }
    // Update local state optimistically
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, participants: s.participants + 1, attendees: [...s.attendees, { id: user.id, name: user.name || user.email.split('@')[0], role: 'student' }] } : s
    ));
  };

  const leaveLiveSession = (sessionId: string) => {
    if (socket) {
      socket.emit("leave-live-class", { sessionId });
    }
    // Update local state optimistically
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, participants: Math.max(0, s.participants - 1) } : s
    ));
  };

  const sendMessage = (sessionId: string, message: string, user: User) => {
    if (socket) {
      socket.emit("send-message", {
        sessionId,
        userId: user.id,
        name: user.name || user.email.split('@')[0],
        message,
        timestamp: new Date().toISOString(),
      });
    }
    // Update local state optimistically
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      name: user.name || user.email.split('@')[0],
      message,
      timestamp: new Date().toISOString(),
    };
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, messages: [...s.messages, newMessage] } : s
    ));
  };

  const shareNote = (sessionId: string, note: string, lecturer: User) => {
    if (socket) {
      socket.emit("share-note", {
        sessionId,
        lecturerName: lecturer.name || lecturer.email.split('@')[0],
        note,
        timestamp: new Date().toISOString(),
      });
    }
    // Update local state optimistically
    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: note,
      timestamp: new Date().toISOString(),
      lecturerName: lecturer.name || lecturer.email.split('@')[0],
    };
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, notes: [...s.notes, newNote] } : s
    ));
  };

  const shareDocument = async (sessionId: string, document: { id: string; title: string; url: string } | null) => {
    console.log("Sharing document:", { sessionId, document });
    if (socket) {
      socket.emit("share-document", {
        sessionId,
        document,
      });
      console.log("Emitted share-document event");
    } else {
      console.log("Socket not available");
    }
    // Update local state optimistically
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, currentDocument: document, currentPage: 1, annotations: [], currentTool: 'draw' } : s
    ));
    console.log("Updated local state with document");

    // Persist to database
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/document`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentDocument: document,
          currentPage: 1,
          annotations: [],
          currentTool: 'draw',
        }),
      });
      if (!response.ok) {
        console.error("Failed to persist document state to database");
      }
    } catch (error) {
      console.error("Error persisting document state:", error);
    }
  };

  const updateDocumentPage = async (sessionId: string, page: number) => {
    if (socket) {
      socket.emit("document-page-update", {
        sessionId,
        page,
      });
    }
    // Update local state
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, currentPage: page } : s
    ));

    // Persist to database
    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/document`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPage: page,
        }),
      });
    } catch (error) {
      console.error("Error persisting page update:", error);
    }
  };

  const updateDocumentAnnotations = async (sessionId: string, annotations: any[]) => {
    if (socket) {
      socket.emit("document-annotations-update", {
        sessionId,
        annotations,
      });
    }
    // Update local state
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, annotations } : s
    ));

    // Persist to database
    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/document`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          annotations,
        }),
      });
    } catch (error) {
      console.error("Error persisting annotations:", error);
    }
  };

  const updateDocumentTool = async (sessionId: string, tool: string) => {
    if (socket) {
      socket.emit("document-tool-update", {
        sessionId,
        tool,
      });
    }
    // Update local state
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, currentTool: tool } : s
    ));

    // Persist to database
    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/document`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentTool: tool,
        }),
      });
    } catch (error) {
      console.error("Error persisting tool update:", error);
    }
  };

  const updateDocumentCurrentPath = (sessionId: string, path: any[]) => {
    if (socket) {
      socket.emit("document-current-path-update", {
        sessionId,
        path,
      });
    }
    // Update local state (no persistence for live path)
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, currentPath: path } : s
    ));
  };

  const updateDocumentScroll = (sessionId: string, scrollPosition: { top: number; left: number }) => {
    if (socket) {
      socket.emit("document-scroll-update", {
        sessionId,
        scrollPosition,
      });
    }
    // Update local state
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, scrollPosition } : s
    ));
  };

  const updateMicState = (sessionId: string, userId: string, muted: boolean) => {
    if (socket) {
      socket.emit("mic-state-changed", {
        sessionId,
        userId,
        muted,
      });
    }
    // Update local state
    setLiveSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, micStates: new Map(s.micStates || new Map()).set(userId, muted) } : s
    ));
  };

  const fetchLiveSessions = async () => {
    try {
      console.log("Fetching live sessions from server...");
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      if (!response.ok) {
        throw new Error("Failed to fetch live sessions");
      }
      const sessions = await response.json();
      console.log("Fetched sessions:", sessions);
      // Filter live sessions (isLive: true)
      const liveOnes = sessions.filter((s: any) => s.isLive);
      console.log("Live sessions:", liveOnes);
      console.log("Current local live sessions before update:", liveSessions);
      // Map to client format
      const clientSessions: LiveSession[] = liveOnes.map((s: any) => ({
        id: s.id,
        topic: s.topic,
        courseName: AVAILABLE_COURSES.find(c => c.id === s.courseId)?.name || 'Unknown Course',
        courseId: s.courseId,
        lecturerName: s.lecturerName || 'Test Lecturer', // Ensure never unknown
        participants: s.participants || 0,
        isLive: true,
        startTime: s.startTime,
        currentDocument: s.currentDocument ? JSON.parse(s.currentDocument) : null,
        currentPage: s.currentPage || 1,
        annotations: s.annotations ? JSON.parse(s.annotations) : [],
        currentTool: s.currentTool || 'draw',
        messages: [],
        notes: [],
        attendees: [],
      }));
      console.log("Setting live sessions:", clientSessions);
      // Only update live sessions if server has data, otherwise preserve local sessions
      if (clientSessions.length > 0) {
        setLiveSessions(clientSessions);
      }

      // Filter scheduled sessions (!isLive && scheduledTime)
      const scheduledOnes = sessions.filter((s: any) => !s.isLive && s.scheduledTime);
      const clientScheduled: LiveSession[] = scheduledOnes.map((s: any) => ({
        id: s.id,
        topic: s.topic,
        courseName: AVAILABLE_COURSES.find(c => c.id === s.courseId)?.name || 'Unknown Course',
        courseId: s.courseId,
        lecturerName: s.lecturerName || 'Unknown Lecturer',
        participants: s.participants || 0,
        isLive: false,
        scheduledTime: new Date(s.scheduledTime * 1000).toISOString(), // Convert unix seconds to ISO string
        messages: [],
        attendees: [],
      }));
      setScheduledSessions(clientScheduled);
    } catch (error) {
      console.error("Error fetching live sessions:", error);
    }
  };

  const cancelScheduledSession = async (sessionId: string) => {
    try {
      const token = await storage.getToken();
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error canceling session:", error);
    }
    setScheduledSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  return (
    <LiveContext.Provider
      value={{ liveSessions, scheduledSessions, socket, startLiveSession, scheduleLiveSession, endLiveSession, joinLiveSession, leaveLiveSession, sendMessage, shareNote, shareDocument, updateDocumentPage, updateDocumentAnnotations, updateDocumentTool, updateDocumentCurrentPath, updateDocumentScroll, updateMicState, fetchLiveSessions, cancelScheduledSession }}
    >
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  const context = useContext(LiveContext);
  if (context === undefined) {
    throw new Error("useLive must be used within a LiveProvider");
  }
  return context;
}
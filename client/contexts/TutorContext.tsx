import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { TutorRequest, UserTutor, LiveSession, InsertLiveSession } from "../../shared/schema";

interface TutorContextType {
  tutorRequests: TutorRequest[];
  totalRequests: number;
  tutorAssignments: UserTutor[];
  liveSessions: LiveSession[];
  fetchTutorRequests: (page?: number, limit?: number, status?: string) => Promise<{ requests: TutorRequest[], total: number } | void>;
  fetchTutorAssignments: () => Promise<void>;
  fetchLiveSessions: () => Promise<void>;
  updateTutorRequest: (requestId: string, updates: Partial<TutorRequest>) => Promise<boolean>;
  createLiveSession: (sessionData: InsertLiveSession) => Promise<boolean>;
  updateLiveSession: (sessionId: string, updates: Partial<LiveSession>) => Promise<boolean>;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export function TutorProvider({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const [tutorRequests, setTutorRequests] = useState<TutorRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState<number>(0);
  const [tutorAssignments, setTutorAssignments] = useState<UserTutor[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  const handleApiError = (response: Response) => {
    if (response.status === 403) {
      // Token expired or invalid, but don't logout for tutor requests to avoid loops
      // logout();
      return true;
    }
    return false;
  };

  const fetchTutorRequests = async (page: number = 1, limit: number = 10, status?: string) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE_URL}/api/tutor-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('TutorContext: Fetched tutor requests:', data);
        setTutorRequests(data.requests || []);
        setTotalRequests(data.total || 0);
        return data;
      } else if (handleApiError(response)) {
        return;
      }
    } catch (error) {
      console.error('Failed to fetch tutor requests:', error);
    }
  };

  const fetchTutorAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tutors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter assignments for this tutor
        const myAssignments = data.filter((assignment: UserTutor) =>
          assignment.tutorId === user?.id
        );
        setTutorAssignments(myAssignments);
      } else if (handleApiError(response)) {
        return;
      }
    } catch (error) {
      console.error('Failed to fetch tutor assignments:', error);
    }
  };

  const fetchLiveSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter sessions hosted by this tutor
        const mySessions = data.filter((session: LiveSession) =>
          session.lecturerId === user?.id
        );
        setLiveSessions(mySessions);
      } else if (handleApiError(response)) {
        return;
      }
    } catch (error) {
      console.error('Failed to fetch live sessions:', error);
    }
  };

  const updateTutorRequest = async (requestId: string, updates: Partial<TutorRequest>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutor-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchTutorRequests();
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to update tutor request:', error);
    }
    return false;
  };

  const createLiveSession = async (sessionData: InsertLiveSession): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (response.ok) {
        await fetchLiveSessions();
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to create live session:', error);
    }
    return false;
  };

  const updateLiveSession = async (sessionId: string, updates: Partial<LiveSession>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchLiveSessions();
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to update live session:', error);
    }
    return false;
  };

  useEffect(() => {
    if (user?.role === 'tutor' && token) {
      fetchTutorAssignments();
      fetchTutorRequests();
      fetchLiveSessions();
    }
  }, [user, token]);

  return (
    <TutorContext.Provider
      value={{
        tutorRequests,
        totalRequests,
        tutorAssignments,
        liveSessions,
        fetchTutorRequests,
        fetchTutorAssignments,
        fetchLiveSessions,
        updateTutorRequest,
        createLiveSession,
        updateLiveSession,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor() {
  const context = useContext(TutorContext);
  if (context === undefined) {
    throw new Error("useTutor must be used within a TutorProvider");
  }
  return context;
}
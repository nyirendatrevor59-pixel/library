import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Alert } from "react-native";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { User, SupportRequest, UserAnalytics, UserTutor, InsertUser, InsertSupportRequest, InsertUserTutor } from "../../shared/schema";

interface Permission {
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canHandleSupport: boolean;
  canAssignTutors: boolean;
  canEditOwnProfile: boolean;
  canViewMaterials: boolean;
  canAttendSessions: boolean;
}

interface AdminContextType {
  users: User[];
  supportRequests: SupportRequest[];
  analytics: UserAnalytics[];
  tutorAssignments: UserTutor[];
  permissions: Permission;
  fetchUsers: () => Promise<void>;
  createUser: (userData: InsertUser) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
  fetchSupportRequests: () => Promise<void>;
  createSupportRequest: (request: InsertSupportRequest) => Promise<boolean>;
  updateSupportRequest: (requestId: string, updates: Partial<SupportRequest>) => Promise<boolean>;
  fetchAnalytics: () => Promise<void>;
  assignTutor: (assignment: InsertUserTutor) => Promise<boolean>;
  unassignTutor: (assignmentId: string) => Promise<boolean>;
  fetchTutorAssignments: () => Promise<void>;
  hasPermission: (permission: keyof Permission) => boolean;
  trackAnalytics: (metric: string, value?: number, userId?: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, token, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [tutorAssignments, setTutorAssignments] = useState<UserTutor[]>([]);

  const getPermissions = (role: string): Permission => {
    switch (role) {
      case 'admin':
        return {
          canManageUsers: true,
          canViewAnalytics: true,
          canHandleSupport: true,
          canAssignTutors: true,
          canEditOwnProfile: true,
          canViewMaterials: true,
          canAttendSessions: true,
        };
      case 'lecturer':
        return {
          canManageUsers: false,
          canViewAnalytics: false,
          canHandleSupport: false,
          canAssignTutors: true,
          canEditOwnProfile: true,
          canViewMaterials: true,
          canAttendSessions: true,
        };
      case 'tutor':
        return {
          canManageUsers: false,
          canViewAnalytics: false,
          canHandleSupport: true,
          canAssignTutors: false,
          canEditOwnProfile: true,
          canViewMaterials: true,
          canAttendSessions: true,
        };
      case 'student':
      default:
        return {
          canManageUsers: false,
          canViewAnalytics: false,
          canHandleSupport: false,
          canAssignTutors: false,
          canEditOwnProfile: true,
          canViewMaterials: true,
          canAttendSessions: true,
        };
    }
  };

  const permissions = getPermissions(user?.role || 'student');

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

  const handleApiError = (response: Response) => {
    if (response.status === 403) {
      // Token expired or invalid, logout
      logout();
      return true;
    }
    return false;
  };

  const fetchUsers = async () => {
    if (!hasPermission('canManageUsers') && user?.role !== 'tutor') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const createUser = async (userData: InsertUser): Promise<boolean> => {
    if (!hasPermission('canManageUsers')) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      if (response.ok) {
        await fetchUsers();
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
    return false;
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    if (!hasPermission('canManageUsers')) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchUsers();
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
    return false;
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!hasPermission('canManageUsers')) return { success: false, error: 'Permission denied' };
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        await fetchUsers();
        return { success: true };
      } else if (response.status === 400) {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      } else if (handleApiError(response)) {
        return { success: false, error: 'Authentication error' };
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
    return { success: false, error: 'Network error' };
  };

  const changePassword = async (userId: string, newPassword: string): Promise<boolean> => {
    console.log('changePassword called for userId:', userId, 'current user:', user?.id, 'hasPermission:', hasPermission('canManageUsers'));
    if (!hasPermission('canManageUsers') && userId !== user?.id) {
      console.log('Permission denied for changing password');
      return false;
    }
    try {
      console.log('Making API call to change password');
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      console.log('API response status:', response.status);
      if (response.ok) {
        console.log('Password changed successfully');
        Alert.alert('Success', 'Password changed successfully');
        return true;
      } else if (handleApiError(response)) {
        console.log('API error handled');
        return false;
      } else {
        console.log('API error not handled');
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to change password:', error);
    }
    return false;
  };

  const fetchSupportRequests = async () => {
    if (!hasPermission('canHandleSupport')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/support`);
      if (response.ok) {
        const data = await response.json();
        setSupportRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch support requests:', error);
    }
  };

  const createSupportRequest = async (request: InsertSupportRequest): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });
      if (response.ok) {
        // Track support request creation
        trackAnalytics('support_requests');
        if (hasPermission('canHandleSupport')) {
          await fetchSupportRequests();
        }
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to create support request:', error);
    }
    return false;
  };

  const updateSupportRequest = async (requestId: string, updates: Partial<SupportRequest>): Promise<boolean> => {
    if (!hasPermission('canHandleSupport')) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/support/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        await fetchSupportRequests();
        return true;
      } else if (handleApiError(response)) {
        return false;
      }
    } catch (error) {
      console.error('Failed to update support request:', error);
    }
    return false;
  };

  const fetchAnalytics = async () => {
    if (!hasPermission('canViewAnalytics')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const assignTutor = async (assignment: InsertUserTutor): Promise<boolean> => {
    if (!hasPermission('canAssignTutors')) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tutors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      if (response.ok) {
        await fetchTutorAssignments();
        return true;
      }
    } catch (error) {
      console.error('Failed to assign tutor:', error);
    }
    return false;
  };

  const unassignTutor = async (assignmentId: string): Promise<boolean> => {
    if (!hasPermission('canAssignTutors')) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tutors/${assignmentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchTutorAssignments();
        return true;
      }
    } catch (error) {
      console.error('Failed to unassign tutor:', error);
    }
    return false;
  };

  const trackAnalytics = async (metric: string, value: number = 1, userId?: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId || user?.id,
          metric,
          value,
          date: Math.floor(Date.now() / 1000),
        }),
      });
      // Don't block on analytics tracking
    } catch (error) {
      // Silently fail analytics tracking
    }
  };

  const fetchTutorAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/tutors`);
      if (response.ok) {
        const data = await response.json();
        setTutorAssignments(data);
      }
    } catch (error) {
      console.error('Failed to fetch tutor assignments:', error);
    }
  };

  useEffect(() => {
    if (user && token) {
      if (hasPermission('canManageUsers') || user.role === 'tutor') fetchUsers();
      if (hasPermission('canHandleSupport')) fetchSupportRequests();
      if (hasPermission('canViewAnalytics')) fetchAnalytics();
      fetchTutorAssignments();
    }
  }, [user, token]);

  return (
    <AdminContext.Provider
      value={{
        users,
        supportRequests,
        analytics,
        tutorAssignments,
        permissions,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        changePassword,
        fetchSupportRequests,
        createSupportRequest,
        updateSupportRequest,
        fetchAnalytics,
        assignTutor,
        unassignTutor,
        fetchTutorAssignments,
        hasPermission,
        trackAnalytics,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
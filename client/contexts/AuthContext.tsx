import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { storage, User } from "@/lib/storage";
import { queryClient } from "@/lib/query-client";
import { resetToLogin, navigationRef, navigate } from "@/lib/navigation";
import { API_BASE_URL } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    role: "student" | "lecturer",
  ) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    name: string,
    role: "student" | "lecturer",
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  selectCourses: (courseIds: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storage.getUser();
      const savedToken = await storage.getToken();
      setUser(savedUser);
      setToken(savedToken);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    role: "student" | "lecturer",
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        selectedCourses: data.user.selectedCourses || [],
        username: data.user.username,
        password: "", // Don't store password
        createdAt: data.user.createdAt,
      };

      await storage.setUser(userData);
      await storage.setToken(data.token);
      setUser(userData);
      setToken(data.token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    name: string,
    role: "student" | "lecturer",
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, name, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        selectedCourses: data.user.selectedCourses || [],
        username: data.user.username,
        password: "", // Don't store password
        createdAt: data.user.createdAt,
      };

      await storage.setUser(userData);
      await storage.setToken(data.token);
      setUser(userData);
      setToken(data.token);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logout function called');

    try {
      await storage.clearAll();
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error("Error clearing storage:", error);
    }

    // Clear all state
    console.log('Clearing user and token state');
    setUser(null);
    setToken(null);

    // Clear query client cache
    queryClient.clear();
    console.log('Query cache cleared');

    // Force navigation to login screen as backup
    setTimeout(() => {
      console.log('Forcing navigation to Login screen');
      navigate("Login");
    }, 100);

    console.log('Logout completed');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      await storage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const selectCourses = async (courseIds: string[]) => {
    if (user) {
      const updatedUser = { ...user, selectedCourses: courseIds };
      await storage.setUser(updatedUser);
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, updateUser, selectCourses }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage, User } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: "student" | "lecturer") => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  selectCourses: (courseIds: string[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storage.getUser();
      setUser(savedUser);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: "student" | "lecturer") => {
    const newUser: User = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      role,
      selectedCourses: [],
    };
    await storage.setUser(newUser);
    setUser(newUser);
  };

  const logout = async () => {
    await storage.clearAll();
    setUser(null);
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, selectCourses }}>
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

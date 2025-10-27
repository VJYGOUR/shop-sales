// utils/AuthContext.tsx
// utils/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axiosInstance from "../axios/axiosInstance";
import handleApiError from "./handleApiError";

interface User {
  id: string;
  name: string;
  email: string;
  plan: "free" | "paid";
  businessName: string;
  profileImage?: string;
  avatar?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  phoneNumber?: string;
  subscriptionExpiresAt?: Date | string; // Add this line
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user info from backend
  const refreshUser = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<{ user: User }>("/auth/me");
      setUser(res.data.user);
    } catch (err: unknown) {
      setUser(null);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Check auth on mount - only once
  useEffect(() => {
    refreshUser();
  }, []); // Empty dependency array

  // Login
  const login = async (): Promise<void> => {
    await refreshUser();
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await axiosInstance.post("/auth/logout");
      setUser(null);
    } catch (err: unknown) {
      handleApiError(err);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

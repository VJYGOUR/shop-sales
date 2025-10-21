/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useEffect, useState } from "react";

import type { ReactNode } from "react";

import axiosInstance from "../axios/axiosInstance";
import handleApiError from "./handleApiError";

interface User {
  id: string;
  name: string;
  email: string;
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

  // Check auth on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Fetch user info from backend
  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<{ user: User }>("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Login (example: after successful backend login)
  const login = async () => {
    // After login API, call refreshUser to update state
    await refreshUser();
  };

  // Logout
  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      setUser(null);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

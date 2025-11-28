import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  // console.log(user);

  // Show loading state while checking auth
  if (loading)
    return <div className="text-center mt-20">Checking authentication...</div>;

  // If not logged in, redirect to login page
  if (!user) return <Navigate to="/login" replace />;

  // If logged in, render the nested route(s)
  return <Outlet />;
};

export default ProtectedRoute;

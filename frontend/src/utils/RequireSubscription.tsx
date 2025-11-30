import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireSubscription: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You probably already have loading logic in AuthContext
    return <div className="text-center mt-20">Loading...</div>;
  }

  // 🧩 If user is not paid, redirect them to subscribe page
  if (user && user.plan === "free") {
    return <Navigate to="/billing" replace />;
  }

  // 🧩 Otherwise allow access
  return <Outlet />;
};

export default RequireSubscription;

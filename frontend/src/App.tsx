import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./utils/ProtectedRoute";
import { AuthProvider } from "./utils/AuthContext";
import Layout from "./components/Layout";
import Signup from "./pages/Signup";

// Import Sales Tracker pages
import Products from "./pages/Products";
import Sales from "./pages/Sales";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Wrap all pages in Layout to show Navbar globally */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Add Sales Tracker routes here */}
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;

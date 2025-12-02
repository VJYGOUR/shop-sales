import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./utils/ProtectedRoute";
import { AuthProvider } from "./utils/AuthContext";
import Layout from "./components/Layout";
import Signup from "./pages/Signup";

// Import Sales Tracker pages
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import BarcodeTools from "./pages/BarcodeTools";
import InventoryReceiving from "./pages/InventoryReceiving";
import SalesHistory from "./pages/SalesHistory";
import BillingPage from "./pages/BillingPage";
import Profile from "./pages/Profile";
import ProductEdit from "./pages/ProductEdit";
import RequireSubscription from "./utils/RequireSubscription";
import EmailCapturePage from "./pages/EmailCapturePage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes without sidebar layout */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />{" "}
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/resend-verification" element={<EmailCapturePage />} />
        {/* Add this route */}
        {/* Protected routes with sidebar layout */}
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route element={<RequireSubscription />}>
              <Route path="/barcode-tools" element={<BarcodeTools />} />
              <Route path="/products/edit/:id" element={<ProductEdit />} />
            </Route>
            <Route path="/receive-stock" element={<InventoryReceiving />} />
            <Route path="/sales-history" element={<SalesHistory />} />

            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../utils/AuthContext";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - only show for authenticated users */}
      {user && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar with menu button - only show menu if user is authenticated */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} showMenu={!!user} />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

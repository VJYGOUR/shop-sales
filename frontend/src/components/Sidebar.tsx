import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Navigation items for authenticated users
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Products", href: "/products", icon: "📦" },
    { name: "Sales", href: "/sales", icon: "💰" },
    { name: "Inventory", href: "/inventory", icon: "📋" },
    { name: "Customers", href: "/customers", icon: "👥" },
    { name: "Reports", href: "/reports", icon: "📈" },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  if (!user) {
    return null; // Don't show sidebar for non-authenticated users
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Navigation</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-gray-900 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Stats Section */}
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gray-700 rounded-lg">
          <div className="text-xs text-gray-300">
            <div>Business Overview</div>
            <div className="text-white text-sm font-semibold mt-1">
              Active Today
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
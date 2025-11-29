import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { usePlanLimits } from "../utils/usePlanLimits";
import type { FeatureType } from "../utils/plans";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { canUseFeature } = usePlanLimits();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Products", href: "/products", icon: "📦" },
    { name: "Sales", href: "/sales", icon: "💰" },
    { name: "Sales History", href: "/sales-history", icon: "📋" },
    { name: "Inventory", href: "/inventory", icon: "📋" },
    { name: "Customers", href: "/customers", icon: "👥" },
    { name: "Reports", href: "/reports", icon: "📈" },
    { name: "billing", href: "/billing", icon: "💳" },
    {
      name: "Barcode Tools",
      href: "/barcode-tools",
      icon: "📱",
      premium: true,
    },
  ];

  const isActive = (href: string) => location.pathname === href;

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay - only show on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - always visible on desktop, conditional on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl 
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          border-r border-white/10
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Stoq
            </h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 lg:hidden"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)]">
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isPremiumFeature =
                  item.premium &&
                  !canUseFeature("barcode_system" as FeatureType);

                return (
                  <li key={item.name}>
                    <Link
                      to={isPremiumFeature ? "/billing" : item.href}
                      onClick={() => onClose()}
                      className={`
                        group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300
                        ${
                          isActive(item.href)
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                            : isPremiumFeature
                            ? "text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-200 border border-yellow-500/30 hover:border-yellow-400/50"
                            : "text-gray-300 hover:bg-white/5 hover:text-white hover:border hover:border-white/10"
                        }
                      `}
                    >
                      <span
                        className={`mr-3 text-lg transition-transform duration-300 group-hover:scale-110 ${
                          isActive(item.href) ? "text-cyan-400" : ""
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {isPremiumFeature && (
                        <span className="ml-2 text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white px-2 py-1 rounded-full font-bold shadow-lg">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User & Business Overview - fixed at bottom */}
          <div className="p-4 border-t border-white/10">
            {/* User Info */}
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-cyan-400 font-medium capitalize">
                    {user.plan} Plan
                  </p>
                </div>
              </div>
            </div>

            {/* Business Overview */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
              <div className="text-xs text-gray-400 font-medium mb-2">
                Business Overview
              </div>
              <div className="flex items-center justify-between">
                <div className="text-white text-sm font-semibold">
                  Active Today
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

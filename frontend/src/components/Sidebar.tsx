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
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - always visible on desktop, conditional on mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 shadow-lg 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Stoq</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)]">
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <ul className="space-y-2">
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
                        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                        ${
                          isActive(item.href)
                            ? "bg-gray-900 text-white"
                            : isPremiumFeature
                            ? "text-yellow-400 hover:bg-gray-700 hover:text-yellow-300 border border-yellow-500"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }
                      `}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className="flex-1">{item.name}</span>
                      {isPremiumFeature && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold">
                          PRO
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Business Overview - fixed at bottom */}
          <div className="p-4 border-t border-gray-700">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-300">
                <div>Business Overview</div>
                <div className="text-white text-sm font-semibold mt-1">
                  Active Today
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

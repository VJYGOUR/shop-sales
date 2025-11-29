import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

interface NavbarProps {
  onMenuClick: () => void;
  showMenu: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, showMenu }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const defaultAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white p-4 flex justify-between items-center border-b border-white/10 backdrop-blur-xl relative z-50">
      <div className="flex items-center space-x-4">
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-cyan-500/30"
          >
            <svg
              className="w-6 h-6 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        <Link
          to={user ? "/dashboard" : "/"}
          className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-300 transition-all duration-300"
        >
          Stoq
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {!user ? (
          <>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-cyan-500/30 hover:text-cyan-300"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
            >
              Signup
            </Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500/50 group-hover:border-cyan-400 transition-all duration-300 shadow-lg">
                  <img
                    src={user.profileImage || defaultAvatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur-sm group-hover:bg-cyan-400/30 transition-all duration-300"></div>
              </div>
              <span className="hidden sm:block text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {user.name}
              </span>
            </button>

            {showDropdown && (
              <>
                {/* Backdrop overlay - HIGH Z-INDEX */}
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown menu - HIGHEST Z-INDEX */}
                <div className="absolute right-0 mt-3 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/50 py-3 z-[999] border border-cyan-500/20">
                  {/* User info section */}
                  <div className="px-4 py-3 border-b border-cyan-500/20 mb-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-cyan-400 truncate mt-1">
                      {user.email}
                    </p>
                  </div>

                  {/* Profile link */}
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200 group"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-cyan-400 group-hover:scale-110 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">Profile Settings</span>
                  </Link>

                  {/* Logout button */}
                  <div className="border-t border-cyan-500/20 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group"
                    >
                      <svg
                        className="w-5 h-5 mr-3 text-red-400 group-hover:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

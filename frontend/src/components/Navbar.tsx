import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

interface NavbarProps {
  onMenuClick: () => void;
  showMenu: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, showMenu }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        {/* Menu button - only show if user is authenticated */}
        {showMenu && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
          >
            ☰
          </button>
        )}

        <div className="text-lg font-bold">
          <Link to={user ? "/dashboard" : "/"}>BizTrack</Link>
        </div>
      </div>

      <div className="space-x-4">
        {!user ? (
          <>
            <Link to="/login" className="hover:text-gray-300">
              Login
            </Link>
            <Link to="/signup" className="hover:text-gray-300">
              Signup
            </Link>
          </>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 hidden sm:block">
              Welcome, {user.name}
            </span>
            <button onClick={logout} className="hover:text-gray-300">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="text-lg font-bold">
        <Link to="/">MyApp</Link>
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
          <>
            <Link to="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>
            <button onClick={logout} className="hover:text-gray-300">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

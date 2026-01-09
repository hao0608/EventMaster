import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="bg-indigo-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/events" className="flex items-center space-x-2 font-bold text-xl">
              <i className="fa-solid fa-ticket"></i>
              <span>EventMaster</span>
            </Link>
            <div className="hidden md:block ml-10 flex items-baseline space-x-4">
              <Link to="/events" className="hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                Browse Events
              </Link>
              
              {/* Member Links */}
              <Link to="/my-tickets" className="hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                My Tickets
              </Link>

              {/* Organizer Links */}
              {(user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN) && (
                <Link to="/organizer/verify" className="bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md text-sm font-medium border border-indigo-500">
                  <i className="fa-solid fa-qrcode mr-2"></i>Verify
                </Link>
              )}

              {/* Admin Links */}
              {user.role === UserRole.ADMIN && (
                <>
                  <Link to="/admin/create-event" className="hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                    Create Event
                  </Link>
                  <Link to="/admin/users" className="hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                    Users & Roles
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-indigo-200 hidden sm:block">
              {user.displayName} <span className="text-xs border border-indigo-400 rounded px-1 ml-1 uppercase">{user.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
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
    <nav className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/events" className="flex items-center space-x-2 font-bold text-xl">
              <i className="fa-solid fa-ticket"></i>
              <span>EventMaster</span>
            </Link>
            <div className="hidden md:block ml-10 flex items-baseline space-x-4">
              <Link to="/events" className="hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium">
                瀏覽活動
              </Link>
              
              {/* Member Links */}
              <Link to="/my-tickets" className="hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium">
                我的票券
              </Link>

              {/* Organizer & Admin Links - Verification */}
              {(user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN) && (
                <Link to="/organizer/verify" className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium border border-blue-500">
                  <i className="fa-solid fa-clipboard-check mr-2"></i>驗票後台
                </Link>
              )}

              {/* Organizer & Admin Links - Create Event */}
              {(user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN) && (
                <Link to="/admin/create-event" className="hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium">
                   建立活動
                </Link>
              )}

              {/* Admin Only Links */}
              {user.role === UserRole.ADMIN && (
                <>
                  <Link to="/admin/approvals" className="hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium relative">
                    審核活動
                    <span className="absolute top-1 right-0 w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                  </Link>
                  <Link to="/admin/users" className="hover:bg-blue-500 px-3 py-2 rounded-md text-sm font-medium">
                    用戶權限
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-blue-200 hidden sm:block">
              {user.displayName} <span className="text-xs border border-blue-400 rounded px-1 ml-1 uppercase">{user.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If user is already restored from local storage, skip login screen
  useEffect(() => {
    if (user) {
      navigate('/events');
    }
  }, [user, navigate]);

  const handleLogin = async (email: string) => {
    await login(email);
    navigate('/events');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">EventMaster MVP</h2>
            <p className="mt-2 text-sm text-gray-600">模擬 IAM / SSO 登入系統</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-center text-gray-400 uppercase tracking-widest">請選擇登入角色</p>
            
            <button
              onClick={() => handleLogin('member@company.com')}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:border-blue-500 transition"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="text-left">
                  <div className="font-bold">一般會員 (Member)</div>
                  <div className="text-xs text-gray-500">瀏覽活動與報名參加</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-right text-gray-300"></i>
            </button>

            <button
              onClick={() => handleLogin('org@company.com')}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-purple-50 hover:border-purple-500 transition"
            >
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3 text-purple-600">
                  <i className="fa-solid fa-clipboard-check"></i>
                </div>
                <div className="text-left">
                  <div className="font-bold">主辦方 (Organizer)</div>
                  <div className="text-xs text-gray-500">掃描 QR Code 進行驗票</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-right text-gray-300"></i>
            </button>

            <button
              onClick={() => handleLogin('admin@company.com')}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:border-red-500 transition"
            >
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-3 text-red-600">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="text-left">
                  <div className="font-bold">系統管理員 (Admin)</div>
                  <div className="text-xs text-gray-500">管理所有活動與用戶</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-right text-gray-300"></i>
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            正式環境將導向 Cognito Hosted UI
          </p>
        </div>
      </div>
    </div>
  );
};
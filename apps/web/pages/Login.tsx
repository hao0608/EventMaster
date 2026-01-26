import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // If user is already restored from local storage, skip login screen
  useEffect(() => {
    if (user) {
      navigate('/events');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/events');
    } catch (err: any) {
      setError('登入失敗，請檢查您的 Email 或密碼。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600">EventMaster</h1>
            <p className="mt-2 text-sm text-gray-600">活動報名與驗票系統 (MVP)</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {isLoading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>

        {/* Developer Hints for MVP */}
        <div className="mt-6 bg-white shadow rounded-lg p-4 text-xs text-gray-500 border border-gray-200">
          <p className="font-bold mb-2 uppercase tracking-wide">測試用帳號 (密碼: password123)</p>
          <div className="grid gap-2">
            <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => { setEmail('member@eventmaster.test'); setPassword('MemberPass123!'); }}>
              <span className="font-medium text-gray-900">member@eventmaster.test</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">一般會員</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => { setEmail('organizer@eventmaster.test'); setPassword('OrganizerPass123!'); }}>
              <span className="font-medium text-gray-900">organizer@eventmaster.test</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">主辦方</span>
            </div>
            <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => { setEmail('admin@eventmaster.test'); setPassword('AdminPass123!'); }}>
              <span className="font-medium text-gray-900">admin@eventmaster.test</span>
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">管理員</span>
            </div>
          </div>
          <p className="mt-2 text-center text-gray-400 italic">點擊上述帳號可自動填入</p>
        </div>
      </div>
    </div>
  );
};

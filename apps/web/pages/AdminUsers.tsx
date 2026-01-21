import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    api.getUsers()
      .then(data => {
        setUsers(data.items);
        setError(null);
      })
      .catch(() => setError('載入用戶時發生錯誤'))
      .finally(() => setLoading(false));
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      // Optimistic update or reload
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      addToast('角色已更新', 'success');
    } catch (e) {
      addToast('更新角色失敗', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">用戶與權限管理</h1>
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="p-6 text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
            <p className="mt-2 text-sm text-gray-500">載入用戶中...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-gray-500">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶名稱</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色權限</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white text-gray-900"
                    >
                      <option value={UserRole.MEMBER}>會員 (Member)</option>
                      <option value={UserRole.ORGANIZER}>主辦方 (Organizer)</option>
                      <option value={UserRole.ADMIN}>管理員 (Admin)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

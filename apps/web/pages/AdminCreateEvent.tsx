import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const AdminCreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
    capacity: 100
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await mockApi.createEvent({
        ...formData,
        organizerId: user.id, // Assign current user as owner
        capacity: Number(formData.capacity)
      });
      
      if (user.role === UserRole.ADMIN) {
        alert('活動建立成功！(已自動發布)');
      } else {
        alert('活動建立成功！您的活動目前為「待審核」狀態，需經管理員核准後才會公開顯示。');
      }
      navigate('/events');
    } catch (error) {
      alert('建立活動時發生錯誤');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">建立新活動</h1>
      
      {user?.role === UserRole.ORGANIZER && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fa-solid fa-triangle-exclamation text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                注意：作為主辦方，您建立的活動需經由管理員審核通過後，才會公開在活動列表上。
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">活動名稱 (Title)</label>
          <input 
            type="text" 
            name="title" 
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white text-gray-900"
            value={formData.title} 
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">活動描述 (Description)</label>
          <textarea 
            name="description" 
            rows={3} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white text-gray-900"
            value={formData.description} 
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700">開始時間</label>
             <input 
               type="datetime-local" 
               name="startAt" 
               required 
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white text-gray-900"
               value={formData.startAt} 
               onChange={handleChange}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700">結束時間</label>
             <input 
               type="datetime-local" 
               name="endAt" 
               required 
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white text-gray-900"
               value={formData.endAt} 
               onChange={handleChange}
             />
           </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">地點 (Location)</label>
          <input 
            type="text" 
            name="location" 
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white text-gray-900"
            value={formData.location} 
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">人數上限 (Capacity)</label>
          <input 
            type="number" 
            name="capacity" 
            min="1"
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 bg-white text-gray-900"
            value={formData.capacity} 
            onChange={handleChange}
          />
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            {user?.role === UserRole.ADMIN ? '發布活動' : '送出審核'}
          </button>
        </div>

      </form>
    </div>
  );
};
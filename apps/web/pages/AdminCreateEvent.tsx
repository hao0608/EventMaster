import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../services/mockApi';

export const AdminCreateEvent: React.FC = () => {
  const navigate = useNavigate();
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
    try {
      await mockApi.createEvent({
        ...formData,
        capacity: Number(formData.capacity)
      });
      alert('活動建立成功！');
      navigate('/events');
    } catch (error) {
      alert('建立活動時發生錯誤');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">建立新活動</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">活動名稱 (Title)</label>
          <input 
            type="text" 
            name="title" 
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            value={formData.title} 
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">活動描述 (Description)</label>
          <textarea 
            name="description" 
            rows={3} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
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
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
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
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
            value={formData.capacity} 
            onChange={handleChange}
          />
        </div>

        <div className="pt-4">
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
            發布活動
          </button>
        </div>

      </form>
    </div>
  );
};
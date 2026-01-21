import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Event, UserRole } from '../types';
import { useToast } from '../contexts/ToastContext';

export const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startAt: '',
    endAt: '',
    location: '',
    capacity: 0
  });

  useEffect(() => {
    if (id) {
        api.getEvent(id).then(event => {
            // Check ownership
            if (user && user.role !== UserRole.ADMIN && event.organizerId !== user.id) {
                addToast('權限不足，無法編輯此活動。', 'error');
                navigate('/events');
                return;
            }

            setFormData({
                title: event.title,
                description: event.description,
                startAt: event.startAt,
                endAt: event.endAt,
                location: event.location,
                capacity: event.capacity
            });
            setLoading(false);
        }).catch(() => {
            addToast('找不到此活動', 'error');
            navigate('/events');
        });
    }
  }, [id, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await api.updateEvent(id, {
        ...formData,
        capacity: Number(formData.capacity)
      });
      addToast('活動更新成功！', 'success');
      navigate(`/events/${id}`);
    } catch (error) {
      addToast('更新失敗', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
        <p className="mt-2 text-sm text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-4 text-gray-500 hover:text-gray-700">
              <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">編輯活動</h1>
      </div>

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
          <p className="text-xs text-red-500 mt-1">注意：若減少人數上限且已報名人數超過新上限，不會自動取消既有報名。</p>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="submit" className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            儲存變更
          </button>
        </div>

      </form>
    </div>
  );
};

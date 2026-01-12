import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Event, UserRole } from '../types';
import { mockApi } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (id) {
      mockApi.getEventById(id).then(data => {
        setEvent(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handleRegister = async () => {
    if (!user || !event) return;
    setRegistering(true);
    try {
      await mockApi.registerForEvent(user.id, event.id);
      alert('報名成功！正在跳轉至我的票券...');
      navigate('/my-tickets');
    } catch (err: any) {
      alert(err.message || '報名失敗');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="p-10 text-center">載入中...</div>;
  if (!event) return <div className="p-10 text-center">找不到此活動</div>;

  const isFull = event.registeredCount >= event.capacity;
  const canViewAttendees = user && (user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="h-48 bg-indigo-600 flex items-center justify-center relative">
            <h1 className="text-3xl md:text-4xl font-bold text-white px-4 text-center">{event.title}</h1>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">活動描述</h3>
                <p className="mt-1 text-gray-900 leading-relaxed">{event.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start">
                   <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-indigo-600">
                     <i className="fa-regular fa-calendar"></i>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">日期與時間</p>
                     <p className="text-sm font-medium text-gray-900">
                       {new Date(event.startAt).toLocaleDateString()}
                       <br/>
                       {new Date(event.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.endAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                   </div>
                </div>
                
                <div className="flex items-start">
                   <div className="bg-indigo-100 p-2 rounded-lg mr-3 text-indigo-600">
                     <i className="fa-solid fa-location-dot"></i>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500">地點</p>
                     <p className="text-sm font-medium text-gray-900">{event.location}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 flex flex-col gap-4">
               {/* Registration Card */}
               <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">報名資訊</h3>
                 
                 <div className="mb-4">
                   <div className="flex justify-between text-sm mb-1">
                     <span>剩餘名額</span>
                     <span className="font-medium">{event.registeredCount}/{event.capacity}</span>
                   </div>
                   <div className="w-full bg-gray-200 rounded-full h-2.5">
                     <div 
                       className={`h-2.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} 
                       style={{ width: `${Math.min(100, (event.registeredCount / event.capacity) * 100)}%` }}
                     ></div>
                   </div>
                 </div>

                 <button
                   onClick={handleRegister}
                   disabled={isFull || registering}
                   className={`w-full py-3 px-4 rounded-md font-bold text-white shadow-md transition
                     ${isFull 
                       ? 'bg-gray-400 cursor-not-allowed' 
                       : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                     }
                   `}
                 >
                   {registering ? '處理中...' : isFull ? '已額滿' : '立即報名'}
                 </button>
               </div>

               {/* Organizer Controls */}
               {canViewAttendees && (
                  <Link 
                    to={`/events/${event.id}/attendees`}
                    className="block w-full py-3 px-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-md font-bold text-center hover:bg-indigo-50 transition shadow-sm"
                  >
                    <i className="fa-solid fa-users-viewfinder mr-2"></i>
                    查看報名名單
                  </Link>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
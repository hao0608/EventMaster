import React, { useEffect, useState } from 'react';
import { Event, EventStatus } from '../types';
import { mockApi } from '../services/mockApi';

export const AdminEventApprovals: React.FC = () => {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadEvents = () => {
    mockApi.getAllEventsForAdmin().then(data => {
      // Filter for pending events
      setPendingEvents(data.filter(e => e.status === EventStatus.PENDING));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    if (!confirm(`確定要${newStatus === EventStatus.PUBLISHED ? '核准' : '駁回'}此活動嗎？`)) return;
    
    setProcessingId(eventId);
    try {
      await mockApi.updateEvent(eventId, { status: newStatus });
      // Optimistically remove from UI for better responsiveness
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
      
      // Background reload to ensure consistency
      loadEvents();
    } catch (error) {
      alert('更新狀態失敗');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">活動審核 (Pending Approvals)</h1>
      
      {loading ? (
        <div className="p-8 text-center">
             <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500 mb-2"></i>
             <p>載入中...</p>
        </div>
      ) : pendingEvents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 mb-4">
                <i className="fa-solid fa-clipboard-check text-6xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900">目前沒有待審核的活動</h3>
            <p className="text-gray-500">所有的活動申請都已處理完畢。</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row border-l-4 border-yellow-400">
               <div className="p-6 flex-1">
                   <div className="flex items-center gap-2 mb-2">
                       <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold uppercase">Pending</span>
                       <span className="text-gray-400 text-xs">ID: {event.id}</span>
                   </div>
                   <h2 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h2>
                   <p className="text-gray-600 mb-4">{event.description}</p>
                   
                   <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                       <div><i className="fa-regular fa-clock mr-2"></i>{new Date(event.startAt).toLocaleString()}</div>
                       <div><i className="fa-solid fa-location-dot mr-2"></i>{event.location}</div>
                       <div><i className="fa-solid fa-user mr-2"></i>主辦人 ID: {event.organizerId}</div>
                       <div><i className="fa-solid fa-users mr-2"></i>名額: {event.capacity}</div>
                   </div>
               </div>
               
               <div className="bg-gray-50 p-6 flex flex-row md:flex-col gap-3 justify-center items-center border-t md:border-t-0 md:border-l border-gray-200 min-w-[150px]">
                   {processingId === event.id ? (
                       <div className="text-center">
                           <i className="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
                           <p className="text-xs text-gray-500 mt-1">處理中...</p>
                       </div>
                   ) : (
                       <>
                           <button 
                               onClick={() => handleStatusChange(event.id, EventStatus.PUBLISHED)}
                               className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition flex items-center justify-center gap-2"
                           >
                               <i className="fa-solid fa-check"></i> 核准
                           </button>
                           <button 
                               onClick={() => handleStatusChange(event.id, EventStatus.REJECTED)}
                               className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium transition flex items-center justify-center gap-2"
                           >
                               <i className="fa-solid fa-xmark"></i> 駁回
                           </button>
                       </>
                   )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
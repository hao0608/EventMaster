import React, { useEffect, useState } from 'react';
import { Registration, RegistrationStatus } from '../types';
import { mockApi } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';

export const MyTickets: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = () => {
    if (user) {
        mockApi.getMyRegistrations(user.id).then(data => {
            // Sort: Active first, then cancelled
            const sorted = data.sort((a, b) => {
                if (a.status === RegistrationStatus.CANCELLED && b.status !== RegistrationStatus.CANCELLED) return 1;
                if (a.status !== RegistrationStatus.CANCELLED && b.status === RegistrationStatus.CANCELLED) return -1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            setRegistrations(sorted);
            setLoading(false);
        });
    }
  };

  const handleCancel = async (regId: string) => {
      if (!confirm('確定要取消此報名嗎？名額將會釋出。')) return;
      try {
          await mockApi.cancelRegistration(regId);
          loadTickets(); // Reload
      } catch (e) {
          alert('取消失敗');
      }
  };

  // Helper to translate status
  const getStatusText = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.REGISTERED: return '已報名';
      case RegistrationStatus.CHECKED_IN: return '已簽到';
      case RegistrationStatus.CANCELLED: return '已取消';
      default: return status;
    }
  };

  if (loading) return <div className="p-8 text-center">載入票券中...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的票券</h1>
      
      {registrations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">您目前尚未報名任何活動。</p>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map(reg => (
            <div key={reg.id} className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col sm:flex-row border ${reg.status === RegistrationStatus.CANCELLED ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
              {/* Event Info */}
              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase 
                    ${reg.status === RegistrationStatus.CHECKED_IN ? 'bg-green-100 text-green-800' : 
                      reg.status === RegistrationStatus.CANCELLED ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                    {getStatusText(reg.status)}
                  </span>
                  <span className="text-xs text-gray-400">ID: {reg.id}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{reg.eventTitle}</h3>
                <p className="text-gray-500 text-sm mb-1">
                  <i className="fa-regular fa-calendar mr-2"></i>
                  {new Date(reg.eventStartAt).toLocaleDateString()} {new Date(reg.eventStartAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                
                {reg.status === RegistrationStatus.REGISTERED && (
                    <div className="mt-4">
                        <button 
                            onClick={() => handleCancel(reg.id)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                        >
                            取消報名
                        </button>
                    </div>
                )}
                {reg.status === RegistrationStatus.REGISTERED && (
                    <p className="text-xs text-gray-400 mt-2">請在活動入場時出示右側 QR Code。</p>
                )}
              </div>

              {/* QR Section */}
              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-gray-100 sm:w-64">
                {reg.status !== RegistrationStatus.CANCELLED ? (
                    <>
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-200">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reg.qrCode)}`}
                            alt="Ticket QR Code" 
                            className={`w-32 h-32 object-contain ${reg.status === RegistrationStatus.CHECKED_IN ? 'opacity-50' : ''}`}
                        />
                        </div>
                        <p className="mt-3 text-xs font-mono text-gray-500 text-center break-all">{reg.qrCode}</p>
                        {reg.status === RegistrationStatus.CHECKED_IN && <p className="text-green-600 font-bold text-sm mt-1">票券已使用</p>}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <i className="fa-solid fa-ban text-4xl mb-2"></i>
                        <span className="text-sm font-medium">票券無效</span>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
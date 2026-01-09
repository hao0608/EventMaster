import React, { useEffect, useState } from 'react';
import { Registration, RegistrationStatus } from '../types';
import { mockApi } from '../services/mockApi';
import { useAuth } from '../contexts/AuthContext';

export const MyTickets: React.FC = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      mockApi.getMyRegistrations(user.id).then(data => {
        setRegistrations(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading tickets...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tickets</h1>
      
      {registrations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map(reg => (
            <div key={reg.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col sm:flex-row border border-gray-100">
              {/* Event Info */}
              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded uppercase 
                    ${reg.status === RegistrationStatus.CHECKED_IN ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {reg.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">ID: {reg.id}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{reg.eventTitle}</h3>
                <p className="text-gray-500 text-sm mb-1">
                  <i className="fa-regular fa-calendar mr-2"></i>
                  {new Date(reg.eventStartAt).toLocaleDateString()} {new Date(reg.eventStartAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <p className="text-xs text-gray-400 mt-4">Show this QR code at the entrance.</p>
              </div>

              {/* QR Section */}
              <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-gray-100 sm:w-64">
                <div className="bg-white p-2 rounded shadow-sm border border-gray-200">
                  {/* Using a reliable public QR API for the demo to avoid complex dependencies */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reg.qrCode)}`}
                    alt="Ticket QR Code" 
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <p className="mt-3 text-xs font-mono text-gray-500 text-center break-all">{reg.qrCode}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
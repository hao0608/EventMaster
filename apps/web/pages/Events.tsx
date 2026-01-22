import React, { useEffect, useState } from 'react';
import { Event } from '../types';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEvents()
      .then(data => {
        setEvents(data.items);
      })
      .catch(() => {
        setError('載入活動時發生錯誤');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">近期活動</h1>
        
        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="搜尋活動..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500"></i>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">沒有找到符合 "{searchQuery}" 的活動。</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                    <i className="fa-regular fa-calendar-check text-5xl text-white opacity-50"></i>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{event.title}</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3">{event.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <i className="fa-regular fa-clock w-5 text-blue-500"></i>
                        <span>{new Date(event.startAt).toLocaleDateString()} {new Date(event.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fa-solid fa-location-dot w-5 text-blue-500"></i>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fa-solid fa-users w-5 text-blue-500"></i>
                        <span>{event.registeredCount} / {event.capacity} 人已報名</span>
                      </div>
                    </div>

                    <Link 
                      to={`/events/${event.id}`}
                      className="w-full block text-center bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 rounded-md font-medium transition"
                    >
                      查看詳情
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

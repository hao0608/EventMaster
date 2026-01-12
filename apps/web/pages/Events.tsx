import React, { useEffect, useState } from 'react';
import { Event } from '../types';
import { mockApi } from '../services/mockApi';
import { Link } from 'react-router-dom';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">近期活動</h1>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <i className="fa-regular fa-calendar-check text-5xl text-white opacity-50"></i>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{event.title}</h3>
                </div>
                <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3">{event.description}</p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <i className="fa-regular fa-clock w-5 text-indigo-500"></i>
                    <span>{new Date(event.startAt).toLocaleDateString()} {new Date(event.startAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-location-dot w-5 text-indigo-500"></i>
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-users w-5 text-indigo-500"></i>
                    <span>{event.registeredCount} / {event.capacity} 人已報名</span>
                  </div>
                </div>

                <Link 
                  to={`/events/${event.id}`}
                  className="w-full block text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-2 rounded-md font-medium transition"
                >
                  查看詳情
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
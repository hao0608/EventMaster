import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Event, Attendee, RegistrationStatus } from '../types';
import { mockApi } from '../services/mockApi';

export const EventAttendees: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        mockApi.getEventById(id),
        mockApi.getEventAttendees(id)
      ]).then(([eventData, attendeeData]) => {
        setEvent(eventData || null);
        setAttendees(attendeeData);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-10 text-center">載入名單中...</div>;
  if (!event) return <div className="p-10 text-center">找不到此活動</div>;

  const checkedInCount = attendees.filter(a => a.status === RegistrationStatus.CHECKED_IN).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
         <div>
            <Link to={`/events/${event.id}`} className="text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
                <i className="fa-solid fa-arrow-left mr-1"></i> 返回活動詳情
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{event.title} - 報名名單</h1>
         </div>
         <div className="mt-4 md:mt-0 flex space-x-3">
             <div className="bg-white px-4 py-2 rounded shadow border border-gray-200 text-sm">
                 總報名: <span className="font-bold">{attendees.length}</span>
             </div>
             <div className="bg-green-50 px-4 py-2 rounded shadow border border-green-200 text-sm text-green-800">
                 已簽到: <span className="font-bold">{checkedInCount}</span>
             </div>
         </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {attendees.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
                目前尚未有人報名此活動。
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">參加者姓名</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">票券狀態</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">報名時間</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">票券代碼</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {attendees.map((attendee) => (
                        <tr key={attendee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{attendee.userDisplayName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{attendee.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${attendee.status === RegistrationStatus.CHECKED_IN 
                                    ? 'bg-green-100 text-green-800' 
                                    : attendee.status === RegistrationStatus.CANCELLED
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                {attendee.status === RegistrationStatus.CHECKED_IN ? '已簽到' : 
                                 attendee.status === RegistrationStatus.CANCELLED ? '已取消' : '已報名'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(attendee.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                            {attendee.qrCode}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};
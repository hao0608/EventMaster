import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckInResult, Event } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const OrganizerVerify: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'verify' | 'walkin'>('verify');
  
  // --- Common Data ---
  const [events, setEvents] = useState<Event[]>([]);
  
  // --- Verify State ---
  const [inputCode, setInputCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<CheckInResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  // --- Walk-in State ---
  const [selectedEventId, setSelectedEventId] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInResult, setWalkInResult] = useState<CheckInResult | null>(null);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Only load events managed by this user (or all if admin) for Walk-in selection
    if (user) {
        api.getManagedEvents().then(data => {
            setEvents(data.items);
            if (data.items.length > 0) setSelectedEventId(data.items[0].id);
        });
    }
  }, [user]);

  // --- Verify Handler ---
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || !user) return;

    setVerifying(true);
    setVerifyResult(null);

    try {
      // Pass verifier ID for ownership check
      const res = await api.verifyTicket(inputCode);
      setVerifyResult(res);
      if (res.success) {
        setInputCode(''); 
      }
    } catch (error) {
      setVerifyResult({ success: false, message: '驗票系統發生錯誤' });
    } finally {
      setVerifying(false);
    }
  };

  // --- Walk-in Handler ---
  const handleWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !walkInEmail || !user) return;

    setRegistering(true);
    setWalkInResult(null);

    try {
      // Pass verifier ID for ownership check
      const res = await api.walkInRegister(selectedEventId, walkInEmail, walkInName);
      setWalkInResult(res);
      if (res.success) {
        setWalkInEmail('');
        setWalkInName('');
      }
    } catch (error) {
      setWalkInResult({ success: false, message: '現場報名失敗' });
    } finally {
      setRegistering(false);
    }
  };

  // Helper to translate API messages
  const translateMessage = (msg: string) => {
    if (msg.includes('Check-in Successful')) return '簽到成功！';
    if (msg.includes('Invalid Ticket')) return '無效票券 / 找不到 QR Code';
    if (msg.includes('Ticket already used')) return '此票券已使用過 (已簽到)';
    if (msg.includes('Ticket was cancelled')) return '此票券已取消';
    if (msg.includes('Walk-in Registered')) return '現場報名並簽到成功！';
    if (msg.includes('Existing registration found') || msg.includes('Existing registration checked in')) return '找到現有報名資料，簽到成功！';
    if (msg.includes('User already checked in')) return '此用戶已經簽到過了。';
    if (msg.includes('Event is at full capacity')) return '活動已額滿，無法現場報名。';
    if (msg.includes('Event is not published')) return '活動尚未發布，無法現場報名。';
    if (msg.includes('Event not found')) return '找不到指定的活動。';
    if (msg.includes('Forbidden')) return '權限不足，無法執行此操作。';
    // Return original message if it's a permission error or unknown
    return msg;
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">驗票控制台 (Check-in)</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm focus:outline-none ${
            activeTab === 'verify'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <i className="fa-solid fa-qrcode mr-2"></i>
          掃描 / 驗票
        </button>
        <button
          onClick={() => setActiveTab('walkin')}
          className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm focus:outline-none ${
            activeTab === 'walkin'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <i className="fa-solid fa-user-plus mr-2"></i>
          現場報名 / 手動
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]">
        
        {/* === VERIFY TAB === */}
        {activeTab === 'verify' && (
          <div>
            <form onSubmit={handleVerify}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  票券代碼 (請掃描 QR)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="QR-..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-qrcode text-gray-400"></i>
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={verifying || !inputCode}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-300"
              >
                {verifying ? '驗證中...' : '驗證票券'}
              </button>
            </form>

            {/* Verify Results */}
            {verifyResult && (
              <div className={`mt-6 p-4 rounded-lg border text-center animate-pulse-once ${verifyResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                 <div className="mb-2">
                   {verifyResult.success ? (
                     <i className="fa-solid fa-circle-check text-4xl text-green-500"></i>
                   ) : (
                     <i className="fa-solid fa-circle-xmark text-4xl text-red-500"></i>
                   )}
                 </div>
                 <h3 className={`text-lg font-bold ${verifyResult.success ? 'text-green-800' : 'text-red-800'}`}>
                   {translateMessage(verifyResult.message)}
                 </h3>
                 {verifyResult.registration && (
                   <div className="mt-2 text-sm text-gray-600">
                     <p>參加者: <span className="font-semibold">{verifyResult.registration.userId}</span></p>
                     <p>活動: {verifyResult.registration.eventTitle}</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}

        {/* === WALK-IN TAB === */}
        {activeTab === 'walkin' && (
          <div>
            <form onSubmit={handleWalkIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">選擇活動 (僅顯示您主辦的活動)</label>
                {events.length === 0 ? (
                    <div className="text-gray-500 text-sm border p-2 rounded bg-gray-50">
                        您目前沒有正在舉辦的活動。
                    </div>
                ) : (
                    <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
                    >
                    {events.map(event => (
                        <option key={event.id} value={event.id}>
                        {event.title}
                        </option>
                    ))}
                    </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={walkInEmail}
                  onChange={(e) => setWalkInEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (選填)</label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="王小明"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={registering || !selectedEventId || !walkInEmail}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-gray-300 transition"
              >
                {registering ? '處理中...' : '報名並簽到'}
              </button>
            </form>

            {/* Walk-in Results */}
            {walkInResult && (
              <div className={`mt-6 p-4 rounded-lg border text-center animate-pulse-once ${walkInResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                 <div className="mb-2">
                   {walkInResult.success ? (
                     <i className="fa-solid fa-check-double text-4xl text-green-500"></i>
                   ) : (
                     <i className="fa-solid fa-triangle-exclamation text-4xl text-yellow-500"></i>
                   )}
                 </div>
                 <h3 className={`text-lg font-bold ${walkInResult.success ? 'text-green-800' : 'text-yellow-800'}`}>
                   {translateMessage(walkInResult.message)}
                 </h3>
                 {walkInResult.registration && (
                   <div className="mt-2 text-sm text-gray-600">
                     <p className="font-semibold">{walkInResult.registration.eventTitle}</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        )}

      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
         {activeTab === 'verify' ? (
             <p>此分頁用於掃描參加者已持有的 QR Code。</p>
         ) : (
             <p>此分頁用於現場臨時報名，或找不到票券時的手動補登。</p>
         )}
      </div>
    </div>
  );
};

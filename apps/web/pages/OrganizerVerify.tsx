import React, { useState } from 'react';
import { mockApi } from '../services/mockApi';
import { CheckInResult } from '../types';

export const OrganizerVerify: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [checking, setChecking] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setChecking(true);
    setResult(null);

    try {
      const res = await mockApi.verifyTicket(inputCode);
      setResult(res);
      if (res.success) {
        setInputCode(''); // Clear on success for next scan
      }
    } catch (error) {
      setResult({ success: false, message: 'System Error during verification.' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Ticket Verification</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan or Enter Token Code
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="QR-..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-qrcode text-gray-400"></i>
              </div>
            </div>
          </div>
          <button 
            type="submit"
            disabled={checking || !inputCode}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:bg-gray-300"
          >
            {checking ? 'Verifying...' : 'Verify Ticket'}
          </button>
        </form>

        {/* Results Area */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg border text-center animate-pulse-once ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
             <div className="mb-2">
               {result.success ? (
                 <i className="fa-solid fa-circle-check text-4xl text-green-500"></i>
               ) : (
                 <i className="fa-solid fa-circle-xmark text-4xl text-red-500"></i>
               )}
             </div>
             <h3 className={`text-lg font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
               {result.message}
             </h3>
             {result.registration && (
               <div className="mt-2 text-sm text-gray-600">
                 <p>Attendee: <span className="font-semibold">User {result.registration.userId}</span></p>
                 <p>Event: {result.registration.eventTitle}</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Tip: In a real app, this would access the device camera for QR scanning.</p>
        <p className="mt-2 text-xs">Test Codes: Look at "My Tickets" to get valid codes.</p>
      </div>
    </div>
  );
};
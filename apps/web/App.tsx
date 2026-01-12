import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { EventAttendees } from './pages/EventAttendees';
import { MyTickets } from './pages/MyTickets';
import { OrganizerVerify } from './pages/OrganizerVerify';
import { AdminCreateEvent } from './pages/AdminCreateEvent';
import { AdminUsers } from './pages/AdminUsers';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />
            
            {/* Protected: All Authenticated Users */}
            <Route path="/events" element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            } />
            <Route path="/events/:id" element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            } />

            {/* Protected: Member */}
            <Route path="/my-tickets" element={
              <ProtectedRoute allowedRoles={[UserRole.MEMBER, UserRole.ORGANIZER, UserRole.ADMIN]}>
                <MyTickets />
              </ProtectedRoute>
            } />

            {/* Protected: Organizer & Admin */}
            <Route path="/organizer/verify" element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]}>
                <OrganizerVerify />
              </ProtectedRoute>
            } />
            <Route path="/events/:id/attendees" element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]}>
                <EventAttendees />
              </ProtectedRoute>
            } />
            
            {/* Protected: Organizer & Admin (Creation) */}
            <Route path="/admin/create-event" element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]}>
                <AdminCreateEvent />
              </ProtectedRoute>
            } />
            
            {/* Protected: Admin Only */}
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
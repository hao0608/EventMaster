import { User, UserRole, Event, EventStatus, Registration, RegistrationStatus, CheckInResult, Attendee } from '../types';

// --- Mock Data ---

let MOCK_USERS: User[] = [
  { id: 'u1', email: 'member@company.com', displayName: 'Alice Member', role: UserRole.MEMBER },
  { id: 'u2', email: 'org@company.com', displayName: 'Bob Organizer', role: UserRole.ORGANIZER },
  { id: 'u3', email: 'admin@company.com', displayName: 'Charlie Admin', role: UserRole.ADMIN },
];

let MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    organizerId: 'u2', // Owned by Bob
    title: 'Q1 All-Hands Meeting',
    description: 'Company wide updates and quarterly goals review.',
    startAt: '2023-11-15T10:00:00',
    endAt: '2023-11-15T12:00:00',
    location: 'Main Auditorium',
    capacity: 200,
    registeredCount: 45,
    status: EventStatus.PUBLISHED
  },
  {
    id: 'e2',
    organizerId: 'u3', // Owned by Charlie (Admin)
    title: 'Tech Talk: AWS Serverless',
    description: 'Deep dive into Lambda, Fargate and Aurora.',
    startAt: '2023-11-20T14:00:00',
    endAt: '2023-11-20T15:30:00',
    location: 'Meeting Room 301',
    capacity: 50,
    registeredCount: 48,
    status: EventStatus.PUBLISHED
  }
];

let MOCK_REGISTRATIONS: Registration[] = [];

// --- Service Methods ---

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Auth
  login: async (email: string, password: string): Promise<User> => {
    await delay(500);
    // In a real app, verify password hash here.
    // For MVP Mock: just ensure password is not empty and user exists.
    if (!password) throw new Error('Password is required');

    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) throw new Error('Invalid email or password');
    return user;
  },

  getAllUsers: async (): Promise<User[]> => {
    await delay(300);
    return [...MOCK_USERS];
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<void> => {
    await delay(300);
    MOCK_USERS = MOCK_USERS.map(u => u.id === userId ? { ...u, role } : u);
  },

  // Events
  getEvents: async (): Promise<Event[]> => {
    await delay(400);
    // Only return published events for the public list
    return MOCK_EVENTS.filter(e => e.status === EventStatus.PUBLISHED);
  },
  
  // New method for admins to see all events (for approval)
  getAllEventsForAdmin: async (): Promise<Event[]> => {
    await delay(400);
    return [...MOCK_EVENTS];
  },

  getManagedEvents: async (userId: string, role: UserRole): Promise<Event[]> => {
    await delay(300);
    if (role === UserRole.ADMIN) {
        return [...MOCK_EVENTS];
    }
    // Organizers can see all their events, regardless of status
    return MOCK_EVENTS.filter(e => e.organizerId === userId);
  },

  getEventById: async (id: string): Promise<Event | undefined> => {
    await delay(200);
    return MOCK_EVENTS.find(e => e.id === id);
  },

  createEvent: async (eventData: Omit<Event, 'id' | 'registeredCount' | 'status'>): Promise<Event> => {
    await delay(500);
    
    // Determine initial status based on creator's role
    const organizer = MOCK_USERS.find(u => u.id === eventData.organizerId);
    // Admin events are auto-published, Organizer events are pending
    const initialStatus = (organizer?.role === UserRole.ADMIN) 
        ? EventStatus.PUBLISHED 
        : EventStatus.PENDING;

    const newEvent: Event = {
      ...eventData,
      id: `e${Date.now()}`,
      registeredCount: 0,
      status: initialStatus
    };
    MOCK_EVENTS.push(newEvent);
    return newEvent;
  },

  // NEW: Update Event
  updateEvent: async (eventId: string, updates: Partial<Event>): Promise<Event> => {
    await delay(500);
    const index = MOCK_EVENTS.findIndex(e => e.id === eventId);
    if (index === -1) throw new Error('Event not found');
    
    // Merge updates
    const updatedEvent = { ...MOCK_EVENTS[index], ...updates };
    MOCK_EVENTS[index] = updatedEvent;
    return updatedEvent;
  },

  // NEW: Delete Event
  deleteEvent: async (eventId: string): Promise<void> => {
    await delay(500);
    const index = MOCK_EVENTS.findIndex(e => e.id === eventId);
    if (index === -1) throw new Error('Event not found');
    
    // Remove event
    MOCK_EVENTS.splice(index, 1);
    
    // Ideally, we should also cancel/delete associated registrations, 
    // but for MVP mock, we'll leave them as orphans or handle display logic elsewhere.
    MOCK_REGISTRATIONS = MOCK_REGISTRATIONS.filter(r => r.eventId !== eventId);
  },

  // Registration
  registerForEvent: async (userId: string, eventId: string): Promise<Registration> => {
    await delay(600);
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    
    if (event.status !== EventStatus.PUBLISHED) {
        throw new Error('Cannot register for an unpublished event.');
    }

    // Check if user previously cancelled, if so, reactivate? 
    // For simplicity, we just check active registrations.
    const existing = MOCK_REGISTRATIONS.find(r => r.eventId === eventId && r.userId === userId);
    
    if (existing) {
        if (existing.status === RegistrationStatus.CANCELLED) {
             // Reactivate
             existing.status = RegistrationStatus.REGISTERED;
             existing.createdAt = new Date().toISOString(); // Reset time
             event.registeredCount += 1;
             return existing;
        }
        throw new Error('Already registered');
    }

    const newReg: Registration = {
      id: `r${Date.now()}`,
      eventId,
      userId,
      eventTitle: event.title,
      eventStartAt: event.startAt,
      status: RegistrationStatus.REGISTERED,
      qrCode: `QR-${eventId}-${userId}-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString()
    };
    
    MOCK_REGISTRATIONS.push(newReg);
    event.registeredCount += 1;
    
    return newReg;
  },

  // NEW: Cancel Registration
  cancelRegistration: async (registrationId: string): Promise<void> => {
      await delay(400);
      const reg = MOCK_REGISTRATIONS.find(r => r.id === registrationId);
      if (!reg) throw new Error('Registration not found');
      
      if (reg.status === RegistrationStatus.CHECKED_IN) {
          throw new Error('Cannot cancel a ticket that has already been checked in.');
      }

      if (reg.status === RegistrationStatus.CANCELLED) {
          return; // Already cancelled
      }

      reg.status = RegistrationStatus.CANCELLED;
      
      // Decrease event count
      const event = MOCK_EVENTS.find(e => e.id === reg.eventId);
      if (event && event.registeredCount > 0) {
          event.registeredCount -= 1;
      }
  },

  // WALK-IN REGISTRATION
  walkInRegister: async (eventId: string, email: string, displayName: string, verifierId: string, verifierRole: UserRole): Promise<CheckInResult> => {
    await delay(800);
    
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    if (verifierRole !== UserRole.ADMIN && event.organizerId !== verifierId) {
        return { success: false, message: '權限不足：您不是此活動的主辦方，無法進行現場報名操作。' };
    }

    let user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      user = {
        id: `u${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        role: UserRole.MEMBER
      };
      MOCK_USERS.push(user);
    }

    let reg = MOCK_REGISTRATIONS.find(r => r.eventId === eventId && r.userId === user!.id);
    
    if (reg) {
      if (reg.status === RegistrationStatus.CHECKED_IN) {
        return { success: false, message: 'User already checked in.', registration: reg };
      }
      // If cancelled, reactivate and check in
      if (reg.status === RegistrationStatus.CANCELLED) {
         event.registeredCount += 1;
      }
      
      reg.status = RegistrationStatus.CHECKED_IN;
      return { success: true, message: 'Existing registration checked in!', registration: reg };
    }

    const newReg: Registration = {
      id: `r${Date.now()}`,
      eventId,
      userId: user.id,
      eventTitle: event.title,
      eventStartAt: event.startAt,
      status: RegistrationStatus.CHECKED_IN,
      qrCode: `QR-${eventId}-${user.id}-WALKIN`,
      createdAt: new Date().toISOString()
    };

    MOCK_REGISTRATIONS.push(newReg);
    event.registeredCount += 1;

    return { success: true, message: 'Walk-in Registered & Checked In!', registration: newReg };
  },

  getMyRegistrations: async (userId: string): Promise<Registration[]> => {
    await delay(400);
    return MOCK_REGISTRATIONS.filter(r => r.userId === userId);
  },

  verifyTicket: async (qrCode: string, verifierId: string, verifierRole: UserRole): Promise<CheckInResult> => {
    await delay(600);
    const regIndex = MOCK_REGISTRATIONS.findIndex(r => r.qrCode === qrCode);
    
    if (regIndex === -1) {
      return { success: false, message: 'Invalid Ticket / QR Code not found.' };
    }

    const reg = MOCK_REGISTRATIONS[regIndex];
    const event = MOCK_EVENTS.find(e => e.id === reg.eventId);

    if (!event) return { success: false, message: 'Event data missing.' };
    
    if (verifierRole !== UserRole.ADMIN && event.organizerId !== verifierId) {
        return { success: false, message: '權限不足：這張票券屬於其他主辦方的活動，您無法驗票。' };
    }

    if (reg.status === RegistrationStatus.CHECKED_IN) {
      return { success: false, message: 'Ticket already used / Checked in.', registration: reg };
    }

    if (reg.status === RegistrationStatus.CANCELLED) {
      return { success: false, message: 'Ticket was cancelled.', registration: reg };
    }

    const updatedReg = { ...reg, status: RegistrationStatus.CHECKED_IN };
    MOCK_REGISTRATIONS[regIndex] = updatedReg;

    return { success: true, message: 'Check-in Successful!', registration: updatedReg };
  },

  getEventAttendees: async (eventId: string): Promise<Attendee[]> => {
    await delay(500);
    const registrations = MOCK_REGISTRATIONS.filter(r => r.eventId === eventId);
    
    const attendees: Attendee[] = registrations.map(reg => {
        const user = MOCK_USERS.find(u => u.id === reg.userId);
        return {
            ...reg,
            userDisplayName: user ? user.displayName : 'Unknown User',
            userEmail: user ? user.email : 'Unknown Email'
        };
    });

    return attendees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};
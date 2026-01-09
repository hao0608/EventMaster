import { User, UserRole, Event, Registration, RegistrationStatus, CheckInResult } from '../types';

// --- Mock Data ---

let MOCK_USERS: User[] = [
  { id: 'u1', email: 'member@company.com', displayName: 'Alice Member', role: UserRole.MEMBER },
  { id: 'u2', email: 'org@company.com', displayName: 'Bob Organizer', role: UserRole.ORGANIZER },
  { id: 'u3', email: 'admin@company.com', displayName: 'Charlie Admin', role: UserRole.ADMIN },
];

let MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Q1 All-Hands Meeting',
    description: 'Company wide updates and quarterly goals review.',
    startAt: '2023-11-15T10:00:00',
    endAt: '2023-11-15T12:00:00',
    location: 'Main Auditorium',
    capacity: 200,
    registeredCount: 45
  },
  {
    id: 'e2',
    title: 'Tech Talk: AWS Serverless',
    description: 'Deep dive into Lambda, Fargate and Aurora.',
    startAt: '2023-11-20T14:00:00',
    endAt: '2023-11-20T15:30:00',
    location: 'Meeting Room 301',
    capacity: 50,
    registeredCount: 48
  }
];

let MOCK_REGISTRATIONS: Registration[] = [];

// --- Service Methods ---

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Auth
  login: async (email: string): Promise<User> => {
    await delay(500);
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) throw new Error('User not found');
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
    return [...MOCK_EVENTS];
  },

  getEventById: async (id: string): Promise<Event | undefined> => {
    await delay(200);
    return MOCK_EVENTS.find(e => e.id === id);
  },

  createEvent: async (eventData: Omit<Event, 'id' | 'registeredCount'>): Promise<Event> => {
    await delay(500);
    const newEvent: Event = {
      ...eventData,
      id: `e${Date.now()}`,
      registeredCount: 0
    };
    MOCK_EVENTS.push(newEvent);
    return newEvent;
  },

  // Registration
  registerForEvent: async (userId: string, eventId: string): Promise<Registration> => {
    await delay(600);
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    
    // Simple duplicate check
    const existing = MOCK_REGISTRATIONS.find(r => r.eventId === eventId && r.userId === userId);
    if (existing) throw new Error('Already registered');

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
    
    // Update count
    event.registeredCount += 1;
    
    return newReg;
  },

  // WALK-IN REGISTRATION (New Feature)
  walkInRegister: async (eventId: string, email: string, displayName: string): Promise<CheckInResult> => {
    await delay(800);
    
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    // 1. Find or Create User
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

    // 2. Check existing registration
    let reg = MOCK_REGISTRATIONS.find(r => r.eventId === eventId && r.userId === user!.id);
    
    if (reg) {
      // If already registered but not checked in, check them in
      if (reg.status === RegistrationStatus.CHECKED_IN) {
        return { success: false, message: 'User already checked in.', registration: reg };
      }
      reg.status = RegistrationStatus.CHECKED_IN;
      return { success: true, message: 'Existing registration found. Checked in successfully!', registration: reg };
    }

    // 3. Create new Registration
    const newReg: Registration = {
      id: `r${Date.now()}`,
      eventId,
      userId: user.id,
      eventTitle: event.title,
      eventStartAt: event.startAt,
      status: RegistrationStatus.CHECKED_IN, // Immediate check-in
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

  // Organizer / Check-in
  verifyTicket: async (qrCode: string): Promise<CheckInResult> => {
    await delay(600);
    const regIndex = MOCK_REGISTRATIONS.findIndex(r => r.qrCode === qrCode);
    
    if (regIndex === -1) {
      return { success: false, message: 'Invalid Ticket / QR Code not found.' };
    }

    const reg = MOCK_REGISTRATIONS[regIndex];

    if (reg.status === RegistrationStatus.CHECKED_IN) {
      return { success: false, message: 'Ticket already used / Checked in.', registration: reg };
    }

    if (reg.status === RegistrationStatus.CANCELLED) {
      return { success: false, message: 'Ticket was cancelled.', registration: reg };
    }

    // Update status
    const updatedReg = { ...reg, status: RegistrationStatus.CHECKED_IN };
    MOCK_REGISTRATIONS[regIndex] = updatedReg;

    return { success: true, message: 'Check-in Successful!', registration: updatedReg };
  }
};
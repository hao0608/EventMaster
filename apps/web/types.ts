export enum UserRole {
  MEMBER = 'member',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface Event {
  id: string;
  organizerId: string; // The owner of the event
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: number;
  registeredCount: number;
}

export enum RegistrationStatus {
  REGISTERED = 'registered',
  CHECKED_IN = 'checked_in',
  CANCELLED = 'cancelled'
}

export interface Registration {
  id: string;
  eventId: string;
  eventTitle: string; // Denormalized for display
  eventStartAt: string;
  userId: string;
  status: RegistrationStatus;
  qrCode: string; // The token string
  createdAt: string;
}

// Check-in / Verification
export interface CheckInResult {
  success: boolean;
  message: string;
  registration?: Registration;
}

// For Organizer/Admin View (User details + Registration details)
export interface Attendee extends Registration {
  userDisplayName: string;
  userEmail: string;
}
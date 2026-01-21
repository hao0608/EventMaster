import axios, { AxiosInstance } from 'axios';
import { Attendee, CheckInResult, Event, Registration, User, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type Paginated<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

type EventCreateInput = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  capacity: number;
};

type LoginResponse = {
  user: User;
  accessToken: string;
};

const mapUser = (data: any): User => ({
  id: data.id,
  email: data.email,
  displayName: data.display_name,
  role: data.role,
});

const mapEvent = (data: any): Event => ({
  id: data.id,
  organizerId: data.organizer_id,
  title: data.title,
  description: data.description,
  startAt: data.start_at,
  endAt: data.end_at,
  location: data.location,
  capacity: data.capacity,
  registeredCount: data.registered_count,
  status: data.status,
});

const mapRegistration = (data: any): Registration => ({
  id: data.id,
  eventId: data.event_id,
  eventTitle: data.event_title,
  eventStartAt: data.event_start_at,
  userId: data.user_id,
  status: data.status,
  qrCode: data.qr_code,
  createdAt: data.created_at,
});

const mapAttendee = (data: any): Attendee => ({
  ...mapRegistration(data),
  userDisplayName: data.user_display_name,
  userEmail: data.user_email,
});

const mapCheckInResult = (data: any): CheckInResult => ({
  success: data.success,
  message: data.message,
  registration: data.registration ? mapRegistration(data.registration) : undefined,
});

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/login');
        if (!isAuthRequest && error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('eventmaster_user');
          if (window.location.hash !== '#/') {
            window.location.hash = '#/';
          }
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.client.post('/auth/login', { email, password });
    return {
      user: mapUser(response.data.user),
      accessToken: response.data.access_token,
    };
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get('/auth/me');
    return mapUser(response.data);
  }

  async getEvents(limit = 20, offset = 0): Promise<Paginated<Event>> {
    const response = await this.client.get('/events', { params: { limit, offset } });
    return {
      items: response.data.items.map(mapEvent),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async getEvent(eventId: string): Promise<Event> {
    const response = await this.client.get(`/events/${eventId}`);
    return mapEvent(response.data);
  }

  async createEvent(event: EventCreateInput): Promise<Event> {
    const response = await this.client.post('/events', {
      title: event.title,
      description: event.description,
      start_at: event.startAt,
      end_at: event.endAt,
      location: event.location,
      capacity: event.capacity,
    });
    return mapEvent(response.data);
  }

  async updateEvent(eventId: string, updates: Partial<EventCreateInput>): Promise<Event> {
    const response = await this.client.patch(`/events/${eventId}`, {
      title: updates.title,
      description: updates.description,
      start_at: updates.startAt,
      end_at: updates.endAt,
      location: updates.location,
      capacity: updates.capacity,
    });
    return mapEvent(response.data);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.client.delete(`/events/${eventId}`);
  }

  async getManagedEvents(limit = 20, offset = 0): Promise<Paginated<Event>> {
    const response = await this.client.get('/events/managed', { params: { limit, offset } });
    return {
      items: response.data.items.map(mapEvent),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async getPendingEvents(limit = 20, offset = 0): Promise<Paginated<Event>> {
    const response = await this.client.get('/events/pending', { params: { limit, offset } });
    return {
      items: response.data.items.map(mapEvent),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async approveEvent(eventId: string): Promise<Event> {
    const response = await this.client.patch(`/events/${eventId}/approve`);
    return mapEvent(response.data);
  }

  async rejectEvent(eventId: string): Promise<Event> {
    const response = await this.client.patch(`/events/${eventId}/reject`);
    return mapEvent(response.data);
  }

  async registerForEvent(eventId: string): Promise<Registration> {
    const response = await this.client.post(`/events/${eventId}/registrations`);
    return mapRegistration(response.data);
  }

  async getMyRegistrations(limit = 20, offset = 0): Promise<Paginated<Registration>> {
    const response = await this.client.get('/me/registrations', { params: { limit, offset } });
    return {
      items: response.data.items.map(mapRegistration),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async cancelRegistration(registrationId: string): Promise<void> {
    await this.client.delete(`/registrations/${registrationId}`);
  }

  async verifyTicket(qrCode: string): Promise<CheckInResult> {
    const response = await this.client.post('/verify', { qr_code: qrCode });
    return mapCheckInResult(response.data);
  }

  async walkInRegister(eventId: string, email: string, displayName?: string): Promise<CheckInResult> {
    const response = await this.client.post('/walk-in', {
      event_id: eventId,
      email,
      display_name: displayName,
    });
    return mapCheckInResult(response.data);
  }

  async getEventAttendees(eventId: string, limit = 20, offset = 0): Promise<Paginated<Attendee>> {
    const response = await this.client.get(`/events/${eventId}/attendees`, { params: { limit, offset } });
    return {
      items: response.data.items.map(mapAttendee),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async getUsers(limit = 20, offset = 0): Promise<Paginated<User>> {
    const response = await this.client.get('/users', { params: { limit, offset } });
    return {
      items: response.data.items.map(mapUser),
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const response = await this.client.patch(`/users/${userId}/role`, { role });
    return mapUser(response.data);
  }
}

export const api = new ApiService();

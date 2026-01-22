import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session from local storage for convenience
  useEffect(() => {
    const storedUser = localStorage.getItem('eventmaster_user');
    const token = localStorage.getItem('accessToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      return;
    }

    if (token) {
      api.getCurrentUser()
        .then((currentUser) => setUser(currentUser))
        .catch(() => {
          localStorage.removeItem('accessToken');
        });
    } else {
      localStorage.removeItem('eventmaster_user');
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      localStorage.setItem('eventmaster_user', JSON.stringify(response.user));
      localStorage.setItem('accessToken', response.accessToken);
    } catch (error) {
      console.error(error);
      throw error; // Re-throw to handle in UI
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eventmaster_user');
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

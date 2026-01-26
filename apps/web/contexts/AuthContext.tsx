import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import * as cognitoAuth from '../services/cognitoAuth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Cognito groups to EventMaster roles
const mapCognitoGroupToRole = (groups: string[]): UserRole => {
  if (groups.includes('admin')) return UserRole.ADMIN;
  if (groups.includes('organizer')) return UserRole.ORGANIZER;
  return UserRole.MEMBER;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      // If Cognito is configured, try to restore Cognito session
      if (cognitoAuth.isCognitoConfigured()) {
        try {
          const cognitoUser = await cognitoAuth.getCurrentUser();
          if (cognitoUser) {
            const role = mapCognitoGroupToRole(cognitoUser.groups);
            const user: User = {
              id: cognitoUser.id,
              email: cognitoUser.email,
              displayName: cognitoUser.name || cognitoUser.email.split('@')[0],
              role,
            };
            setUser(user);

            // Store access token in localStorage for API calls
            const accessToken = await cognitoAuth.getAccessToken();
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken);
            }
            return;
          }
        } catch (error) {
          console.error('Error restoring Cognito session:', error);
        }
      }

      // Fallback to legacy session restoration
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
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Try Cognito authentication first if configured
      if (cognitoAuth.isCognitoConfigured()) {
        const response = await cognitoAuth.signIn({ email, password });
        const role = mapCognitoGroupToRole(response.user.groups);

        const user: User = {
          id: response.user.id,
          email: response.user.email,
          displayName: response.user.name || response.user.email.split('@')[0],
          role,
        };

        setUser(user);
        localStorage.setItem('eventmaster_user', JSON.stringify(user));
        localStorage.setItem('accessToken', response.accessToken);
        return;
      }

      // Fallback to legacy authentication
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
    // Sign out from Cognito if configured
    if (cognitoAuth.isCognitoConfigured()) {
      cognitoAuth.signOut();
    }

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

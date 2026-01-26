/**
 * AWS Cognito Authentication Service
 * Feature: 002-dev-deployment-arch - Phase 5 (Cognito Integration)
 *
 * This service handles authentication using AWS Cognito User Pools.
 * Supports login, logout, token refresh, and user session management.
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

// Cognito configuration from environment variables
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'ap-northeast-1';

// Initialize Cognito User Pool
const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID,
});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CognitoAuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    groups: string[];
  };
}

/**
 * Sign in user with email and password
 */
export const signIn = (credentials: LoginCredentials): Promise<CognitoAuthResponse> => {
  return new Promise((resolve, reject) => {
    const { email, password } = credentials;

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session: CognitoUserSession) => {
        const accessToken = session.getAccessToken().getJwtToken();
        const idToken = session.getIdToken().getJwtToken();
        const refreshToken = session.getRefreshToken().getToken();

        // Extract user information from ID token
        const idPayload = session.getIdToken().payload;
        const groups = (idPayload['cognito:groups'] as string[]) || [];

        resolve({
          accessToken,
          idToken,
          refreshToken,
          user: {
            id: idPayload.sub,
            email: idPayload.email,
            name: idPayload.name,
            groups,
          },
        });
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: (userAttributes) => {
        // Handle new password required (temporary password)
        reject(new Error('New password required. Please reset your password.'));
      },
    });
  });
};

/**
 * Sign out the current user
 */
export const signOut = (): void => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
};

/**
 * Get current authenticated user session
 */
export const getCurrentSession = (): Promise<CognitoUserSession | null> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session || !session.isValid()) {
        resolve(null);
        return;
      }

      resolve(session);
    });
  });
};

/**
 * Get current user access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return null;
    }

    return session.getAccessToken().getJwtToken();
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Get current user information
 */
export const getCurrentUser = async (): Promise<CognitoAuthResponse['user'] | null> => {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return null;
    }

    const idPayload = session.getIdToken().payload;
    const groups = (idPayload['cognito:groups'] as string[]) || [];

    return {
      id: idPayload.sub,
      email: idPayload.email,
      name: idPayload.name,
      groups,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Refresh the current session
 */
export const refreshSession = (): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No current user'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('No session'));
        return;
      }

      const refreshToken = session.getRefreshToken();

      cognitoUser.refreshSession(refreshToken, (refreshErr, newSession) => {
        if (refreshErr) {
          reject(refreshErr);
          return;
        }

        resolve(newSession);
      });
    });
  });
};

/**
 * Check if Cognito is configured
 */
export const isCognitoConfigured = (): boolean => {
  return !!(COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID);
};

export default {
  signIn,
  signOut,
  getCurrentSession,
  getAccessToken,
  getCurrentUser,
  refreshSession,
  isCognitoConfigured,
};

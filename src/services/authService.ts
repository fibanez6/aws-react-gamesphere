// Authentication Service
// Abstracts authentication logic for mock/Amplify/direct Cognito

import { fetchAuthSession, getCurrentUser, signIn, signOut, signUp } from 'aws-amplify/auth';
import envConfig, { debugError, debugLog } from '../config/environment';
import { mockCurrentUser } from '../data/mockData';
import { User } from '../types';
import { cognitoAuthService } from './cognitoAuthService';

const STORAGE_KEY = 'gamesphere_user';

// Mock authentication functions
const mockAuthService = {
  async getCurrentUser(): Promise<User | null> {
    debugLog('Mock: Checking auth state');
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      return JSON.parse(savedUser) as User;
    }
    return null;
  },

  async signIn(email: string, _password: string): Promise<User> {
    debugLog('Mock: Signing in user', email);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));
    const mockUser: User = { ...mockCurrentUser, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  },

  async signUp(email: string, _password: string, username: string): Promise<User> {
    debugLog('Mock: Signing up user', { email, username });
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));
    const newUser: User = {
      ...mockCurrentUser,
      id: `user_${Date.now()}`,
      email,
      username,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async signOut(): Promise<void> {
    debugLog('Mock: Signing out user');
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Real AWS Cognito authentication functions
const amplifyAuthService = {
  async getCurrentUser(): Promise<User | null> {
    debugLog('Amplify: Checking auth state');
    try {
      const { username, userId } = await getCurrentUser();
      // Fetch session to validate authentication
      await fetchAuthSession();
      
      // Build user from Cognito attributes
      const user: User = {
        id: userId,
        username: username,
        email: '', // Will be populated from user attributes
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        level: 1,
        rank: 'Bronze',
        xp: 0,
        xpToNextLevel: 1000,
        isOnline: true,
        isPublicProfile: true,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };

      // Cache in localStorage for quick access
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      debugLog('Amplify: User authenticated', { userId, username });
      return user;
    } catch (error) {
      debugLog('Amplify: No authenticated user');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<User> {
    debugLog('Amplify: Signing in user', email);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      
      if (!isSignedIn) {
        debugLog('Amplify: Sign in requires additional step', nextStep);
        throw new Error(`Sign in requires: ${nextStep.signInStep}`);
      }

      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Failed to get user after sign in');
      }
      return user;
    } catch (error) {
      debugError('Amplify: Sign in error', error);
      throw error;
    }
  },

  async signUp(email: string, password: string, username: string): Promise<User> {
    debugLog('Amplify: Signing up user', { email, username });
    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            preferred_username: username,
          },
        },
      });

      if (!isSignUpComplete) {
        debugLog('Amplify: Sign up requires confirmation', nextStep);
        // User needs to confirm their email before they can sign in
        throw new Error(`Please confirm your email. Check your inbox for a verification code.`);
      }

      // Auto sign in after signup
      return await this.signIn(email, password);
    } catch (error) {
      debugError('Amplify: Sign up error', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    debugLog('Amplify: Signing out user');
    try {
      await signOut();
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      debugError('Amplify: Sign out error', error);
      throw error;
    }
  },
};

// Export the appropriate service based on environment
const getAuthService = () => {
  debugLog(`Auth provider: ${envConfig.authProvider}`);
  
  switch (envConfig.authProvider) {
    case 'mock':
      return mockAuthService;
    case 'amplify':
      return amplifyAuthService;
    case 'cognito':
      return cognitoAuthService;
    default:
      return mockAuthService;
  }
};

export const authService = getAuthService();

export default authService;

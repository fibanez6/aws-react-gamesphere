// Mock Authentication Service Implementation
// Used when VITE_USE_MOCK_DATA is true

import envConfig, { debugLog } from '../../config/environment';
import { mockCurrentUser } from '../../data/mockData';
import { User } from '../../types';

const STORAGE_KEY = 'gamesphere_user';

// Mock authentication functions
export const mockAuthService = {
  async getCurrentUser(): Promise<User | null> {
    debugLog('AuthService: Checking auth state');
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      return JSON.parse(savedUser) as User;
    }
    return null;
  },

  async signIn(email: string, _password: string): Promise<User> {
    debugLog('AuthService: Signing in user', email);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));
    const mockUser: User = { ...mockCurrentUser, email };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    return mockUser;
  },

  async signUp(email: string, _password: string, username: string): Promise<User> {
    debugLog('AuthService: Signing up user', { email, username });
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
    debugLog('AuthService: Signing out user');
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default mockAuthService;

// Mock User Service Implementation
// Used when VITE_USE_MOCK_DATA is true

import envConfig, { debugLog } from '../../config/environment';
import {
  mockAchievements,
  mockActivities,
  mockCurrentUser,
  mockFriends,
  mockGameStats,
  mockPlayerStats,
} from '../../data/mockData';
import {
  Activity,
  Friend,
  PlayerStats,
  User,
} from '../../types';
import type { PaginatedResponse, PlayerProfile } from '../userService.types.ts';

// Simulate network delay for mock mode
const mockDelay = () => new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));

export const mockUserService = {
  async getUser(): Promise<User | null> {
    debugLog('Mock: Getting current user');
    await mockDelay();
    return mockCurrentUser;
  },

  async getUserStats(userId: string): Promise<PlayerStats | null> {
    debugLog('Mock: Getting user stats', { userId });
    await mockDelay();
    return { ...mockPlayerStats, userId };
  },

  async getRecentActivities(
    userId: string,
    limit = 10,
    _nextToken?: string
  ): Promise<PaginatedResponse<Activity>> {
    debugLog('Mock: Getting recent activities', { userId, limit });
    await mockDelay();
    const userActivities = mockActivities.filter(
      a => a.userId === userId || a.userId === 'user_001'
    );
    return {
      items: userActivities.slice(0, limit),
      totalCount: userActivities.length,
    };
  },

  async getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
    debugLog('Mock: Getting player profile', { playerId });
    await mockDelay();
    
    // Find if it's the current user or a friend
    let user: User;
    if (playerId === mockCurrentUser.id || playerId === 'user_001') {
      user = mockCurrentUser;
    } else {
      const friend = mockFriends.find(f => f.id === playerId);
      if (!friend) return null;
      user = {
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        email: '',
        level: friend.level,
        rank: 'Gold',
        xp: friend.level * 100,
        xpToNextLevel: (friend.level + 1) * 100,
        isOnline: friend.isOnline,
        isPublicProfile: true,
        createdAt: '2023-01-01T00:00:00Z',
        lastActiveAt: friend.lastActiveAt,
      };
    }

    return {
      user,
      stats: { ...mockPlayerStats, userId: playerId },
      gameStats: mockGameStats,
      achievements: mockAchievements,
    };
  },

  async getFriends(
    userId: string,
    limit = 20,
    _nextToken?: string
  ): Promise<PaginatedResponse<Friend>> {
    debugLog('Mock: Getting friends', { userId, limit });
    await mockDelay();
    return {
      items: mockFriends.slice(0, limit),
      totalCount: mockFriends.length,
    };
  },

  async searchUsers(query: string, limit = 10): Promise<PaginatedResponse<User>> {
    debugLog('Mock: Searching users', { query, limit });
    await mockDelay();
    
    const lowerQuery = query.toLowerCase();
    const matchingFriends = mockFriends
      .filter(f => f.username.toLowerCase().includes(lowerQuery))
      .map(f => ({
        id: f.id,
        username: f.username,
        avatar: f.avatar,
        email: '',
        level: f.level,
        rank: 'Gold',
        xp: f.level * 100,
        xpToNextLevel: (f.level + 1) * 100,
        isOnline: f.isOnline,
        isPublicProfile: true,
        createdAt: '2023-01-01T00:00:00Z',
        lastActiveAt: f.lastActiveAt,
      }));
    
    return {
      items: matchingFriends.slice(0, limit),
      totalCount: matchingFriends.length,
    };
  },
};

export default mockUserService;

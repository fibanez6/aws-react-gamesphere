// User Service
// Retrieves user data from mock or GraphQL based on environment

import { generateClient } from 'aws-amplify/api';
import envConfig, { debugError, debugLog } from '../config/environment';
import {
  mockAchievements,
  mockActivities,
  mockCurrentUser,
  mockFriends,
  mockGameStats,
  mockGames,
  mockLeaderboard,
  mockLiveSessions,
  mockPlayerStats,
} from '../data/mockData';
import {
  getCurrentUser,
  getFriends,
  getGameDetails,
  getLeaderboard,
  getLiveSessions,
  getPlayerProfile,
  getRecentActivities,
  getUserStats,
  listTopGames,
  searchUsers,
} from '../graphql/queries';
import {
  Achievement,
  Activity,
  Friend,
  Game,
  GameSession,
  GameStats,
  LeaderboardEntry,
  PlayerStats,
  User,
} from '../types';
import { authService } from './authService';

// Types for paginated responses
interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  totalCount?: number;
}

interface PlayerProfile {
  user: User;
  stats: PlayerStats;
  gameStats: GameStats[];
  achievements: Achievement[];
}

// Simulate network delay for mock mode
const mockDelay = () => new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));

// Get GraphQL client (only used in non-mock mode)
const getClient = () => {
  if (envConfig.useMockData) {
    throw new Error('GraphQL client should not be used in mock mode');
  }
  return generateClient();
};

// ============================================
// Mock Service Implementation
// ============================================
const mockUserService = {
  async getCurrentUser(): Promise<User | null> {
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

  async getTopGames(
    filter?: { genre?: string; platform?: string },
    limit = 10,
    _nextToken?: string
  ): Promise<PaginatedResponse<Game>> {
    debugLog('Mock: Getting top games', { filter, limit });
    await mockDelay();
    
    let games = [...mockGames];
    if (filter?.genre) {
      games = games.filter(g => g.genre.toLowerCase() === filter.genre?.toLowerCase());
    }
    if (filter?.platform) {
      games = games.filter(g => g.platform.includes(filter.platform!));
    }
    
    return {
      items: games.slice(0, limit),
      totalCount: games.length,
    };
  },

  async getGameDetails(gameId: string): Promise<Game | null> {
    debugLog('Mock: Getting game details', { gameId });
    await mockDelay();
    return mockGames.find(g => g.id === gameId) || null;
  },

  async getLeaderboard(
    type: 'global' | 'friends' | 'game',
    metric: 'xp' | 'wins' | 'playtime' | 'achievements',
    options?: { gameId?: string; timeRange?: string; limit?: number }
  ): Promise<PaginatedResponse<LeaderboardEntry>> {
    debugLog('Mock: Getting leaderboard', { type, metric, options });
    await mockDelay();
    
    const limit = options?.limit || 10;
    return {
      items: mockLeaderboard.slice(0, limit),
      totalCount: mockLeaderboard.length,
    };
  },

  async getLiveSessions(
    filter?: { friendsOnly?: boolean; gameId?: string },
    limit = 10,
    _nextToken?: string
  ): Promise<PaginatedResponse<GameSession>> {
    debugLog('Mock: Getting live sessions', { filter, limit });
    await mockDelay();
    
    let sessions = mockLiveSessions.filter(s => s.isLive);
    if (filter?.gameId) {
      sessions = sessions.filter(s => s.gameId === filter.gameId);
    }
    
    return {
      items: sessions.slice(0, limit),
      totalCount: sessions.length,
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

// ============================================
// GraphQL Service Implementation
// ============================================
const graphqlUserService = {
  async getCurrentUser(): Promise<User | null> {
    const { username, id } = await authService.getCurrentUser() || {};
    debugLog('GraphQL: Getting current user', { username, userId: id });
    try {
      const client = getClient();
      
      const result = await client.graphql({
        query: getCurrentUser,
        variables: { userId: id },
      });
      return (result as any).data?.getCurrentUser || null;
    } catch (error) {
      debugError('GraphQL: Error getting current user', error);
      throw error;
    }
  },

  async getUserStats(userId: string): Promise<PlayerStats | null> {
    debugLog('GraphQL: Getting user stats', { userId });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getUserStats,
        variables: { userId },
      });
      const data = (result as any).data?.getPlayerStats;
      debugLog('GraphQL: User stats result', { data });
      return data || null;
    } catch (error) {
      debugError('GraphQL: Error getting user stats', error);
      throw error;
    }
  },

  async getRecentActivities(
    userId: string,
    limit = 10,
    nextToken?: string
  ): Promise<PaginatedResponse<Activity>> {
    debugLog('GraphQL: Getting recent activities', { userId, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getRecentActivities,
        variables: { userId, limit, nextToken },
      });
      const data = (result as any).data?.getRecentActivities;
      return {
        items: data?.items || [],
        nextToken: data?.nextToken,
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting recent activities', error);
      throw error;
    }
  },

  async getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
    debugLog('GraphQL: Getting player profile', { playerId });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getPlayerProfile,
        variables: { playerId },
      });
      return (result as any).data?.getPlayerProfile || null;
    } catch (error) {
      debugError('GraphQL: Error getting player profile', error);
      throw error;
    }
  },

  async getFriends(
    userId: string,
    limit = 20,
    nextToken?: string
  ): Promise<PaginatedResponse<Friend>> {
    debugLog('GraphQL: Getting friends', { userId, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getFriends,
        variables: { userId, limit, nextToken },
      });
      const data = (result as any).data?.getFriends;
      return {
        items: data?.items || [],
        nextToken: data?.nextToken,
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting friends', error);
      throw error;
    }
  },

  async getTopGames(
    filter?: { genre?: string; platform?: string },
    limit = 10,
    nextToken?: string
  ): Promise<PaginatedResponse<Game>> {
    debugLog('GraphQL: Getting top games', { filter, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: listTopGames,
        variables: { filter, limit, nextToken },
      });
      const data = (result as any).data?.listTopGames;
      return {
        items: data?.items || [],
        nextToken: data?.nextToken,
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting top games', error);
      throw error;
    }
  },

  async getGameDetails(gameId: string): Promise<Game | null> {
    debugLog('GraphQL: Getting game details', { gameId });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getGameDetails,
        variables: { gameId },
      });
      return (result as any).data?.getGameDetails || null;
    } catch (error) {
      debugError('GraphQL: Error getting game details', error);
      throw error;
    }
  },

  async getLeaderboard(
    type: 'global' | 'friends' | 'game',
    metric: 'xp' | 'wins' | 'playtime' | 'achievements',
    options?: { gameId?: string; timeRange?: string; limit?: number }
  ): Promise<PaginatedResponse<LeaderboardEntry>> {
    debugLog('GraphQL: Getting leaderboard', { type, metric, options });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getLeaderboard,
        variables: {
          type: type.toUpperCase(),
          metric: metric.toUpperCase(),
          gameId: options?.gameId,
          timeRange: options?.timeRange,
          limit: options?.limit || 10,
        },
      });
      const data = (result as any).data?.getLeaderboard;
      return {
        items: data?.items || [],
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting leaderboard', error);
      throw error;
    }
  },

  async getLiveSessions(
    filter?: { friendsOnly?: boolean; gameId?: string },
    limit = 10,
    nextToken?: string
  ): Promise<PaginatedResponse<GameSession>> {
    debugLog('GraphQL: Getting live sessions', { filter, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getLiveSessions,
        variables: { filter, limit, nextToken },
      });
      const data = (result as any).data?.getLiveSessions;
      return {
        items: data?.items || [],
        nextToken: data?.nextToken,
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting live sessions', error);
      throw error;
    }
  },

  async searchUsers(query: string, limit = 10): Promise<PaginatedResponse<User>> {
    debugLog('GraphQL: Searching users', { query, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: searchUsers,
        variables: { query, limit },
      });
      const data = (result as any).data?.searchUsers;
      return {
        items: data?.items || [],
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error searching users', error);
      throw error;
    }
  },
};

// ============================================
// Export the appropriate service based on environment
// ============================================
const getUserService = () => {
  debugLog(`User service provider: ${envConfig.useMockData ? 'mock' : 'graphql'}`);
  return envConfig.useMockData ? mockUserService : graphqlUserService;
};

export const userService = getUserService();

// Also export types for convenience
export type { PaginatedResponse, PlayerProfile };

export default userService;

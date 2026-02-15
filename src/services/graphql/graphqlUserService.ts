// GraphQL User Service Implementation
// Used when VITE_USE_MOCK_DATA is false

import { generateClient } from 'aws-amplify/api';
import { debugError, debugLog } from '../../config/environment';
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
} from '../../graphql/queries';
import {
  Activity,
  Friend,
  Game,
  GameSession,
  LeaderboardEntry,
  PlayerStats,
  User,
} from '../../types';
import { authService } from '../authService';
import type { PaginatedResponse, PlayerProfile } from '../userService.types.ts';

// Get GraphQL client
const getClient = () => generateClient();

export const graphqlUserService = {
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

export default graphqlUserService;

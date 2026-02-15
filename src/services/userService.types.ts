// Shared types for User Service implementations

import {
  Achievement,
  Activity,
  GameStats,
  PlayerStats,
  User,
} from '../types';

// Types for paginated responses
export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  totalCount?: number;
}

export interface PlayerProfile {
  user: User;
  stats: PlayerStats;
  gameStats: GameStats[];
  achievements: Achievement[];
  recentActivity: Activity[];
}

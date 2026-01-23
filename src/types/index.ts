// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  rank: string;
  xp: number;
  xpToNextLevel: number;
  isOnline: boolean;
  isPublicProfile: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// Player Stats Types
export interface PlayerStats {
  userId: string;
  totalHoursPlayed: number;
  gamesOwned: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  winRate: number;
  totalWins: number;
  totalMatches: number;
  favoriteGame: string;
  weeklyPlaytime: number[];
  monthlyPlaytime: number[];
}

// Game Types
export interface Game {
  id: string;
  name: string;
  coverImage: string;
  genre: string;
  platform: string[];
  activePlayers: number;
  avgPlaytime: number;
  rating: number;
  description: string;
  releaseDate: string;
}

export interface GameStats {
  gameId: string;
  gameName: string;
  hoursPlayed: number;
  winRate: number;
  rank: string;
  lastPlayed: string;
  achievements: number;
  totalAchievements: number;
}

// Game Session Types
export interface GameSession {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  gameId: string;
  gameName: string;
  gameImage: string;
  startedAt: string;
  duration: number;
  isLive: boolean;
}

// Friend Types
export interface Friend {
  id: string;
  username: string;
  avatar: string;
  level: number;
  isOnline: boolean;
  currentGame?: string;
  lastActiveAt: string;
  status: 'online' | 'offline' | 'in-game' | 'away';
}

export interface FriendRequest {
  id: string;
  fromUser: User;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  gameId?: string;
  gameName?: string;
}

// Activity Types
export interface Activity {
  id: string;
  type: 'game_played' | 'achievement_unlocked' | 'friend_added' | 'level_up' | 'rank_up';
  userId: string;
  username: string;
  avatar: string;
  description: string;
  metadata: {
    gameId?: string;
    gameName?: string;
    achievementId?: string;
    achievementName?: string;
    newLevel?: number;
    newRank?: string;
    duration?: number;
  };
  createdAt: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  score: number;
  metric: string;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
}

export type LeaderboardType = 'global' | 'friends' | 'game';
export type LeaderboardMetric = 'hours' | 'wins' | 'achievements' | 'winrate';

export interface LeaderboardFilter {
  type: LeaderboardType;
  metric: LeaderboardMetric;
  gameId?: string;
  timeRange?: '24h' | '7d' | '30d' | 'all';
}

// Filter Types
export interface GameFilter {
  genre?: string;
  platform?: string;
  timeRange?: '24h' | '7d' | '30d';
  sortBy?: 'activePlayers' | 'avgPlaytime' | 'rating';
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  totalCount: number;
}

// Subscription Event Types
export interface FriendStatusChangeEvent {
  friendId: string;
  isOnline: boolean;
  status: Friend['status'];
  currentGame?: string;
}

export interface FriendActivityEvent {
  activity: Activity;
}

export interface LiveSessionEvent {
  type: 'started' | 'ended' | 'updated';
  session: GameSession;
}

#!/usr/bin/env node

/**
 * GameSphere - Seed Data Script
 * 
 * This script populates AWS DynamoDB tables with demo data.
 * Can also use AppSync GraphQL mutations if configured.
 * 
 * Usage:
 *   node scripts/seed-data.js [--mode=dynamodb|graphql] [--clear]
 * 
 * Options:
 *   --mode=dynamodb   Use DynamoDB directly (default)
 *   --mode=graphql    Use AppSync GraphQL mutations
 *   --clear           Clear existing data before seeding
 *   --tables=users,games  Seed specific tables only
 * 
 * Environment variables (from .env or AWS profile):
 *   AWS_REGION
 *   AWS_PROFILE (optional)
 *   DYNAMODB_TABLE_PREFIX (optional, default: 'GameSphere')
 *   APPSYNC_ENDPOINT (required for graphql mode)
 *   APPSYNC_API_KEY (required for graphql mode)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import {
    BatchWriteCommand,
    DeleteCommand,
    DynamoDBDocumentClient,
    PutCommand,
    ScanCommand
} from '@aws-sdk/lib-dynamodb';
import dotenv from 'dotenv';
import fs from 'node:fs';
import os from 'node:os';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

dotenv.config();

const getMfaCode = async () => {
  const rl = readline.createInterface({ input, output });
  const code = await rl.question('Enter MFA code: ');
  rl.close();
  return code.trim();
};

const profileHasSessionToken = (profile) => {
  try {
    const credentialsPath = `${os.homedir()}/.aws/credentials`;
    if (!fs.existsSync(credentialsPath)) {
      return false;
    }
    const content = fs.readFileSync(credentialsPath, 'utf8');
    const pattern = new RegExp(`\\[${profile}\\]([\\s\\S]*?)(?=\\n\\[|$)`, 'm');
    const match = content.match(pattern);
    if (!match) {
      return false;
    }
    return /aws_session_token\s*=\s*\S+/.test(match[1]);
  } catch {
    return false;
  }
};

// ============================================
// Configuration
// ============================================
const config = {
  region: process.env.AWS_REGION || process.env.VITE_AWS_REGION || 'ap-southeast-2',
  tablePrefix: `${process.env.DYNAMODB_TABLE_PREFIX || 'fi-gamesphere'}-dev`,
  mode: 'dynamodb',
  clear: false,
  tables: null, // null = all tables
};

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--mode=')) {
    config.mode = arg.split('=')[1];
  } else if (arg === '--clear') {
    config.clear = true;
  } else if (arg.startsWith('--tables=')) {
    config.tables = arg.split('=')[1].split(',');
  }
});

// ============================================
// Demo Data (matching mockData.ts)
// ============================================

const users = [
  {
    id: 'user_001',
    username: 'ShadowBlade',
    email: 'shadow@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',
    level: 42,
    rank: 'Diamond',
    xp: 8750,
    xpToNextLevel: 10000,
    isOnline: true,
    isPublicProfile: true,
    createdAt: '2023-01-15T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#42',
  },
  {
    id: 'user_100',
    username: 'ProGamer',
    email: 'progamer@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',
    level: 99,
    rank: 'Grandmaster',
    xp: 99000,
    xpToNextLevel: 100000,
    isOnline: true,
    isPublicProfile: true,
    createdAt: '2022-06-01T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#99',
  },
  {
    id: 'friend_001',
    username: 'NightHawk',
    email: 'nighthawk@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',
    level: 38,
    rank: 'Platinum',
    xp: 3800,
    xpToNextLevel: 4000,
    isOnline: true,
    isPublicProfile: true,
    createdAt: '2023-02-20T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#38',
  },
  {
    id: 'friend_002',
    username: 'PixelQueen',
    email: 'pixelqueen@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',
    level: 55,
    rank: 'Diamond',
    xp: 5500,
    xpToNextLevel: 6000,
    isOnline: true,
    isPublicProfile: true,
    createdAt: '2023-01-10T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#55',
  },
  {
    id: 'friend_003',
    username: 'ThunderBolt',
    email: 'thunderbolt@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',
    level: 29,
    rank: 'Gold',
    xp: 2900,
    xpToNextLevel: 3000,
    isOnline: false,
    isPublicProfile: true,
    createdAt: '2023-03-15T10:00:00Z',
    lastActiveAt: '2025-01-23T10:30:00Z',
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#29',
  },
  {
    id: 'friend_004',
    username: 'StormRider',
    email: 'stormrider@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',
    level: 47,
    rank: 'Diamond',
    xp: 4700,
    xpToNextLevel: 5000,
    isOnline: true,
    isPublicProfile: true,
    createdAt: '2023-02-01T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#47',
  },
  {
    id: 'friend_005',
    username: 'CyberWolf',
    email: 'cyberwolf@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberWolf',
    level: 33,
    rank: 'Gold',
    xp: 3300,
    xpToNextLevel: 3500,
    isOnline: false,
    isPublicProfile: true,
    createdAt: '2023-04-01T10:00:00Z',
    lastActiveAt: '2025-01-22T18:00:00Z',
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#33',
  },
  {
    id: 'friend_006',
    username: 'DragonSlayer',
    email: 'dragonslayer@gamesphere.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',
    level: 61,
    rank: 'Diamond',
    xp: 6100,
    xpToNextLevel: 6500,
    isOnline: true,
    isPublicProfile: true,
    createdAt: '2022-12-01T10:00:00Z',
    lastActiveAt: new Date().toISOString(),
    GSI1PK: 'USERS',
    GSI1SK: 'LEVEL#61',
  },
];

const games = [
  {
    id: 'game_001',
    name: 'Elden Ring',
    coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300',
    genre: 'Action RPG',
    platform: ['PC', 'PlayStation', 'Xbox'],
    activePlayers: 125000,
    avgPlaytime: 85,
    rating: 4.9,
    description: 'An epic action RPG adventure through the Lands Between.',
    releaseDate: '2022-02-25',
    GSI1PK: 'GAMES',
    GSI1SK: 'PLAYERS#125000',
  },
  {
    id: 'game_002',
    name: 'Cyberpunk 2077',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300',
    genre: 'Action RPG',
    platform: ['PC', 'PlayStation', 'Xbox'],
    activePlayers: 89000,
    avgPlaytime: 72,
    rating: 4.5,
    description: 'An open-world action adventure in Night City.',
    releaseDate: '2020-12-10',
    GSI1PK: 'GAMES',
    GSI1SK: 'PLAYERS#089000',
  },
  {
    id: 'game_003',
    name: 'Valorant',
    coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300',
    genre: 'FPS',
    platform: ['PC'],
    activePlayers: 450000,
    avgPlaytime: 120,
    rating: 4.7,
    description: 'A tactical shooter with unique agent abilities.',
    releaseDate: '2020-06-02',
    GSI1PK: 'GAMES',
    GSI1SK: 'PLAYERS#450000',
  },
  {
    id: 'game_004',
    name: 'League of Legends',
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300',
    genre: 'MOBA',
    platform: ['PC'],
    activePlayers: 850000,
    avgPlaytime: 150,
    rating: 4.6,
    description: 'The most popular MOBA game in the world.',
    releaseDate: '2009-10-27',
    GSI1PK: 'GAMES',
    GSI1SK: 'PLAYERS#850000',
  },
  {
    id: 'game_005',
    name: 'Minecraft',
    coverImage: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300',
    genre: 'Sandbox',
    platform: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
    activePlayers: 380000,
    avgPlaytime: 200,
    rating: 4.8,
    description: 'Build and explore infinite worlds.',
    releaseDate: '2011-11-18',
    GSI1PK: 'GAMES',
    GSI1SK: 'PLAYERS#380000',
  },
  {
    id: 'game_006',
    name: 'Fortnite',
    coverImage: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=300',
    genre: 'Battle Royale',
    platform: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
    activePlayers: 520000,
    avgPlaytime: 95,
    rating: 4.4,
    description: "The world's most popular battle royale game.",
    releaseDate: '2017-07-25',
    GSI1PK: 'GAMES',
    GSI1SK: 'PLAYERS#520000',
  },
];

const playerStats = [];
// Generate random player stats for all users
users.slice(1).forEach(user => {
    const totalMatches = Math.floor(Math.random() * 3000) + 500;
    const totalWins = Math.floor(totalMatches * (0.3 + Math.random() * 0.4));
    const totalHoursPlayed = Math.floor(Math.random() * 2000) + 200;
    const gameId = games[Math.floor(Math.random() * games.length)].id;
    
    playerStats.push({
        userId: user.id,
        gameId,
        achievementsUnlocked: Math.floor(Math.random() * 400) + 50,
        totalHoursPlayed,
        totalAchievements: 500,
        winRate: parseFloat((totalWins / totalMatches).toFixed(2)),
        totalWins,
        totalMatches,
        favoriteGame: games.find(game => game.id === gameId).name,
        weeklyPlaytime: Array.from({ length: 7 }, () => parseFloat((Math.random() * 10).toFixed(1))),
        monthlyPlaytime: Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20),
        currentStreak: Math.floor(Math.random() * 30) + 1,
        longestStreak: Math.floor(Math.random() * 100) + 30,
    });
});

const friendships = [
  { id: 'friendship_001', PK: 'USER#user_001', SK: 'FRIEND#friend_001', userId: 'user_001', friendId: 'friend_001', status: 'accepted', createdAt: '2023-02-20T10:00:00Z' },
  { id: 'friendship_002', PK: 'USER#user_001', SK: 'FRIEND#friend_002', userId: 'user_001', friendId: 'friend_002', status: 'accepted', createdAt: '2023-01-15T10:00:00Z' },
  { id: 'friendship_003', PK: 'USER#user_001', SK: 'FRIEND#friend_003', userId: 'user_001', friendId: 'friend_003', status: 'accepted', createdAt: '2023-03-20T10:00:00Z' },
  { id: 'friendship_004', PK: 'USER#user_001', SK: 'FRIEND#friend_004', userId: 'user_001', friendId: 'friend_004', status: 'accepted', createdAt: '2023-02-05T10:00:00Z' },
  { id: 'friendship_005', PK: 'USER#user_001', SK: 'FRIEND#friend_005', userId: 'user_001', friendId: 'friend_005', status: 'accepted', createdAt: '2023-04-10T10:00:00Z' },
  { id: 'friendship_006', PK: 'USER#user_001', SK: 'FRIEND#friend_006', userId: 'user_001', friendId: 'friend_006', status: 'accepted', createdAt: '2022-12-15T10:00:00Z' },
];

const gameStats = [
  { id: 'gamestats_001', PK: 'USER#user_001', SK: 'GAME#game_001', userId: 'user_001', gameId: 'game_001', gameName: 'Elden Ring', hoursPlayed: 342, winRate: 0.45, rank: 'Platinum', lastPlayed: new Date().toISOString(), achievements: 45, totalAchievements: 50 },
  { id: 'gamestats_002', PK: 'USER#user_001', SK: 'GAME#game_003', userId: 'user_001', gameId: 'game_003', gameName: 'Valorant', hoursPlayed: 520, winRate: 0.58, rank: 'Diamond', lastPlayed: new Date(Date.now() - 86400000).toISOString(), achievements: 28, totalAchievements: 40 },
  { id: 'gamestats_003', PK: 'USER#user_001', SK: 'GAME#game_004', userId: 'user_001', gameId: 'game_004', gameName: 'League of Legends', hoursPlayed: 285, winRate: 0.52, rank: 'Gold', lastPlayed: new Date(Date.now() - 259200000).toISOString(), achievements: 35, totalAchievements: 60 },
];

const achievements = [
  { id: 'ach_001', name: 'First Blood', description: 'Win your first match', icon: '🏆', rarity: 'common', unlockedAt: '2023-01-20T15:30:00Z', gameId: 'game_003', gameName: 'Valorant', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#common' },
  { id: 'ach_002', name: 'Elden Lord', description: 'Complete the main story', icon: '👑', rarity: 'legendary', unlockedAt: '2023-03-15T22:45:00Z', gameId: 'game_001', gameName: 'Elden Ring', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#legendary' },
  { id: 'ach_003', name: 'Sharpshooter', description: 'Get 100 headshots', icon: '🎯', rarity: 'rare', unlockedAt: '2023-02-10T14:20:00Z', gameId: 'game_003', gameName: 'Valorant', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#rare' },
  { id: 'ach_004', name: 'Speedrunner', description: 'Complete a level in under 5 minutes', icon: '⚡', rarity: 'epic', unlockedAt: '2023-04-05T11:15:00Z', gameId: 'game_001', gameName: 'Elden Ring', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#epic' },
  { id: 'ach_005', name: 'Social Butterfly', description: 'Add 50 friends', icon: '🦋', rarity: 'rare', unlockedAt: '2023-05-20T09:00:00Z', gameId: null, gameName: null, GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#rare' },
  { id: 'ach_006', name: 'Veteran Player', description: 'Play for 1000 hours total', icon: '🎖️', rarity: 'legendary', unlockedAt: '2024-08-10T20:30:00Z', gameId: null, gameName: null, GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#legendary' },
];

const activities = [
  { id: 'act_001', PK: 'USER#user_001', SK: `ACTIVITY#${new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()}`, type: 'game_played', userId: 'user_001', username: 'ShadowBlade', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', description: 'You played Elden Ring', gameId: 'game_001', gameName: 'Elden Ring', duration: 120, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), GSI1PK: 'ACTIVITIES', GSI1SK: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'act_002', PK: 'USER#friend_001', SK: `ACTIVITY#${new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()}`, type: 'achievement_unlocked', userId: 'friend_001', username: 'NightHawk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk', description: 'NightHawk unlocked "Dragon Slayer"', achievementId: 'ach_007', achievementName: 'Dragon Slayer', gameName: 'Elden Ring', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), GSI1PK: 'ACTIVITIES', GSI1SK: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'act_003', PK: 'USER#friend_002', SK: `ACTIVITY#${new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()}`, type: 'level_up', userId: 'friend_002', username: 'PixelQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen', description: 'PixelQueen reached Level 55', newLevel: 55, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), GSI1PK: 'ACTIVITIES', GSI1SK: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: 'act_004', PK: 'USER#friend_004', SK: `ACTIVITY#${new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()}`, type: 'game_played', userId: 'friend_004', username: 'StormRider', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider', description: 'StormRider played Valorant for 3 hours', gameId: 'game_003', gameName: 'Valorant', duration: 180, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), GSI1PK: 'ACTIVITIES', GSI1SK: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: 'act_005', PK: 'USER#user_001', SK: `ACTIVITY#${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`, type: 'rank_up', userId: 'user_001', username: 'ShadowBlade', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', description: 'You reached Diamond rank!', newRank: 'Diamond', gameName: 'Valorant', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), GSI1PK: 'ACTIVITIES', GSI1SK: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

const liveSessions = [
  { id: 'session_001', PK: 'SESSION#session_001', SK: 'LIVE', userId: 'friend_001', username: 'NightHawk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk', gameId: 'game_001', gameName: 'Elden Ring', gameImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), duration: 45, isLive: true, GSI1PK: 'LIVE_SESSIONS', GSI1SK: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'session_002', PK: 'SESSION#session_002', SK: 'LIVE', userId: 'friend_004', username: 'StormRider', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider', gameId: 'game_003', gameName: 'Valorant', gameImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300', startedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(), duration: 120, isLive: true, GSI1PK: 'LIVE_SESSIONS', GSI1SK: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
  { id: 'session_003', PK: 'SESSION#session_003', SK: 'LIVE', userId: 'friend_002', username: 'PixelQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen', gameId: 'game_005', gameName: 'Minecraft', gameImage: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300', startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), duration: 30, isLive: true, GSI1PK: 'LIVE_SESSIONS', GSI1SK: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
];

const leaderboard = [
  { id: 'lb_001', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#001', rank: 1, userId: 'user_100', username: 'ProGamer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer', level: 99, score: 5420, metric: 'hours', change: 'same', changeAmount: 0 },
  { id: 'lb_002', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#002', rank: 2, userId: 'user_101', username: 'EliteWarrior', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior', level: 95, score: 4890, metric: 'hours', change: 'up', changeAmount: 2 },
  { id: 'lb_003', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#003', rank: 3, userId: 'user_102', username: 'NinjaKing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing', level: 92, score: 4520, metric: 'hours', change: 'down', changeAmount: 1 },
  { id: 'lb_004', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#004', rank: 4, userId: 'friend_006', username: 'DragonSlayer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer', level: 61, score: 3200, metric: 'hours', change: 'up', changeAmount: 3 },
  { id: 'lb_005', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#005', rank: 5, userId: 'friend_002', username: 'PixelQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen', level: 55, score: 2890, metric: 'hours', change: 'same', changeAmount: 0 },
  { id: 'lb_006', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#006', rank: 6, userId: 'friend_004', username: 'StormRider', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider', level: 47, score: 2450, metric: 'hours', change: 'up', changeAmount: 1 },
  { id: 'lb_007', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#007', rank: 7, userId: 'user_001', username: 'ShadowBlade', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', level: 42, score: 1247, metric: 'hours', change: 'up', changeAmount: 5 },
  { id: 'lb_008', PK: 'LEADERBOARD#GLOBAL#XP', SK: 'RANK#008', rank: 8, userId: 'friend_001', username: 'NightHawk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk', level: 38, score: 980, metric: 'hours', change: 'down', changeAmount: 2 },
];

// ============================================
// Table definitions
// ============================================
const tableData = {
  users: { tableName: 'users', data: users, keyField: 'id' },
  games: { tableName: 'games', data: games, keyField: 'id' },
  playerStats: { tableName: 'player-stats', data: playerStats, keyField: 'id' },
//   friendships: { tableName: 'friends', data: friendships, keyField: 'id' },
//   gameStats: { tableName: 'gameStats', data: gameStats, keyField: 'id' },
//   achievements: { tableName: 'achievements', data: achievements, keyField: 'id' },
//   activities: { tableName: 'activities', data: activities, keyField: 'id' },
//   liveSessions: { tableName: 'sessions', data: liveSessions, keyField: 'id' },
//   leaderboard: { tableName: 'leaderboard', data: leaderboard, keyField: 'id' },
};

// ============================================
// DynamoDB Client Setup
// ============================================
const createDynamoDBClient = () => {
  const clientConfig = {
    region: config.region,
  };

  // Use AWS profile if available (avoid MFA prompt if session creds already exist)
  if (process.env.AWS_PROFILE && !process.env.AWS_ACCESS_KEY_ID) {
    const profile = process.env.AWS_PROFILE;
    const hasSessionToken = profileHasSessionToken(profile);
    clientConfig.credentials = hasSessionToken
      ? fromIni({ profile })
      : fromIni({ profile, mfaCodeProvider: getMfaCode });
  }

  const client = new DynamoDBClient(clientConfig);
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

// ============================================
// Seed Functions
// ============================================

async function clearTable(docClient, tableName) {
  const fullTableName = `${config.tablePrefix}-${tableName}`;
  console.log(`  Clearing table: ${fullTableName}`);
  
  try {
    const scanResult = await docClient.send(new ScanCommand({
      TableName: fullTableName,
      ProjectionExpression: 'id',
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await docClient.send(new DeleteCommand({
          TableName: fullTableName,
          Key: { id: item.id.S || item.id },
        }));
      }
      console.log(`    Deleted ${scanResult.Items.length} items`);
    }
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`    Table does not exist, skipping...`);
    } else {
      throw error;
    }
  }
}

async function seedTable(docClient, tableName, items) {
  const fullTableName = `${config.tablePrefix}-${tableName}`;
  console.log(`  Seeding table: ${fullTableName} (${items.length} items)`);

  // Use batch write for efficiency (max 25 items per batch)
  const batches = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    const putRequests = batch.map(item => ({
      PutRequest: { Item: item },
    }));

    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [fullTableName]: putRequests,
        },
      }));
    } catch (error) {
      // If batch write fails, try individual puts
      console.log(`    Batch write failed, trying individual puts...`);
      for (const item of batch) {
        try {
          await docClient.send(new PutCommand({
            TableName: fullTableName,
            Item: item,
          }));
        } catch (putError) {
          console.error(`    [${fullTableName}] Failed to insert item ${item.id}:`, putError.message);
        }
      }
    }
  }

  console.log(`    ✓ Seeded ${items.length} items`);
}

async function seedDynamoDB() {
  console.log('\n🚀 Starting DynamoDB seed...');
  console.log(`   Region: ${config.region}`);
  console.log(`   Table Prefix: ${config.tablePrefix}`);
  
  const docClient = createDynamoDBClient();
  
  const tablesToSeed = config.tables 
    ? Object.entries(tableData).filter(([key]) => config.tables.includes(key))
    : Object.entries(tableData);

  for (const [key, { tableName, data }] of tablesToSeed) {
    console.log(`\n📦 Processing: ${key}`);
    
    if (config.clear) {
      await clearTable(docClient, tableName);
    }
    
    await seedTable(docClient, tableName, data);
  }

  console.log('\n✅ DynamoDB seeding complete!\n');
}

// ============================================
// GraphQL Seed (Alternative)
// ============================================

async function seedGraphQL() {
  console.log('\n🚀 Starting GraphQL seed...');
  
  const endpoint = process.env.APPSYNC_ENDPOINT || process.env.VITE_AWS_APPSYNC_ENDPOINT;
  const apiKey = process.env.APPSYNC_API_KEY || process.env.VITE_AWS_APPSYNC_API_KEY;

  if (!endpoint || !apiKey) {
    console.error('❌ Error: APPSYNC_ENDPOINT and APPSYNC_API_KEY are required for GraphQL mode');
    process.exit(1);
  }

  console.log(`   Endpoint: ${endpoint}`);

  // GraphQL mutations for seeding
  const mutations = {
    createUser: `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) { id }
      }
    `,
    createGame: `
      mutation CreateGame($input: CreateGameInput!) {
        createGame(input: $input) { id }
      }
    `,
  };

  const executeGraphQL = async (query, variables) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });
    return response.json();
  };

  // Seed users
  console.log('\n📦 Seeding users via GraphQL...');
  for (const user of users) {
    try {
      await executeGraphQL(mutations.createUser, { input: user });
      console.log(`   ✓ Created user: ${user.username}`);
    } catch (error) {
      console.log(`   ✗ Failed to create user: ${user.username}`);
    }
  }

  // Seed games
  console.log('\n📦 Seeding games via GraphQL...');
  for (const game of games) {
    try {
      await executeGraphQL(mutations.createGame, { input: game });
      console.log(`   ✓ Created game: ${game.name}`);
    } catch (error) {
      console.log(`   ✗ Failed to create game: ${game.name}`);
    }
  }

  console.log('\n✅ GraphQL seeding complete!\n');
}

// ============================================
// Main Execution
// ============================================

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  GameSphere - Database Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Mode: ${config.mode}`);
  console.log(`  Clear existing data: ${config.clear}`);
  console.log(`  Tables: ${config.tables ? config.tables.join(', ') : 'all'}`);

  try {
    if (config.mode === 'graphql') {
      await seedGraphQL();
    } else {
      await seedDynamoDB();
    }
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

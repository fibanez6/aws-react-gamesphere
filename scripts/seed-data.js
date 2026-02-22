#!/usr/bin/env node

/**
 * GameSphere - Seed Data Script
 * 
 * This script populates AWS DynamoDB tables with demo data.
 * Can also use AppSync GraphQL mutations if configured.
 * 
 * Usage:
 *   node scripts/seed-data.js --cognito-user-id=<user-id> [--mode=dynamodb|graphql] [--clear]
 *   AWS_PROFILE=bjss-cli-role npm run seed:data -- --cognito-user-id=<user-id>
 * 
 * Options:
 *   --cognito-user-id=<id>  The Cognito user ID (sub) from seed-cognito-user.js (required)
 *   --mode=dynamodb         Use DynamoDB directly (default)
 *   --mode=graphql          Use AppSync GraphQL mutations
 *   --clear                 Clear existing data before seeding
 *   --tables=users,games    Seed specific tables only
 *   --table-prefix=prefix     DynamoDB table prefix (default: 'GameSphere')
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
  tablePrefix: `${process.env.DYNAMODB_TABLE_PREFIX || 'fi-gamesphere'}-dev`, // Will be overridden by --table-prefix argument
  cognitoUserId: null,
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
  } else if (arg.startsWith('--cognito-user-id=')) {
    config.cognitoUserId = arg.split('=')[1];
  } else if (arg.startsWith('--table-prefix=')) {
    config.tablePrefix = arg.split('=')[1];
  }
});

// Validate required parameters
if (!config.cognitoUserId) {
  console.error('❌ Error: --cognito-user-id parameter is required');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/seed-data.js --cognito-user-id=<user-id>');
  console.error('');
  console.error('To get the Cognito user ID, first run:');
  console.error('  node scripts/seed-cognito-user.js');
  process.exit(1);
}

// ============================================
// Demo Data (matching mockData.ts)
// ============================================
const cognitoUserId = config.cognitoUserId;

const users = [
    {
        id: cognitoUserId,
        username: 'testuser',
        email: 'shadow@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',
        level: 42,
        rank: 'DIAMOND',
        xp: 1111,
        status: 'ONLINE',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: new Date().toISOString(),
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#42',
    },
    {
        id: 'user_001',
        username: 'ShadowBlade',
        email: 'shadow@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',
        level: 42,
        rank: 'DIAMOND',
        xp: 8750,
        status: 'ONLINE',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: new Date().toISOString(),
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#42',
    },
    {
        id: 'user_100',
        username: 'ProGamer',
        email: 'progamer@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',
        level: 99,
        rank: 'GRANDMASTER',
        xp: 99000,
        status: 'ONLINE',
        createdAt: '2022-06-01T10:00:00Z',
        updatedAt: new Date().toISOString(),
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#99',
    },
    {
        id: 'friend_001',
        username: 'NightHawk',
        email: 'nighthawk@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',
        level: 38,
        rank: 'PLATINUM',
        xp: 3800,
        status: 'ONLINE',
        createdAt: '2023-02-20T10:00:00Z',
        updatedAt: new Date().toISOString(),
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#38',
    },
    {
        id: 'friend_002',
        username: 'PixelQueen',
        email: 'pixelqueen@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',
        level: 55,
        rank: 'DIAMOND',
        xp: 5500,
        status: 'ONLINE',
        createdAt: '2023-01-10T10:00:00Z',
        updatedAt: new Date().toISOString(),
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#55',
    },
    {
        id: 'friend_003',
        username: 'ThunderBolt',
        email: 'thunderbolt@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',
        level: 29,
        rank: 'GOLD',
        xp: 2900,
        status: 'OFFLINE',
        createdAt: '2023-03-15T10:00:00Z',
        updatedAt: '2025-01-23T10:30:00Z',
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#29',
    },
    {
        id: 'friend_004',
        username: 'StormRider',
        email: 'stormrider@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',
        level: 47,
        rank: 'DIAMOND',
        xp: 4700,
        status: 'ONLINE',
        createdAt: '2023-02-01T10:00:00Z',
        updatedAt: new Date().toISOString(),
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#47',
    },
    {
        id: 'friend_005',
        username: 'CyberWolf',
        email: 'cyberwolf@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberWolf',
        level: 33,
        rank: 'GOLD',
        xp: 3300,
        status: 'OFFLINE',
        createdAt: '2023-04-01T10:00:00Z',
        updatedAt: '2025-01-22T18:00:00Z',
        GSI1PK: 'USERS',
        GSI1SK: 'LEVEL#33',
    },
    {
        id: 'friend_006',
        username: 'DragonSlayer',
        email: 'dragonslayer@gamesphere.io',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',
        level: 61,
        rank: 'DIAMOND',
        xp: 6100,
        status: 'ONLINE',
        createdAt: '2022-12-01T10:00:00Z',
        updatedAt: new Date().toISOString(),
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
        platforms: ['PC', 'PlayStation', 'Xbox'],
        activePlayers: 125000,
        rating: 4.9,
        releaseDate: '2022-02-25',
        developer: 'FromSoftware',
        publisher: 'Bandai Namco Entertainment',
        GSI1PK: 'GAMES',
        GSI1SK: 'PLAYERS#125000',
    },
    {
        id: 'game_002',
        name: 'Cyberpunk 2077',
        coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300',
        genre: 'Action RPG',
        platforms: ['PC', 'PlayStation', 'Xbox'],
        activePlayers: 89000,
        rating: 4.5,
        releaseDate: '2020-12-10',
        developer: 'CD Projekt Red',
        publisher: 'CD Projekt',
        GSI1PK: 'GAMES',
        GSI1SK: 'PLAYERS#089000',
    },
    {
        id: 'game_003',
        name: 'Valorant',
        coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300',
        genre: 'FPS',
        platforms: ['PC'],
        activePlayers: 450000,
        rating: 4.7,
        releaseDate: '2020-06-02',
        developer: 'Riot Games',
        publisher: 'Riot Games',
        GSI1PK: 'GAMES',
        GSI1SK: 'PLAYERS#450000',
    },
    {
        id: 'game_004',
        name: 'League of Legends',
        coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300',
        genre: 'MOBA',
        platforms: ['PC'],
        activePlayers: 850000,
        rating: 4.6,
        releaseDate: '2009-10-27',
        developer: 'Riot Games',
        publisher: 'Riot Games',
        GSI1PK: 'GAMES',
        GSI1SK: 'PLAYERS#850000',
    },
    {
        id: 'game_005',
        name: 'Minecraft',
        coverImage: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300',
        genre: 'Sandbox',
        platforms: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
        activePlayers: 380000,
        rating: 4.8,
        releaseDate: '2011-11-18',
        developer: 'Mojang Studios',
        publisher: 'Xbox Game Studios',
        GSI1PK: 'GAMES',
        GSI1SK: 'PLAYERS#380000',
    },
    {
        id: 'game_006',
        name: 'Fortnite',
        coverImage: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=300',
        genre: 'Battle Royale',
        platforms: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
        activePlayers: 520000,
        rating: 4.4,
        releaseDate: '2017-07-25',
        developer: 'Epic Games',
        publisher: 'Epic Games',
        GSI1PK: 'GAMES',
        GSI1SK: 'PLAYERS#520000',
    },
];

const playerStats = [];
// Generate random player stats for all users
users.forEach(user => {
    const totalMatches = Math.floor(Math.random() * 3000) + 500;
    const totalWins = Math.floor(totalMatches * (0.3 + Math.random() * 0.4));
    const totalHoursPlayed = Math.floor(Math.random() * 2000) + 200;
    
    playerStats.push({
        userId: user.id,
        gamesOwned: Math.floor(Math.random() * games.length) + 1,
        achievementsUnlocked: Math.floor(Math.random() * 400) + 50,
        totalHoursPlayed,
        totalAchievements: 500,
        winRate: parseFloat((totalWins / totalMatches).toFixed(2)),
        totalWins,
        totalMatches,
        favoriteGame: games[Math.floor(Math.random() * games.length)].name,
        weeklyPlaytime: Array.from({ length: 7 }, () => parseFloat((Math.random() * 10).toFixed(1))),
        monthlyPlaytime: Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20),
        currentStreak: Math.floor(Math.random() * 30) + 1,
        longestStreak: Math.floor(Math.random() * 100) + 30,
    });
});

const friendships = [
  // ShadowBlade's friends
  { userId: 'user_001', friendId: 'friend_001', status: 'accepted', createdAt: '2023-02-20T10:00:00Z', updatedAt: '2023-02-20T10:00:00Z' },
  { userId: 'user_001', friendId: 'friend_002', status: 'accepted', createdAt: '2023-01-15T10:00:00Z', updatedAt: '2023-01-15T10:00:00Z' },
  { userId: 'user_001', friendId: 'friend_003', status: 'accepted', createdAt: '2023-03-20T10:00:00Z', updatedAt: '2023-03-20T10:00:00Z' },
  { userId: 'user_001', friendId: 'friend_004', status: 'accepted', createdAt: '2023-02-05T10:00:00Z', updatedAt: '2023-02-05T10:00:00Z' },
  { userId: 'user_001', friendId: 'friend_005', status: 'accepted', createdAt: '2023-04-10T10:00:00Z', updatedAt: '2023-04-10T10:00:00Z' },
  { userId: 'user_001', friendId: 'friend_006', status: 'accepted', createdAt: '2022-12-15T10:00:00Z', updatedAt: '2022-12-15T10:00:00Z' },
  // Reverse friendships (bidirectional)
  { userId: 'friend_001', friendId: 'user_001', status: 'accepted', createdAt: '2023-02-20T10:00:00Z', updatedAt: '2023-02-20T10:00:00Z' },
  { userId: 'friend_002', friendId: 'user_001', status: 'accepted', createdAt: '2023-01-15T10:00:00Z', updatedAt: '2023-01-15T10:00:00Z' },
  { userId: 'friend_003', friendId: 'user_001', status: 'accepted', createdAt: '2023-03-20T10:00:00Z', updatedAt: '2023-03-20T10:00:00Z' },
  { userId: 'friend_004', friendId: 'user_001', status: 'accepted', createdAt: '2023-02-05T10:00:00Z', updatedAt: '2023-02-05T10:00:00Z' },
  { userId: 'friend_005', friendId: 'user_001', status: 'accepted', createdAt: '2023-04-10T10:00:00Z', updatedAt: '2023-04-10T10:00:00Z' },
  { userId: 'friend_006', friendId: 'user_001', status: 'accepted', createdAt: '2022-12-15T10:00:00Z', updatedAt: '2022-12-15T10:00:00Z' },
  // testuser's friends
  { userId: cognitoUserId, friendId: 'friend_001', status: 'accepted', createdAt: '2023-05-01T10:00:00Z', updatedAt: '2023-05-01T10:00:00Z' },
  { userId: cognitoUserId, friendId: 'friend_002', status: 'accepted', createdAt: '2023-05-02T10:00:00Z', updatedAt: '2023-05-02T10:00:00Z' },
  { userId: 'friend_001', friendId: cognitoUserId, status: 'accepted', createdAt: '2023-05-01T10:00:00Z', updatedAt: '2023-05-01T10:00:00Z' },
  { userId: 'friend_002', friendId: cognitoUserId, status: 'accepted', createdAt: '2023-05-02T10:00:00Z', updatedAt: '2023-05-02T10:00:00Z' },
  // ProGamer's friends
  { userId: 'user_100', friendId: 'user_001', status: 'accepted', createdAt: '2023-06-01T10:00:00Z', updatedAt: '2023-06-01T10:00:00Z' },
  { userId: 'user_001', friendId: 'user_100', status: 'accepted', createdAt: '2023-06-01T10:00:00Z', updatedAt: '2023-06-01T10:00:00Z' },
  // Pending friend requests
  { userId: 'friend_004', friendId: 'friend_005', status: 'pending', createdAt: '2024-01-10T10:00:00Z', updatedAt: '2024-01-10T10:00:00Z' },
];

const gameStats = [
  { userId: cognitoUserId, gameId: 'game_001', gameName: 'Elden Ring', gameCover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', hoursPlayed: 342, lastPlayed: new Date().toISOString(), rank: 'PLATINUM', winRate: 0.45, totalMatches: 120, wins: 54, losses: 66 },
  { userId: cognitoUserId, gameId: 'game_003', gameName: 'Valorant', gameCover: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300', hoursPlayed: 520, lastPlayed: new Date(Date.now() - 86400000).toISOString(), rank: 'DIAMOND', winRate: 0.58, totalMatches: 200, wins: 116, losses: 84 },
  { userId: cognitoUserId, gameId: 'game_004', gameName: 'League of Legends', gameCover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300', hoursPlayed: 285, lastPlayed: new Date(Date.now() - 259200000).toISOString(), rank: 'GOLD', winRate: 0.52, totalMatches: 150, wins: 78, losses: 72 },
];

const achievements = [
  { id: 'ach_001', userId: cognitoUserId, name: 'First Blood', description: 'Win your first match', icon: '🏆', rarity: 'COMMON', unlockedAt: '2023-01-20T15:30:00Z', gameId: 'game_003', gameName: 'Valorant', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#COMMON' },
  { id: 'ach_002', userId: cognitoUserId, name: 'Elden Lord', description: 'Complete the main story', icon: '👑', rarity: 'LEGENDARY', unlockedAt: '2023-03-15T22:45:00Z', gameId: 'game_001', gameName: 'Elden Ring', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#LEGENDARY' },
  { id: 'ach_003', userId: cognitoUserId, name: 'Sharpshooter', description: 'Get 100 headshots', icon: '🎯', rarity: 'RARE', unlockedAt: '2023-02-10T14:20:00Z', gameId: 'game_003', gameName: 'Valorant', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#RARE' },
  { id: 'ach_004', userId: cognitoUserId, name: 'Speedrunner', description: 'Complete a level in under 5 minutes', icon: '⚡', rarity: 'EPIC', unlockedAt: '2023-04-05T11:15:00Z', gameId: 'game_001', gameName: 'Elden Ring', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#EPIC' },
  { id: 'ach_005', userId: cognitoUserId, name: 'Social Butterfly', description: 'Add 50 friends', icon: '🦋', rarity: 'RARE', unlockedAt: '2023-05-20T09:00:00Z', gameId: 'GLOBAL', gameName: 'GameSphere', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#RARE' },
  { id: 'ach_006', userId: cognitoUserId, name: 'Veteran Player', description: 'Play for 1000 hours total', icon: '🎖️', rarity: 'LEGENDARY', unlockedAt: '2024-08-10T20:30:00Z', gameId: 'GLOBAL', gameName: 'GameSphere', GSI1PK: 'ACHIEVEMENTS', GSI1SK: 'RARITY#LEGENDARY' },
];

const activities = [
  { id: 'act_001', type: 'ACHIEVEMENT_UNLOCKED', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Achievement Unlocked', description: 'Unlocked achievement: First Blood', gameId: 'game_003', gameName: 'Valorant', gameCover: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 'act_002', type: 'RANK_UP', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Level Up', description: 'Reached level 42', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 'act_003', type: 'RANK_UP', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Rank Promotion', description: 'Promoted to Diamond rank', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: 'act_004', type: 'GAME_ENDED', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Game Session', description: 'Played Elden Ring for 3 hours', gameId: 'game_001', gameName: 'Elden Ring', gameCover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 'act_005', type: 'ACHIEVEMENT_UNLOCKED', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Achievement Unlocked', description: 'Unlocked achievement: Elden Lord', gameId: 'game_001', gameName: 'Elden Ring', gameCover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
  { id: 'act_006', type: 'GAME_ENDED', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Game Session', description: 'Played Valorant for 2 hours', gameId: 'game_003', gameName: 'Valorant', gameCover: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300', createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
  { id: 'act_007', type: 'FRIEND_ADDED', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'New Friend', description: 'Became friends with NightHawk', createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString() },
  { id: 'act_008', type: 'ACHIEVEMENT_UNLOCKED', userId: cognitoUserId, username: 'testuser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', title: 'Achievement Unlocked', description: 'Unlocked achievement: Sharpshooter', gameId: 'game_003', gameName: 'Valorant', gameCover: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300', createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString() },
];

const liveSessions = [
  { id: 'session_001', PK: 'SESSION#session_001', SK: 'LIVE', userId: 'friend_001', username: 'NightHawk', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk', gameId: 'game_001', gameName: 'Elden Ring', gameImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300', startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), duration: 45, isLive: true, GSI1PK: 'LIVE_SESSIONS', GSI1SK: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'session_002', PK: 'SESSION#session_002', SK: 'LIVE', userId: 'friend_004', username: 'StormRider', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider', gameId: 'game_003', gameName: 'Valorant', gameImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=300', startedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(), duration: 120, isLive: true, GSI1PK: 'LIVE_SESSIONS', GSI1SK: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
  { id: 'session_003', PK: 'SESSION#session_003', SK: 'LIVE', userId: 'friend_002', username: 'PixelQueen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen', gameId: 'game_005', gameName: 'Minecraft', gameImage: 'https://images.unsplash.com/photo-1587573089734-09cb69c0f2b4?w=300', startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), duration: 30, isLive: true, GSI1PK: 'LIVE_SESSIONS', GSI1SK: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
];

// DynamoDB schema: pk = "TYPE#METRIC" (GSI partition key), score (GSI sort key), id (table PK)
// The resolver queries `score-index` GSI with pk = `${type}#${metric}` and score from sort order.
const leaderboard = [
  // ── GLOBAL#HOURS ──
  { id: 'lb_gh_001', pk: 'GLOBAL#HOURS', userId: 'user_100', username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 5420, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_gh_002', pk: 'GLOBAL#HOURS', userId: 'user_101', username: 'EliteWarrior',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 4890, previousRank: 4, change: 2,  userRank: 'MASTER' },
  { id: 'lb_gh_003', pk: 'GLOBAL#HOURS', userId: 'user_102', username: 'NinjaKing',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 4520, previousRank: 2, change: -1, userRank: 'MASTER' },
  { id: 'lb_gh_004', pk: 'GLOBAL#HOURS', userId: 'friend_006', username: 'DragonSlayer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 3200, previousRank: 7, change: 3,  userRank: 'DIAMOND' },
  { id: 'lb_gh_005', pk: 'GLOBAL#HOURS', userId: 'friend_002', username: 'PixelQueen',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 2890, previousRank: 5, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_gh_006', pk: 'GLOBAL#HOURS', userId: 'friend_004', username: 'StormRider',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 2450, previousRank: 7, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_gh_007', pk: 'GLOBAL#HOURS', userId: 'user_001',   username: 'ShadowBlade',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 1247, previousRank: 12, change: 5, userRank: 'DIAMOND' },
  { id: 'lb_gh_008', pk: 'GLOBAL#HOURS', userId: 'friend_001', username: 'NightHawk',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 980,  previousRank: 6, change: -2, userRank: 'PLATINUM' },
  { id: 'lb_gh_009', pk: 'GLOBAL#HOURS', userId: 'friend_003', username: 'ThunderBolt',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',    score: 720,  previousRank: 10, change: 1, userRank: 'GOLD' },
  { id: 'lb_gh_010', pk: 'GLOBAL#HOURS', userId: 'friend_005', username: 'CyberWolf',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberWolf',      score: 610,  previousRank: 9, change: -1, userRank: 'GOLD' },
  { id: 'lb_gh_011', pk: 'GLOBAL#HOURS', userId: cognitoUserId, username: 'testuser',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 1147, previousRank: 9, change: -2, userRank: 'DIAMOND' },

  // ── GLOBAL#WINS ──
  { id: 'lb_gw_001', pk: 'GLOBAL#WINS', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 1820, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_gw_002', pk: 'GLOBAL#WINS', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 1540, previousRank: 3, change: 1,  userRank: 'MASTER' },
  { id: 'lb_gw_003', pk: 'GLOBAL#WINS', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 1490, previousRank: 2, change: -1, userRank: 'MASTER' },
  { id: 'lb_gw_004', pk: 'GLOBAL#WINS', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 1120, previousRank: 5, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_gw_005', pk: 'GLOBAL#WINS', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 980,  previousRank: 4, change: -1, userRank: 'DIAMOND' },
  { id: 'lb_gw_006', pk: 'GLOBAL#WINS', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 870,  previousRank: 6, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_gw_007', pk: 'GLOBAL#WINS', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 650,  previousRank: 9, change: 2,  userRank: 'DIAMOND' },
  { id: 'lb_gw_008', pk: 'GLOBAL#WINS', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 540,  previousRank: 7, change: -1, userRank: 'PLATINUM' },
  { id: 'lb_gw_009', pk: 'GLOBAL#WINS', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 248,  previousRank: 10, change: 1, userRank: 'DIAMOND' },

  // ── GLOBAL#ACHIEVEMENTS ──
  { id: 'lb_ga_001', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',    score: 487, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_ga_002', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior', score: 412, previousRank: 2, change: 0,  userRank: 'MASTER' },
  { id: 'lb_ga_003', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer', score: 356, previousRank: 4, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_ga_004', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',   score: 340, previousRank: 3, change: -1, userRank: 'MASTER' },
  { id: 'lb_ga_005', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',  score: 298, previousRank: 5, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_ga_006', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',  score: 245, previousRank: 7, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_ga_007', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', score: 210, previousRank: 6, change: -1, userRank: 'DIAMOND' },
  { id: 'lb_ga_008', pk: 'GLOBAL#ACHIEVEMENTS', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',   score: 178, previousRank: 8, change: 0,  userRank: 'PLATINUM' },
  { id: 'lb_ga_009', pk: 'GLOBAL#ACHIEVEMENTS', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade', score: 156, previousRank: 11, change: 2, userRank: 'DIAMOND' },

  // ── GLOBAL#XP ──
  { id: 'lb_gx_001', pk: 'GLOBAL#XP', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 99000, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_gx_002', pk: 'GLOBAL#XP', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 87500, previousRank: 2, change: 0,  userRank: 'MASTER' },
  { id: 'lb_gx_003', pk: 'GLOBAL#XP', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 82000, previousRank: 4, change: 1,  userRank: 'MASTER' },
  { id: 'lb_gx_004', pk: 'GLOBAL#XP', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 61000, previousRank: 3, change: -1, userRank: 'DIAMOND' },
  { id: 'lb_gx_005', pk: 'GLOBAL#XP', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 55000, previousRank: 5, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_gx_006', pk: 'GLOBAL#XP', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 47000, previousRank: 6, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_gx_007', pk: 'GLOBAL#XP', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 8750,  previousRank: 8, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_gx_008', pk: 'GLOBAL#XP', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 3800,  previousRank: 7, change: -1, userRank: 'PLATINUM' },
  { id: 'lb_gx_009', pk: 'GLOBAL#XP', userId: 'friend_003', username: 'ThunderBolt',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',    score: 2900,  previousRank: 9, change: 0,  userRank: 'GOLD' },
  { id: 'lb_gx_010', pk: 'GLOBAL#XP', userId: 'friend_005', username: 'CyberWolf',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberWolf',      score: 3300,  previousRank: 10, change: 0, userRank: 'GOLD' },
  { id: 'lb_gx_011', pk: 'GLOBAL#XP', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 1111,  previousRank: 13, change: 2, userRank: 'DIAMOND' },

  // ── GLOBAL#game_001 ──
  { id: 'lb_er_001', pk: 'GLOBAL#game_001', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 9850, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_er_002', pk: 'GLOBAL#game_001', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 8720, previousRank: 2, change: 0,  userRank: 'MASTER' },
  { id: 'lb_er_003', pk: 'GLOBAL#game_001', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 7640, previousRank: 4, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_er_004', pk: 'GLOBAL#game_001', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 7200, previousRank: 3, change: -1, userRank: 'MASTER' },
  { id: 'lb_er_005', pk: 'GLOBAL#game_001', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 5430, previousRank: 5, change: 0,  userRank: 'PLATINUM' },
  { id: 'lb_er_006', pk: 'GLOBAL#game_001', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 4100, previousRank: 7, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_er_007', pk: 'GLOBAL#game_001', userId: 'friend_003', username: 'ThunderBolt',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',    score: 3280, previousRank: 6, change: -1, userRank: 'GOLD' },
  { id: 'lb_er_008', pk: 'GLOBAL#game_001', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 2750, previousRank: 9, change: 1,  userRank: 'DIAMOND' },

  // ── GLOBAL#game_002 ──
  { id: 'lb_cp_001', pk: 'GLOBAL#game_002', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 8900, previousRank: 2, change: 1,  userRank: 'MASTER' },
  { id: 'lb_cp_002', pk: 'GLOBAL#game_002', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 8650, previousRank: 1, change: -1, userRank: 'GRANDMASTER' },
  { id: 'lb_cp_003', pk: 'GLOBAL#game_002', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 7100, previousRank: 3, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_cp_004', pk: 'GLOBAL#game_002', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 6320, previousRank: 5, change: 1,  userRank: 'MASTER' },
  { id: 'lb_cp_005', pk: 'GLOBAL#game_002', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 5500, previousRank: 4, change: -1, userRank: 'DIAMOND' },
  { id: 'lb_cp_006', pk: 'GLOBAL#game_002', userId: 'friend_005', username: 'CyberWolf',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberWolf',      score: 4800, previousRank: 6, change: 0,  userRank: 'GOLD' },
  { id: 'lb_cp_007', pk: 'GLOBAL#game_002', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 3950, previousRank: 8, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_cp_008', pk: 'GLOBAL#game_002', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 1820, previousRank: 10, change: 2, userRank: 'DIAMOND' },

  // ── GLOBAL#game_003 ──
  { id: 'lb_va_001', pk: 'GLOBAL#game_003', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 12400, previousRank: 1, change: 0,  userRank: 'MASTER' },
  { id: 'lb_va_002', pk: 'GLOBAL#game_003', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 11800, previousRank: 2, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_va_003', pk: 'GLOBAL#game_003', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 9500,  previousRank: 4, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_va_004', pk: 'GLOBAL#game_003', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 9200,  previousRank: 3, change: -1, userRank: 'MASTER' },
  { id: 'lb_va_005', pk: 'GLOBAL#game_003', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 7600,  previousRank: 5, change: 0,  userRank: 'PLATINUM' },
  { id: 'lb_va_006', pk: 'GLOBAL#game_003', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 6300,  previousRank: 6, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_va_007', pk: 'GLOBAL#game_003', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 5100,  previousRank: 8, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_va_008', pk: 'GLOBAL#game_003', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 4200,  previousRank: 10, change: 2, userRank: 'DIAMOND' },
  { id: 'lb_va_009', pk: 'GLOBAL#game_003', userId: 'friend_003', username: 'ThunderBolt',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',    score: 3400,  previousRank: 7, change: -2, userRank: 'GOLD' },

  // ── GLOBAL#game_004 ──
  { id: 'lb_ll_001', pk: 'GLOBAL#game_004', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 15200, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_ll_002', pk: 'GLOBAL#game_004', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 14100, previousRank: 3, change: 1,  userRank: 'MASTER' },
  { id: 'lb_ll_003', pk: 'GLOBAL#game_004', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 13800, previousRank: 2, change: -1, userRank: 'MASTER' },
  { id: 'lb_ll_004', pk: 'GLOBAL#game_004', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 10500, previousRank: 4, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_ll_005', pk: 'GLOBAL#game_004', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 9200,  previousRank: 5, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_ll_006', pk: 'GLOBAL#game_004', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 7800,  previousRank: 7, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_ll_007', pk: 'GLOBAL#game_004', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 6400,  previousRank: 6, change: -1, userRank: 'PLATINUM' },
  { id: 'lb_ll_008', pk: 'GLOBAL#game_004', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 3200,  previousRank: 9, change: 1,  userRank: 'DIAMOND' },

  // ── GLOBAL#game_005 ──
  { id: 'lb_mc_001', pk: 'GLOBAL#game_005', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 18500, previousRank: 1, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_mc_002', pk: 'GLOBAL#game_005', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 14200, previousRank: 2, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_mc_003', pk: 'GLOBAL#game_005', userId: 'friend_005', username: 'CyberWolf',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberWolf',      score: 11800, previousRank: 4, change: 1,  userRank: 'GOLD' },
  { id: 'lb_mc_004', pk: 'GLOBAL#game_005', userId: 'friend_003', username: 'ThunderBolt',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThunderBolt',    score: 10500, previousRank: 3, change: -1, userRank: 'GOLD' },
  { id: 'lb_mc_005', pk: 'GLOBAL#game_005', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 8900,  previousRank: 5, change: 0,  userRank: 'MASTER' },
  { id: 'lb_mc_006', pk: 'GLOBAL#game_005', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 7200,  previousRank: 6, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_mc_007', pk: 'GLOBAL#game_005', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 5600,  previousRank: 8, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_mc_008', pk: 'GLOBAL#game_005', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 4100,  previousRank: 7, change: -1, userRank: 'DIAMOND' },

  // ── GLOBAL#game_006 ──
  { id: 'lb_fn_001', pk: 'GLOBAL#game_006', userId: 'user_100',   username: 'ProGamer',      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProGamer',      score: 22000, previousRank: 1, change: 0,  userRank: 'GRANDMASTER' },
  { id: 'lb_fn_002', pk: 'GLOBAL#game_006', userId: 'user_102',   username: 'NinjaKing',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinjaKing',      score: 19500, previousRank: 3, change: 1,  userRank: 'MASTER' },
  { id: 'lb_fn_003', pk: 'GLOBAL#game_006', userId: 'user_101',   username: 'EliteWarrior',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EliteWarrior',   score: 18200, previousRank: 2, change: -1, userRank: 'MASTER' },
  { id: 'lb_fn_004', pk: 'GLOBAL#game_006', userId: 'friend_004', username: 'StormRider',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StormRider',     score: 13400, previousRank: 4, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_fn_005', pk: 'GLOBAL#game_006', userId: 'friend_006', username: 'DragonSlayer',  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragonSlayer',   score: 11200, previousRank: 5, change: 0,  userRank: 'DIAMOND' },
  { id: 'lb_fn_006', pk: 'GLOBAL#game_006', userId: 'friend_001', username: 'NightHawk',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NightHawk',      score: 8700,  previousRank: 7, change: 1,  userRank: 'PLATINUM' },
  { id: 'lb_fn_007', pk: 'GLOBAL#game_006', userId: 'friend_002', username: 'PixelQueen',    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen',     score: 7900,  previousRank: 6, change: -1, userRank: 'DIAMOND' },
  { id: 'lb_fn_008', pk: 'GLOBAL#game_006', userId: 'user_001',   username: 'ShadowBlade',   avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 6100,  previousRank: 9, change: 1,  userRank: 'DIAMOND' },
  { id: 'lb_fn_009', pk: 'GLOBAL#game_006', userId: cognitoUserId, username: 'testuser',     avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowBlade',    score: 3500,  previousRank: 11, change: 2, userRank: 'DIAMOND' },
];

// ============================================
// Table definitions
// ============================================
const tableData = {
  users: { tableName: 'users', data: users, keyField: 'id' },
  games: { tableName: 'games', data: games, keyField: 'id' },
  playerStats: { tableName: 'player-stats', data: playerStats, keyField: 'id' },
  friendships: { tableName: 'friends', data: friendships, keyField: 'userId' },
  gameStats: { tableName: 'game-stats', data: gameStats, keyField: 'userId', sortKeyField: 'gameId' },
  achievements: { tableName: 'achievements', data: achievements, keyField: 'id' },
  activities: { tableName: 'activities', data: activities, keyField: 'id' },
//   liveSessions: { tableName: 'sessions', data: liveSessions, keyField: 'id' },
  leaderboard: { tableName: 'leaderboard', data: leaderboard, keyField: 'id' },
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
    // Determine key attributes based on table
    const isFriendsTable = tableName === 'friends';
    const isGameStatsTable = tableName === 'game-stats';
    let projectionExpression = 'id';
    if (isFriendsTable) projectionExpression = 'userId, friendId';
    if (isGameStatsTable) projectionExpression = 'userId, gameId';
    
    const scanResult = await docClient.send(new ScanCommand({
      TableName: fullTableName,
      ProjectionExpression: projectionExpression,
    }));

    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        let key;
        if (isFriendsTable) {
          key = { userId: item.userId, friendId: item.friendId };
        } else if (isGameStatsTable) {
          key = { userId: item.userId, gameId: item.gameId };
        } else {
          key = { id: item.id.S || item.id };
        }
        
        await docClient.send(new DeleteCommand({
          TableName: fullTableName,
          Key: key,
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
  console.log(`   Cognito User ID: ${config.cognitoUserId}`);
  
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
  
  const endpoint = process.env.APPSYNC_ENDPOINT || process.env.VITE_APPSYNC_ENDPOINT;
  const apiKey = process.env.APPSYNC_API_KEY || process.env.VITE_APPSYNC_API_KEY;

  if (!endpoint || !apiKey) {
    console.error('❌ Error: APPSYNC_ENDPOINT and APPSYNC_API_KEY are required for GraphQL mode');
    process.exit(1);
  }

  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Cognito User ID: ${config.cognitoUserId}`);

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
  console.log(`  Cognito User ID: ${config.cognitoUserId}`);

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

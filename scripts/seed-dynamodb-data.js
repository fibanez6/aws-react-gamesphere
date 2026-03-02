/**
 * Seed script for GameSphere DynamoDB tables.
 *
 * Amplify Gen 2 generates table names dynamically, so this script:
 *  1. Lists all DynamoDB tables in the configured region.
 *  2. Matches them to models (User, Game, PlayerStats) by name pattern.
 *  3. Batch-writes realistic test data that conforms to the Amplify schema.
 *
 * Prerequisites:
 *  - Valid AWS credentials configured (e.g. via `aws configure` or env vars).
 *  - The Amplify sandbox must be running (tables must exist).
 *
 * Usage:
 *   node scripts/seed-dynamodb-data.js                   # seed all tables
 *   node scripts/seed-dynamodb-data.js --delete           # delete all seeded data
 *   node scripts/seed-dynamodb-data.js --owner user@test  # override the owner field
 */

import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Read region from amplify_outputs.json so it stays in sync automatically. */
function getRegion() {
  try {
    const outputs = JSON.parse(
      readFileSync(join(__dirname, "..", "amplify_outputs.json"), "utf-8")
    );
    return outputs?.data?.aws_region ?? outputs?.auth?.aws_region ?? "us-east-1";
  } catch {
    return "us-east-1";
  }
}

const REGION = getRegion();
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// Parse CLI flags
const args = process.argv.slice(2);
const DELETE_MODE = args.includes("--delete");
const ownerFlagIdx = args.indexOf("--owner");
const OWNER =
  ownerFlagIdx !== -1 && args[ownerFlagIdx + 1]
    ? args[ownerFlagIdx + 1]
    : "seed-script-user";

// ---------------------------------------------------------------------------
// Table discovery – finds Amplify-generated DynamoDB table names
// ---------------------------------------------------------------------------

async function discoverTableNames() {
  const tableMap = {};
  let exclusiveStartTableName;

  // Paginate through all tables
  do {
    const { TableNames, LastEvaluatedTableName } = await client.send(
      new ListTablesCommand({
        ExclusiveStartTableName: exclusiveStartTableName,
        Limit: 100,
      })
    );
    for (const name of TableNames ?? []) {
      // Amplify Gen 2 tables follow the pattern: ModelName-<random>-NONE (sandbox)
      // or ModelName-<random>-<branch>
      if (/^User-/i.test(name)) tableMap.User = name;
      else if (/^Game-/i.test(name)) tableMap.Game = name;
      else if (/^PlayerStats-/i.test(name)) tableMap.PlayerStats = name;
      else if (/^Activity-/i.test(name)) tableMap.Activity = name;
    }
    exclusiveStartTableName = LastEvaluatedTableName;
  } while (exclusiveStartTableName);

  return tableMap;
}

// ---------------------------------------------------------------------------
// Test data generators
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

function generateUsers() {
  const users = [
    {
      id: "user-001",
      email: "alex.storm@gamesphere.test",
      username: "AlexStorm",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=AlexStorm",
      rank: "DIAMOND",
      xp: 24500,
      level: 42,
      status: "ONLINE",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-002",
      email: "luna.cipher@gamesphere.test",
      username: "LunaCipher",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=LunaCipher",
      rank: "PLATINUM",
      xp: 18200,
      level: 35,
      status: "IN_GAME",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-003",
      email: "kai.phoenix@gamesphere.test",
      username: "KaiPhoenix",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=KaiPhoenix",
      rank: "MASTER",
      xp: 31000,
      level: 55,
      status: "ONLINE",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-004",
      email: "nova.blade@gamesphere.test",
      username: "NovaBlade",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=NovaBlade",
      rank: "GOLD",
      xp: 9800,
      level: 22,
      status: "AWAY",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-005",
      email: "zara.vortex@gamesphere.test",
      username: "ZaraVortex",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=ZaraVortex",
      rank: "GRANDMASTER",
      xp: 48000,
      level: 72,
      status: "ONLINE",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-006",
      email: "riven.shadow@gamesphere.test",
      username: "RivenShadow",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=RivenShadow",
      rank: "SILVER",
      xp: 4200,
      level: 12,
      status: "OFFLINE",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-007",
      email: "echo.frost@gamesphere.test",
      username: "EchoFrost",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=EchoFrost",
      rank: "PLATINUM",
      xp: 16500,
      level: 31,
      status: "IN_GAME",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-008",
      email: "drake.ember@gamesphere.test",
      username: "DrakeEmber",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=DrakeEmber",
      rank: "BRONZE",
      xp: 1200,
      level: 5,
      status: "OFFLINE",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-009",
      email: "aria.nebula@gamesphere.test",
      username: "AriaNebula",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=AriaNebula",
      rank: "DIAMOND",
      xp: 27300,
      level: 48,
      status: "ONLINE",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "user-010",
      email: "jax.thunder@gamesphere.test",
      username: "JaxThunder",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=JaxThunder",
      rank: "GOLD",
      xp: 11000,
      level: 25,
      status: "AWAY",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return users;
}

function generateGames() {
  return [
    {
      id: "game-001",
      name: "Stellar Odyssey",
      genre: "RPG",
      coverImage: "https://picsum.photos/seed/stellar/400/600",
      rating: 4.8,
      activePlayers: 125000,
      platforms: ["PC", "PlayStation", "Xbox"],
      releaseDate: "2025-03-15",
      developer: "Nebula Games",
      publisher: "Cosmic Entertainment",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-002",
      name: "CyberStrike 2077",
      genre: "FPS",
      coverImage: "https://picsum.photos/seed/cyberstrike/400/600",
      rating: 4.5,
      activePlayers: 89000,
      platforms: ["PC", "PlayStation", "Xbox"],
      releaseDate: "2025-06-22",
      developer: "Neon Dynamics",
      publisher: "Digital Forge",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-003",
      name: "Dragon's Ascent",
      genre: "Action-Adventure",
      coverImage: "https://picsum.photos/seed/dragons/400/600",
      rating: 4.9,
      activePlayers: 210000,
      platforms: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
      releaseDate: "2024-11-08",
      developer: "Mythic Studios",
      publisher: "Legend Interactive",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-004",
      name: "Velocity Rush",
      genre: "Racing",
      coverImage: "https://picsum.photos/seed/velocity/400/600",
      rating: 4.3,
      activePlayers: 45000,
      platforms: ["PC", "PlayStation", "Xbox"],
      releaseDate: "2025-01-30",
      developer: "Turbo Labs",
      publisher: "Speed Works",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-005",
      name: "Phantom Realms",
      genre: "Horror",
      coverImage: "https://picsum.photos/seed/phantom/400/600",
      rating: 4.6,
      activePlayers: 67000,
      platforms: ["PC", "PlayStation"],
      releaseDate: "2025-10-31",
      developer: "Shadow Pixel",
      publisher: "Dark Matter Games",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-006",
      name: "Arcane Legends Online",
      genre: "MMORPG",
      coverImage: "https://picsum.photos/seed/arcane/400/600",
      rating: 4.4,
      activePlayers: 340000,
      platforms: ["PC"],
      releaseDate: "2023-08-15",
      developer: "Elderforge Entertainment",
      publisher: "Realm Studios",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-007",
      name: "Gravity Shift",
      genre: "Puzzle-Platformer",
      coverImage: "https://picsum.photos/seed/gravity/400/600",
      rating: 4.7,
      activePlayers: 31000,
      platforms: ["PC", "Nintendo Switch", "Mobile"],
      releaseDate: "2025-05-12",
      developer: "Vertex Indie",
      publisher: "Vertex Indie",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-008",
      name: "Warfront Tactics",
      genre: "Strategy",
      coverImage: "https://picsum.photos/seed/warfront/400/600",
      rating: 4.2,
      activePlayers: 52000,
      platforms: ["PC", "Mobile"],
      releaseDate: "2024-09-20",
      developer: "Iron Command Studios",
      publisher: "Grand Strategy Inc",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-009",
      name: "Neon Arena",
      genre: "Battle Royale",
      coverImage: "https://picsum.photos/seed/neonarena/400/600",
      rating: 4.1,
      activePlayers: 185000,
      platforms: ["PC", "PlayStation", "Xbox", "Mobile"],
      releaseDate: "2024-04-01",
      developer: "Pulse Interactive",
      publisher: "Pulse Interactive",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "game-010",
      name: "Skybound Horizons",
      genre: "Open World",
      coverImage: "https://picsum.photos/seed/skybound/400/600",
      rating: 4.8,
      activePlayers: 275000,
      platforms: ["PC", "PlayStation", "Xbox"],
      releaseDate: "2025-12-05",
      developer: "Infinite Worlds Studio",
      publisher: "Horizon Games",
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function generatePlayerStats(users) {
  const statsData = [
    { gamesOwned: 47, achievementsUnlocked: 312, totalHoursPlayed: 1850.5, totalAchievements: 500, totalWins: 420, totalMatches: 680, winRate: 61.8, currentStreak: 7, longestStreak: 15 },
    { gamesOwned: 32, achievementsUnlocked: 198, totalHoursPlayed: 1200.0, totalAchievements: 350, totalWins: 310, totalMatches: 520, winRate: 59.6, currentStreak: 4, longestStreak: 12 },
    { gamesOwned: 65, achievementsUnlocked: 485, totalHoursPlayed: 3200.8, totalAchievements: 650, totalWins: 780, totalMatches: 1100, winRate: 70.9, currentStreak: 12, longestStreak: 22 },
    { gamesOwned: 18, achievementsUnlocked: 87,  totalHoursPlayed: 620.3,  totalAchievements: 200, totalWins: 145, totalMatches: 310, winRate: 46.8, currentStreak: 2, longestStreak: 8 },
    { gamesOwned: 82, achievementsUnlocked: 620, totalHoursPlayed: 4500.2, totalAchievements: 800, totalWins: 1050, totalMatches: 1350, winRate: 77.8, currentStreak: 18, longestStreak: 30 },
    { gamesOwned: 12, achievementsUnlocked: 45,  totalHoursPlayed: 340.0,  totalAchievements: 150, totalWins: 60,  totalMatches: 180, winRate: 33.3, currentStreak: 0, longestStreak: 5 },
    { gamesOwned: 28, achievementsUnlocked: 175, totalHoursPlayed: 980.7,  totalAchievements: 300, totalWins: 260, totalMatches: 430, winRate: 60.5, currentStreak: 5, longestStreak: 11 },
    { gamesOwned: 5,  achievementsUnlocked: 12,  totalHoursPlayed: 85.0,   totalAchievements: 80,  totalWins: 15,  totalMatches: 60,  winRate: 25.0, currentStreak: 0, longestStreak: 3 },
    { gamesOwned: 55, achievementsUnlocked: 390, totalHoursPlayed: 2450.4, totalAchievements: 550, totalWins: 560, totalMatches: 850, winRate: 65.9, currentStreak: 9, longestStreak: 19 },
    { gamesOwned: 21, achievementsUnlocked: 110, totalHoursPlayed: 750.6,  totalAchievements: 250, totalWins: 180, totalMatches: 380, winRate: 47.4, currentStreak: 3, longestStreak: 9 },
  ];

  return users.map((user, i) => {
    const data = statsData[i];
    // Generate realistic weekly playtime (7 days)
    const weeklyPlaytime = Array.from({ length: 7 }, () =>
      parseFloat((Math.random() * 5 + 0.5).toFixed(1))
    );
    // Generate realistic monthly playtime (12 months)
    const monthlyPlaytime = Array.from({ length: 12 }, () =>
      parseFloat((Math.random() * 120 + 20).toFixed(1))
    );

    return {
      id: `stats-${user.id}`,
      userId: user.id,
      gamesOwned: data.gamesOwned,
      achievementsUnlocked: data.achievementsUnlocked,
      totalHoursPlayed: data.totalHoursPlayed,
      totalAchievements: data.totalAchievements,
      totalWins: data.totalWins,
      totalMatches: data.totalMatches,
      winRate: data.winRate,
      weeklyPlaytime,
      monthlyPlaytime,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    };
  });
}

function generateActivities(users, games) {
  // Helper to create a past date (daysAgo days before now)
  const pastDate = (daysAgo, hoursAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    return d.toISOString();
  };

  return [
    // --- GAME_PLAYED activities ---
    {
      id: "activity-001",
      userId: "user-001",
      username: users[0].username,
      avatar: users[0].avatar,
      type: "GAME_PLAYED",
      title: "Played Stellar Odyssey",
      description: "Completed a 3-hour session in Stellar Odyssey, advancing to Chapter 12.",
      gameId: "game-001",
      gameName: games[0].name,
      gameCover: games[0].coverImage,
      owner: OWNER,
      createdAt: pastDate(0, 2),
      updatedAt: pastDate(0, 2),
    },
    {
      id: "activity-002",
      userId: "user-002",
      username: users[1].username,
      avatar: users[1].avatar,
      type: "GAME_PLAYED",
      title: "Played CyberStrike 2077",
      description: "Dominated in ranked matches—12 wins in a row!",
      gameId: "game-002",
      gameName: games[1].name,
      gameCover: games[1].coverImage,
      owner: OWNER,
      createdAt: pastDate(0, 5),
      updatedAt: pastDate(0, 5),
    },
    {
      id: "activity-003",
      userId: "user-003",
      username: users[2].username,
      avatar: users[2].avatar,
      type: "GAME_PLAYED",
      title: "Played Dragon's Ascent",
      description: "Explored the Frozen Peaks region and defeated the Ice Wyrm boss.",
      gameId: "game-003",
      gameName: games[2].name,
      gameCover: games[2].coverImage,
      owner: OWNER,
      createdAt: pastDate(1, 1),
      updatedAt: pastDate(1, 1),
    },
    {
      id: "activity-004",
      userId: "user-005",
      username: users[4].username,
      avatar: users[4].avatar,
      type: "GAME_PLAYED",
      title: "Played Neon Arena",
      description: "Won 5 consecutive Battle Royale matches.",
      gameId: "game-009",
      gameName: games[8].name,
      gameCover: games[8].coverImage,
      owner: OWNER,
      createdAt: pastDate(0, 8),
      updatedAt: pastDate(0, 8),
    },
    {
      id: "activity-005",
      userId: "user-007",
      username: users[6].username,
      avatar: users[6].avatar,
      type: "GAME_PLAYED",
      title: "Played Arcane Legends Online",
      description: "Joined a raid party and cleared the Abyssal Dungeon.",
      gameId: "game-006",
      gameName: games[5].name,
      gameCover: games[5].coverImage,
      owner: OWNER,
      createdAt: pastDate(1, 3),
      updatedAt: pastDate(1, 3),
    },

    // --- ACHIEVEMENT_UNLOCKED activities ---
    {
      id: "activity-006",
      userId: "user-001",
      username: users[0].username,
      avatar: users[0].avatar,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Unlocked 'Starbound Explorer'",
      description: "Discovered all hidden planets in Stellar Odyssey.",
      gameId: "game-001",
      gameName: games[0].name,
      gameCover: games[0].coverImage,
      owner: OWNER,
      createdAt: pastDate(0, 1),
      updatedAt: pastDate(0, 1),
    },
    {
      id: "activity-007",
      userId: "user-003",
      username: users[2].username,
      avatar: users[2].avatar,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Unlocked 'Dragon Slayer'",
      description: "Defeated 100 dragons in Dragon's Ascent.",
      gameId: "game-003",
      gameName: games[2].name,
      gameCover: games[2].coverImage,
      owner: OWNER,
      createdAt: pastDate(1, 0),
      updatedAt: pastDate(1, 0),
    },
    {
      id: "activity-008",
      userId: "user-005",
      username: users[4].username,
      avatar: users[4].avatar,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Unlocked 'Arena Legend'",
      description: "Reached 1000 total wins in Neon Arena.",
      gameId: "game-009",
      gameName: games[8].name,
      gameCover: games[8].coverImage,
      owner: OWNER,
      createdAt: pastDate(2, 4),
      updatedAt: pastDate(2, 4),
    },
    {
      id: "activity-009",
      userId: "user-009",
      username: users[8].username,
      avatar: users[8].avatar,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Unlocked 'Speed Demon'",
      description: "Finished all time trials under gold time in Velocity Rush.",
      gameId: "game-004",
      gameName: games[3].name,
      gameCover: games[3].coverImage,
      owner: OWNER,
      createdAt: pastDate(3, 2),
      updatedAt: pastDate(3, 2),
    },

    // --- LEVEL_UP activities ---
    {
      id: "activity-010",
      userId: "user-004",
      username: users[3].username,
      avatar: users[3].avatar,
      type: "LEVEL_UP",
      title: "Reached Level 22",
      description: "NovaBlade advanced to level 22! Keep it up!",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(0, 6),
      updatedAt: pastDate(0, 6),
    },
    {
      id: "activity-011",
      userId: "user-001",
      username: users[0].username,
      avatar: users[0].avatar,
      type: "LEVEL_UP",
      title: "Reached Level 42",
      description: "AlexStorm is now level 42—halfway to legendary!",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(2, 0),
      updatedAt: pastDate(2, 0),
    },
    {
      id: "activity-012",
      userId: "user-008",
      username: users[7].username,
      avatar: users[7].avatar,
      type: "LEVEL_UP",
      title: "Reached Level 5",
      description: "DrakeEmber just hit level 5. The journey begins!",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(4, 1),
      updatedAt: pastDate(4, 1),
    },

    // --- RANK_UP activities ---
    {
      id: "activity-013",
      userId: "user-002",
      username: users[1].username,
      avatar: users[1].avatar,
      type: "RANK_UP",
      title: "Promoted to Platinum",
      description: "LunaCipher ranked up from Gold to Platinum!",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(1, 4),
      updatedAt: pastDate(1, 4),
    },
    {
      id: "activity-014",
      userId: "user-005",
      username: users[4].username,
      avatar: users[4].avatar,
      type: "RANK_UP",
      title: "Promoted to Grandmaster",
      description: "ZaraVortex achieved the ultimate rank—Grandmaster!",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(5, 0),
      updatedAt: pastDate(5, 0),
    },

    // --- FRIEND_ADDED activities ---
    {
      id: "activity-015",
      userId: "user-006",
      username: users[5].username,
      avatar: users[5].avatar,
      type: "FRIEND_ADDED",
      title: "Added KaiPhoenix as a friend",
      description: "RivenShadow and KaiPhoenix are now friends.",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(0, 10),
      updatedAt: pastDate(0, 10),
    },
    {
      id: "activity-016",
      userId: "user-010",
      username: users[9].username,
      avatar: users[9].avatar,
      type: "FRIEND_ADDED",
      title: "Added AlexStorm as a friend",
      description: "JaxThunder and AlexStorm are now friends.",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(2, 7),
      updatedAt: pastDate(2, 7),
    },
    {
      id: "activity-017",
      userId: "user-003",
      username: users[2].username,
      avatar: users[2].avatar,
      type: "GAME_PLAYED",
      title: "Played Skybound Horizons",
      description: "Spent 4 hours exploring the open world and completing side quests.",
      gameId: "game-010",
      gameName: games[9].name,
      gameCover: games[9].coverImage,
      owner: OWNER,
      createdAt: pastDate(0, 3),
      updatedAt: pastDate(0, 3),
    },
    {
      id: "activity-018",
      userId: "user-009",
      username: users[8].username,
      avatar: users[8].avatar,
      type: "GAME_PLAYED",
      title: "Played Warfront Tactics",
      description: "Won a 1v1 ranked tactics match with a flawless strategy.",
      gameId: "game-008",
      gameName: games[7].name,
      gameCover: games[7].coverImage,
      owner: OWNER,
      createdAt: pastDate(1, 6),
      updatedAt: pastDate(1, 6),
    },
    {
      id: "activity-019",
      userId: "user-004",
      username: users[3].username,
      avatar: users[3].avatar,
      type: "ACHIEVEMENT_UNLOCKED",
      title: "Unlocked 'Gravity Master'",
      description: "Completed all levels in Gravity Shift without dying.",
      gameId: "game-007",
      gameName: games[6].name,
      gameCover: games[6].coverImage,
      owner: OWNER,
      createdAt: pastDate(3, 5),
      updatedAt: pastDate(3, 5),
    },
    {
      id: "activity-020",
      userId: "user-007",
      username: users[6].username,
      avatar: users[6].avatar,
      type: "RANK_UP",
      title: "Promoted to Platinum",
      description: "EchoFrost climbed from Gold to Platinum rank!",
      gameId: undefined,
      gameName: undefined,
      gameCover: undefined,
      owner: OWNER,
      createdAt: pastDate(4, 0),
      updatedAt: pastDate(4, 0),
    },
  ];
}

// ---------------------------------------------------------------------------
// Batch write helpers
// ---------------------------------------------------------------------------

/**
 * DynamoDB BatchWriteItem supports max 25 items per call.
 * This helper splits items into chunks and handles unprocessed items.
 */
async function batchWriteItems(tableName, items) {
  const BATCH_SIZE = 25;
  let totalWritten = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const requestItems = {
      [tableName]: batch.map((item) => ({
        PutRequest: { Item: item },
      })),
    };

    let unprocessed = requestItems;
    let retries = 0;

    while (
      unprocessed &&
      unprocessed[tableName] &&
      unprocessed[tableName].length > 0
    ) {
      const result = await docClient.send(
        new BatchWriteCommand({ RequestItems: unprocessed })
      );

      const written =
        (unprocessed[tableName]?.length ?? 0) -
        (result.UnprocessedItems?.[tableName]?.length ?? 0);
      totalWritten += written;

      unprocessed = result.UnprocessedItems;

      if (
        unprocessed &&
        unprocessed[tableName] &&
        unprocessed[tableName].length > 0
      ) {
        retries++;
        if (retries > 5) {
          console.error(
            `  ⚠ Gave up after 5 retries – ${unprocessed[tableName].length} items unprocessed`
          );
          break;
        }
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 2 ** retries * 100));
      }
    }
  }

  return totalWritten;
}

/**
 * Scan and delete all items seeded by this script (matching owner).
 */
async function deleteSeededItems(tableName) {
  let deleted = 0;
  let lastKey;

  do {
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "#owner = :owner",
        ExpressionAttributeNames: { "#owner": "owner" },
        ExpressionAttributeValues: { ":owner": OWNER },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of scanResult.Items ?? []) {
      await docClient.send(
        new DeleteCommand({ TableName: tableName, Key: { id: item.id } })
      );
      deleted++;
    }

    lastKey = scanResult.LastEvaluatedKey;
  } while (lastKey);

  return deleted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🎮 GameSphere DynamoDB Seed Script");
  console.log(`   Region : ${REGION}`);
  console.log(`   Owner  : ${OWNER}`);
  console.log(`   Mode   : ${DELETE_MODE ? "DELETE" : "SEED"}\n`);

  // Step 1 – Discover tables
  console.log("🔍 Discovering Amplify-generated DynamoDB tables...");
  const tableMap = await discoverTableNames();

  const requiredModels = ["User", "Game", "PlayerStats", "Activity"];
  const missing = requiredModels.filter((m) => !tableMap[m]);

  if (missing.length > 0) {
    console.error(
      `\n❌ Could not find tables for: ${missing.join(", ")}\n` +
        "   Make sure the Amplify sandbox is running (npx ampx sandbox).\n" +
        "   Found tables:"
    );
    for (const [model, table] of Object.entries(tableMap)) {
      console.error(`     ${model} → ${table}`);
    }
    process.exit(1);
  }

  console.log("   Found tables:");
  for (const [model, table] of Object.entries(tableMap)) {
    console.log(`     ${model} → ${table}`);
  }
  console.log();

  // Step 2 – Delete or Seed
  if (DELETE_MODE) {
    console.log("🗑  Deleting seeded data...\n");
    for (const model of requiredModels) {
      const count = await deleteSeededItems(tableMap[model]);
      console.log(`   ${model}: deleted ${count} items`);
    }
    console.log("\n✅ Cleanup complete!");
    return;
  }

  // Generate data
  const users = generateUsers();
  const games = generateGames();
  const playerStats = generatePlayerStats(users);
  const activities = generateActivities(users, games);

  // Write in dependency order: Users first, then Games, PlayerStats & Activities
  console.log("📝 Seeding User table...");
  const usersWritten = await batchWriteItems(tableMap.User, users);
  console.log(`   ✓ ${usersWritten} users written\n`);

  console.log("📝 Seeding Game table...");
  const gamesWritten = await batchWriteItems(tableMap.Game, games);
  console.log(`   ✓ ${gamesWritten} games written\n`);

  console.log("📝 Seeding PlayerStats table...");
  const statsWritten = await batchWriteItems(tableMap.PlayerStats, playerStats);
  console.log(`   ✓ ${statsWritten} player stats written\n`);

  console.log("📝 Seeding Activity table...");
  const activitiesWritten = await batchWriteItems(tableMap.Activity, activities);
  console.log(`   ✓ ${activitiesWritten} activities written\n`);

  console.log("✅ Seed complete!");
  console.log(`   Total items: ${usersWritten + gamesWritten + statsWritten + activitiesWritten}`);
  console.log(`\n💡 To remove this data run: node scripts/seed-dynamodb-data.js --delete`);
}

main().catch((err) => {
  console.error("\n❌ Seed script failed:", err.message ?? err);
  process.exit(1);
});

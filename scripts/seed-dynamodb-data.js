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

import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Read amplify_outputs.json once and cache it. */
function loadAmplifyOutputs() {
  return JSON.parse(
    readFileSync(join(__dirname, "..", "amplify_outputs.json"), "utf-8")
  );
}

const amplifyOutputs = loadAmplifyOutputs();
const REGION = amplifyOutputs?.data?.aws_region ?? amplifyOutputs?.auth?.aws_region ?? "us-east-1";
const AUTH_REGION = amplifyOutputs?.auth?.aws_region ?? REGION;
const USER_POOL_ID = amplifyOutputs?.auth?.user_pool_id;
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
const cognitoClient = new CognitoIdentityProviderClient({ region: AUTH_REGION });

// The 3 Cognito test users created by seed-cognito-user.js
const COGNITO_TEST_EMAILS = ["test@test.com", "friend01@test.com", "friend02@test.com"];

// Synthetic users (no Cognito account) for leaderboard population
const SYNTHETIC_USERS = [
  { id: "synth-user-001", email: "novablitz@fake.com",    username: "NovaBlitz",    rank: "GOLD",        xp: 14200, level: 28, status: "ONLINE" },
  { id: "synth-user-002", email: "shadowfang@fake.com",   username: "ShadowFang",   rank: "PLATINUM",    xp: 19800, level: 38, status: "OFFLINE" },
  { id: "synth-user-003", email: "ironvexa@fake.com",     username: "IronVexa",     rank: "SILVER",      xp: 9500,  level: 22, status: "AWAY" },
  { id: "synth-user-004", email: "zephyrblade@fake.com",  username: "ZephyrBlade",  rank: "DIAMOND",     xp: 27000, level: 48, status: "IN_GAME" },
  { id: "synth-user-005", email: "crimsonecho@fake.com",  username: "CrimsonEcho",  rank: "BRONZE",      xp: 4800,  level: 15, status: "OFFLINE" },
  { id: "synth-user-006", email: "astralwolf@fake.com",   username: "AstralWolf",   rank: "MASTER",      xp: 33500, level: 58, status: "ONLINE" },
  { id: "synth-user-007", email: "pixelduke@fake.com",    username: "PixelDuke",    rank: "GOLD",        xp: 15000, level: 30, status: "OFFLINE" },
];

/**
 * Looks up each test email in Cognito and returns [{ email, sub }, ...]
 */
async function fetchCognitoUsers() {
  const results = [];
  for (const email of COGNITO_TEST_EMAILS) {
    const { UserAttributes } = await cognitoClient.send(
      new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
    );
    const sub = UserAttributes.find((a) => a.Name === "sub")?.Value;
    if (!sub) throw new Error(`Could not resolve sub for ${email}`);
    results.push({ email, sub });
  }
  return results;
}

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
      else if (/^GameStats-/i.test(name)) tableMap.GameStats = name;
      else if (/^Achievement-/i.test(name)) tableMap.Achievement = name;
      else if (/^Friendship-/i.test(name)) tableMap.Friendship = name;
      else if (/^LeaderboardEntry-/i.test(name)) tableMap.LeaderboardEntry = name;
      else if (/^LiveSession-/i.test(name)) tableMap.LiveSession = name;
      else if (/^ChatRoom-/i.test(name)) tableMap.ChatRoom = name;
      else if (/^ChatMessage-/i.test(name)) tableMap.ChatMessage = name;
    }
    exclusiveStartTableName = LastEvaluatedTableName;
  } while (exclusiveStartTableName);

  return tableMap;
}

// ---------------------------------------------------------------------------
// Test data generators
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

/**
 * Generates User records whose id/email come from real Cognito accounts.
 * cognitoUsers = [{ email, sub }, ...] — returned by fetchCognitoUsers().
 * Mapping: [0] test@test.com → AlexStorm, [1] friend01 → LunaCipher, [2] friend02 → KaiPhoenix
 */
function generateUsers(cognitoUsers) {
  const profiles = [
    { username: "AlexStorm",   rank: "DIAMOND",     xp: 24500, level: 42, status: "ONLINE" },
    { username: "LunaCipher",  rank: "PLATINUM",    xp: 18200, level: 35, status: "IN_GAME" },
    { username: "KaiPhoenix",  rank: "MASTER",      xp: 31000, level: 55, status: "ONLINE" },
  ];

  const users = cognitoUsers.map(({ email, sub }, i) => ({
    id: sub,
    email,
    username: profiles[i].username,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${profiles[i].username}`,
    rank: profiles[i].rank,
    xp: profiles[i].xp,
    level: profiles[i].level,
    status: profiles[i].status,
    owner: sub,
    createdAt: now,
    updatedAt: now,
  }));

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
  // One entry per Cognito user: AlexStorm, LunaCipher, KaiPhoenix
  const statsData = [
    { gamesOwned: 47, achievementsUnlocked: 312, totalHoursPlayed: 1850.5, totalAchievements: 500, totalWins: 420, totalMatches: 680, winRate: 61.8, currentStreak: 7, longestStreak: 15 },
    { gamesOwned: 32, achievementsUnlocked: 198, totalHoursPlayed: 1200.0, totalAchievements: 350, totalWins: 310, totalMatches: 520, winRate: 59.6, currentStreak: 4, longestStreak: 12 },
    { gamesOwned: 65, achievementsUnlocked: 485, totalHoursPlayed: 3200.8, totalAchievements: 650, totalWins: 780, totalMatches: 1100, winRate: 70.9, currentStreak: 12, longestStreak: 22 },
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

function generateGameStats(users, games) {
  const pastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  const ranks = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER"];

  // Each entry: [userIndex, gameIndex, hoursPlayed, daysAgoLastPlayed, rankIndex, winRate, totalMatches, wins, losses]
  // userIndex: 0=AlexStorm (test@test.com), 1=LunaCipher (friend01), 2=KaiPhoenix (friend02)
  const raw = [
    // AlexStorm – 7 games
    [0, 0, 320.5,  0, 4, 68.2, 220, 150, 70],   // Stellar Odyssey
    [0, 1, 180.3,  2, 3, 55.0, 120,  66, 54],   // CyberStrike
    [0, 2,  95.0,  5, 2, 72.0,  50,  36, 14],   // Dragon's Ascent
    [0, 3,  62.4,  7, 2, 48.5,  66,  32, 34],   // Velocity Rush
    [0, 4,  41.2, 14, 1, 52.0,  25,  13, 12],   // Phantom Realms
    [0, 7, 110.8,  3, 3, 60.0,  90,  54, 36],   // Warfront Tactics
    [0, 8,  78.5,  1, 2, 44.3,  70,  31, 39],   // Neon Arena

    // LunaCipher – 6 games
    [1, 1, 410.2,  0, 4, 62.5, 340, 212, 128],  // CyberStrike
    [1, 5, 250.0,  1, 3, 58.0, 180, 104,  76],  // Arcane Legends
    [1, 0, 145.6,  4, 3, 61.0, 100,  61,  39],  // Stellar Odyssey
    [1, 8, 198.3,  0, 4, 66.8, 220, 147,  73],  // Neon Arena
    [1, 6,  55.0, 10, 1, 70.0,  30,  21,   9],  // Gravity Shift
    [1, 4,  88.7,  6, 2, 53.2,  80,  42,  38],  // Phantom Realms

    // KaiPhoenix – 8 games
    [2, 2, 680.7,  0, 5, 74.3, 450, 334, 116],  // Dragon's Ascent
    [2, 9, 520.1,  1, 5, 71.0, 380, 270, 110],  // Skybound Horizons
    [2, 0, 210.0,  3, 4, 66.0, 160, 106,  54],  // Stellar Odyssey
    [2, 1, 155.9,  2, 3, 59.4, 130,  77,  53],  // CyberStrike
    [2, 5, 340.0,  1, 5, 72.5, 280, 203,  77],  // Arcane Legends
    [2, 7, 190.3,  4, 4, 68.0, 200, 136,  64],  // Warfront Tactics
    [2, 3, 125.0,  8, 3, 55.0, 100,  55,  45],  // Velocity Rush
    [2, 8, 260.5,  0, 4, 63.7, 310, 198, 112],  // Neon Arena
  ];

  return raw.map(([ui, gi, hours, daysAgo, ri, wr, tm, w, l], idx) => ({
    id: `gamestats-${String(idx + 1).padStart(3, "0")}`,
    userId: users[ui].id,
    gameId: games[gi].id,
    gameName: games[gi].name,
    gameCover: games[gi].coverImage,
    hoursPlayed: hours,
    lastPlayed: pastDate(daysAgo),
    rank: ranks[ri],
    winRate: wr,
    totalMatches: tm,
    wins: w,
    losses: l,
    owner: OWNER,
    createdAt: now,
    updatedAt: now,
  }));
}

function generateAchievements(users, games) {
  const pastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    // AlexStorm (test@test.com) achievements
    { id: "ach-001", userId: users[0].id, gameId: "game-001", gameName: "Stellar Odyssey",     name: "Starbound Explorer",   description: "Discovered all hidden planets.",                  icon: "🌌", rarity: "EPIC",      unlockedAt: pastDate(1) },
    { id: "ach-002", userId: users[0].id, gameId: "game-001", gameName: "Stellar Odyssey",     name: "First Contact",        description: "Encountered an alien civilisation for the first time.", icon: "👽", rarity: "COMMON",    unlockedAt: pastDate(30) },
    { id: "ach-003", userId: users[0].id, gameId: "game-002", gameName: "CyberStrike 2077",    name: "Headshot Specialist",  description: "Landed 500 headshots.",                           icon: "🎯", rarity: "RARE",      unlockedAt: pastDate(10) },
    { id: "ach-004", userId: users[0].id, gameId: "game-002", gameName: "CyberStrike 2077",    name: "Neon Warrior",         description: "Won 50 ranked matches.",                           icon: "⚔️", rarity: "UNCOMMON",  unlockedAt: pastDate(15) },

    // LunaCipher (friend01@test.com) achievements
    { id: "ach-005", userId: users[1].id, gameId: "game-002", gameName: "CyberStrike 2077",    name: "Unstoppable",          description: "Achieved a 10-kill streak.",                       icon: "🔥", rarity: "RARE",      unlockedAt: pastDate(2) },
    { id: "ach-006", userId: users[1].id, gameId: "game-006", gameName: "Arcane Legends Online",name: "Dungeon Crawler",      description: "Cleared 50 dungeons.",                             icon: "🏰", rarity: "UNCOMMON",  unlockedAt: pastDate(8) },

    // KaiPhoenix (friend02@test.com) achievements
    { id: "ach-007", userId: users[2].id, gameId: "game-003", gameName: "Dragon's Ascent",     name: "Dragon Slayer",        description: "Defeated 100 dragons.",                            icon: "🐉", rarity: "LEGENDARY", unlockedAt: pastDate(1) },
    { id: "ach-008", userId: users[2].id, gameId: "game-003", gameName: "Dragon's Ascent",     name: "Flame Forged",         description: "Forged a legendary weapon from dragon fire.",       icon: "🗡️", rarity: "EPIC",      unlockedAt: pastDate(5) },
    { id: "ach-009", userId: users[2].id, gameId: "game-010", gameName: "Skybound Horizons",   name: "World Wanderer",       description: "Explored every region on the map.",                icon: "🗺️", rarity: "RARE",      unlockedAt: pastDate(3) },
    { id: "ach-010", userId: users[2].id, gameId: "game-001", gameName: "Stellar Odyssey",     name: "Warp Speed",           description: "Travelled 10,000 light-years.",                    icon: "🚀", rarity: "UNCOMMON",  unlockedAt: pastDate(12) },

  ].map((a) => ({
    ...a,
    owner: OWNER,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Generate the 7 synthetic User records (no Cognito account, no friends).
 */
function generateSyntheticUsers() {
  return SYNTHETIC_USERS.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`,
    rank: u.rank,
    xp: u.xp,
    level: u.level,
    status: u.status,
    owner: OWNER,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Generate PlayerStats for synthetic users.
 */
function generateSyntheticPlayerStats(synthUsers) {
  const data = [
    { gamesOwned: 25, achievementsUnlocked: 130, totalHoursPlayed:  820.3, totalAchievements: 250, totalWins: 185, totalMatches: 340, winRate: 54.4, currentStreak: 3,  longestStreak: 9  },
    { gamesOwned: 40, achievementsUnlocked: 275, totalHoursPlayed: 1550.0, totalAchievements: 400, totalWins: 390, totalMatches: 610, winRate: 63.9, currentStreak: 8,  longestStreak: 18 },
    { gamesOwned: 18, achievementsUnlocked:  85, totalHoursPlayed:  480.5, totalAchievements: 180, totalWins: 110, totalMatches: 250, winRate: 44.0, currentStreak: 1,  longestStreak: 6  },
    { gamesOwned: 52, achievementsUnlocked: 390, totalHoursPlayed: 2600.2, totalAchievements: 520, totalWins: 580, totalMatches: 850, winRate: 68.2, currentStreak: 10, longestStreak: 20 },
    { gamesOwned: 12, achievementsUnlocked:  45, totalHoursPlayed:  210.0, totalAchievements: 100, totalWins:  55, totalMatches: 150, winRate: 36.7, currentStreak: 0,  longestStreak: 4  },
    { gamesOwned: 58, achievementsUnlocked: 510, totalHoursPlayed: 3500.1, totalAchievements: 700, totalWins: 820, totalMatches: 1150, winRate: 71.3, currentStreak: 14, longestStreak: 25 },
    { gamesOwned: 28, achievementsUnlocked: 155, totalHoursPlayed:  950.7, totalAchievements: 280, totalWins: 210, totalMatches: 400, winRate: 52.5, currentStreak: 2,  longestStreak: 8  },
  ];
  return synthUsers.map((u, i) => {
    const d = data[i];
    const weeklyPlaytime = Array.from({ length: 7 }, () => parseFloat((Math.random() * 5 + 0.5).toFixed(1)));
    const monthlyPlaytime = Array.from({ length: 12 }, () => parseFloat((Math.random() * 120 + 20).toFixed(1)));
    return {
      id: `stats-${u.id}`,
      userId: u.id,
      ...d,
      weeklyPlaytime,
      monthlyPlaytime,
      owner: OWNER,
      createdAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Generate GameStats for synthetic users.
 */
function generateSyntheticGameStats(synthUsers, games) {
  const pastDate = (daysAgo) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString(); };
  const ranks = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER", "GRANDMASTER"];
  // [synthUserIndex, gameIndex, hours, daysAgo, rankIdx, winRate, matches, wins, losses]
  const raw = [
    [0, 0, 180.0, 1, 2, 56.0, 90,  50, 40],
    [0, 1, 140.3, 0, 2, 51.0, 80,  41, 39],
    [0, 8, 100.0, 3, 1, 48.0, 60,  29, 31],
    [1, 2, 350.0, 0, 3, 65.0, 200, 130, 70],
    [1, 1, 280.0, 1, 4, 62.0, 170, 105, 65],
    [1, 9, 200.0, 2, 3, 60.0, 120, 72,  48],
    [2, 0, 120.0, 5, 1, 42.0, 70,  29, 41],
    [2, 4, 100.5, 3, 1, 45.0, 60,  27, 33],
    [3, 2, 550.0, 0, 4, 70.0, 300, 210, 90],
    [3, 0, 420.2, 1, 4, 67.0, 240, 161, 79],
    [3, 5, 380.0, 2, 4, 66.0, 200, 132, 68],
    [3, 9, 310.0, 0, 3, 64.0, 180, 115, 65],
    [4, 1,  80.0, 7, 0, 35.0, 50,  18, 32],
    [4, 8,  55.0, 4, 0, 38.0, 40,  15, 25],
    [5, 2, 800.0, 0, 5, 73.0, 500, 365, 135],
    [5, 0, 600.5, 1, 5, 70.0, 350, 245, 105],
    [5, 9, 480.0, 0, 4, 68.0, 280, 190, 90],
    [5, 5, 420.6, 2, 5, 72.0, 250, 180, 70],
    [5, 7, 350.0, 3, 4, 69.0, 220, 152, 68],
    [6, 0, 220.0, 2, 2, 54.0, 120, 65, 55],
    [6, 3, 180.7, 1, 2, 50.0, 100, 50, 50],
    [6, 6,  90.0, 5, 1, 55.0, 50,  28, 22],
  ];
  return raw.map(([ui, gi, hours, daysAgo, ri, wr, tm, w, l], idx) => ({
    id: `synth-gamestats-${String(idx + 1).padStart(3, "0")}`,
    userId: synthUsers[ui].id,
    gameId: games[gi].id,
    gameName: games[gi].name,
    gameCover: games[gi].coverImage,
    hoursPlayed: hours,
    lastPlayed: pastDate(daysAgo),
    rank: ranks[ri],
    winRate: wr,
    totalMatches: tm,
    wins: w,
    losses: l,
    owner: OWNER,
    createdAt: now,
    updatedAt: now,
  }));
}

/**
 * Generate LeaderboardEntry records for ALL users (Cognito + synthetic).
 * Creates entries for DAILY, MONTHLY, and ALL_TIME periods.
 */
function generateLeaderboardEntries(allUsers, allPlayerStats, allGameStats, games) {
  const entries = [];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const allTimeStart = new Date("2024-01-01T00:00:00.000Z");

  const periodConfigs = [
    { period: "DAILY",    periodStart: todayStart.toISOString(),   hoursFactor: 0.03, winsFactor: 0.05, achFactor: 0.02 },
    { period: "MONTHLY",  periodStart: monthStart.toISOString(),   hoursFactor: 0.25, winsFactor: 0.30, achFactor: 0.20 },
    { period: "ALL_TIME", periodStart: allTimeStart.toISOString(), hoursFactor: 1.0,  winsFactor: 1.0,  achFactor: 1.0  },
  ];

  let idx = 0;

  for (const user of allUsers) {
    const stats = allPlayerStats.find((s) => s.userId === user.id);
    if (!stats) continue;

    for (const pc of periodConfigs) {
      // Global entry (no gameId)
      idx++;
      entries.push({
        id: `lb-${String(idx).padStart(4, "0")}`,
        userId: user.id,
        period: pc.period,
        gameId: undefined,
        gameName: undefined,
        hoursPlayed: parseFloat((stats.totalHoursPlayed * pc.hoursFactor).toFixed(1)),
        wins: Math.round(stats.totalWins * pc.winsFactor),
        achievementsUnlocked: Math.round(stats.achievementsUnlocked * pc.achFactor),
        winRate: stats.winRate,
        totalMatches: Math.round(stats.totalMatches * pc.winsFactor),
        periodStart: pc.periodStart,
        owner: OWNER,
        createdAt: now,
        updatedAt: now,
      });

      // Per-game entries
      const userGameStats = allGameStats.filter((gs) => gs.userId === user.id);
      for (const gs of userGameStats) {
        idx++;
        entries.push({
          id: `lb-${String(idx).padStart(4, "0")}`,
          userId: user.id,
          period: pc.period,
          gameId: gs.gameId,
          gameName: gs.gameName,
          hoursPlayed: parseFloat((gs.hoursPlayed * pc.hoursFactor).toFixed(1)),
          wins: Math.round(gs.wins * pc.winsFactor),
          achievementsUnlocked: 0,
          winRate: gs.winRate,
          totalMatches: Math.round(gs.totalMatches * pc.winsFactor),
          periodStart: pc.periodStart,
          owner: OWNER,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return entries;
}

function generateFriendships(users) {
  const pastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    // AlexStorm & LunaCipher — accepted friends
    {
      id: "friendship-001",
      requesterId: users[0].id,
      addresseeId: users[1].id,
      status: "ACCEPTED",
      friendSince: pastDate(90),
      note: "Met in CyberStrike ranked",
      interactionCount: 74,
      lastInteractionAt: pastDate(0),
      owner: users[0].id,
      createdAt: pastDate(95),
      updatedAt: pastDate(90),
    },
    // AlexStorm & KaiPhoenix — accepted friends
    {
      id: "friendship-002",
      requesterId: users[2].id,
      addresseeId: users[0].id,
      status: "ACCEPTED",
      friendSince: pastDate(200),
      note: "OG gaming buddy",
      interactionCount: 152,
      lastInteractionAt: pastDate(1),
      owner: users[2].id,
      createdAt: pastDate(210),
      updatedAt: pastDate(200),
    },
    // LunaCipher & KaiPhoenix — accepted friends
    {
      id: "friendship-003",
      requesterId: users[1].id,
      addresseeId: users[2].id,
      status: "ACCEPTED",
      friendSince: pastDate(45),
      note: null,
      interactionCount: 31,
      lastInteractionAt: pastDate(3),
      owner: users[1].id,
      createdAt: pastDate(50),
      updatedAt: pastDate(45),
    },
    // Pending request from AlexStorm to a hypothetical addressee (KaiPhoenix's alt scenario)
    {
      id: "friendship-004",
      requesterId: users[0].id,
      addresseeId: users[2].id,
      status: "PENDING",
      friendSince: null,
      note: "Want to team up in Neon Arena",
      interactionCount: 0,
      lastInteractionAt: null,
      owner: users[0].id,
      createdAt: pastDate(2),
      updatedAt: pastDate(2),
    },
    // Declined request from LunaCipher to AlexStorm
    {
      id: "friendship-005",
      requesterId: users[1].id,
      addresseeId: users[0].id,
      status: "DECLINED",
      friendSince: null,
      note: null,
      interactionCount: 0,
      lastInteractionAt: null,
      owner: users[1].id,
      createdAt: pastDate(120),
      updatedAt: pastDate(118),
    },
  ];
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
      userId: users[0].id,
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
      userId: users[1].id,
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
      userId: users[2].id,
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
    // --- ACHIEVEMENT_UNLOCKED activities ---
    {
      id: "activity-006",
      userId: users[0].id,
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
      userId: users[2].id,
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
      id: "activity-011",
      userId: users[0].id,
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

    // --- RANK_UP activities ---
    {
      id: "activity-013",
      userId: users[1].id,
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

    // --- FRIEND_ADDED activities ---
    {
      id: "activity-017",
      userId: users[2].id,
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
  ];
}

/**
 * Generate LiveSession records — active sessions for friend01 and friend02.
 */
function generateLiveSessions(users, games) {
  const minutesAgo = (m) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - m);
    return d.toISOString();
  };

  return [
    {
      id: "session-001",
      hostId: users[1].id,            // LunaCipher
      gameId: games[1].id,            // CyberStrike 2077
      gameName: games[1].name,
      gameCover: games[1].coverImage,
      sessionStatus: "ACTIVE",
      maxPlayers: 4,
      currentPlayers: 1,
      startedAt: minutesAgo(35),
      endedAt: undefined,
      title: "Ranked grind — need 1 more",
      participantIds: [users[1].id],
      owner: OWNER,
      createdAt: minutesAgo(35),
      updatedAt: minutesAgo(35),
    },
    {
      id: "session-002",
      hostId: users[2].id,            // KaiPhoenix
      gameId: games[2].id,            // Dragon's Ascent
      gameName: games[2].name,
      gameCover: games[2].coverImage,
      sessionStatus: "ACTIVE",
      maxPlayers: 6,
      currentPlayers: 2,
      startedAt: minutesAgo(12),
      endedAt: undefined,
      title: "Chill co-op dungeon run",
      participantIds: [users[2].id, users[1].id],
      owner: OWNER,
      createdAt: minutesAgo(12),
      updatedAt: minutesAgo(5),
    },
    // An ended session for history
    {
      id: "session-003",
      hostId: users[1].id,            // LunaCipher
      gameId: games[8].id,            // Neon Arena
      gameName: games[8].name,
      gameCover: games[8].coverImage,
      sessionStatus: "ENDED",
      maxPlayers: 4,
      currentPlayers: 3,
      startedAt: minutesAgo(180),
      endedAt: minutesAgo(90),
      title: "Battle royale with friends",
      participantIds: [users[1].id, users[0].id, users[2].id],
      owner: OWNER,
      createdAt: minutesAgo(180),
      updatedAt: minutesAgo(90),
    },
  ];
}

/**
 * Generate ChatRoom records — session chats + a direct chat.
 */
function generateChatRooms(users, sessions) {
  const minutesAgo = (m) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - m);
    return d.toISOString();
  };

  return [
    // Session chat for session-001
    {
      id: "chatroom-001",
      name: "CyberStrike Session",
      sessionId: sessions[0].id,
      participantIds: [users[1].id],
      lastMessageAt: minutesAgo(33),
      lastMessagePreview: "Just started — join up!",
      owner: OWNER,
      createdAt: minutesAgo(35),
      updatedAt: minutesAgo(33),
    },
    // Session chat for session-002
    {
      id: "chatroom-002",
      name: "Dragon's Ascent Co-op",
      sessionId: sessions[1].id,
      participantIds: [users[2].id, users[1].id],
      lastMessageAt: minutesAgo(3),
      lastMessagePreview: "Ready for the boss fight?",
      owner: OWNER,
      createdAt: minutesAgo(12),
      updatedAt: minutesAgo(3),
    },
    // Direct chat between AlexStorm & LunaCipher
    {
      id: "chatroom-003",
      name: null,
      sessionId: null,
      participantIds: [users[0].id, users[1].id],
      lastMessageAt: minutesAgo(15),
      lastMessagePreview: "gg, nice game!",
      owner: OWNER,
      createdAt: minutesAgo(120),
      updatedAt: minutesAgo(15),
    },
    // Direct chat between AlexStorm & KaiPhoenix
    {
      id: "chatroom-004",
      name: null,
      sessionId: null,
      participantIds: [users[0].id, users[2].id],
      lastMessageAt: minutesAgo(60),
      lastMessagePreview: "Wanna play later tonight?",
      owner: OWNER,
      createdAt: minutesAgo(200),
      updatedAt: minutesAgo(60),
    },
  ];
}

/**
 * Generate ChatMessage records for each chat room.
 */
function generateChatMessages(chatRooms, users) {
  const minutesAgo = (m) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - m);
    return d.toISOString();
  };

  const messages = [];
  let idx = 0;

  // Helper to push a message
  const add = (chatRoomId, sender, body, minsAgo, messageType = "TEXT") => {
    idx++;
    messages.push({
      id: `chatmsg-${String(idx).padStart(3, "0")}`,
      chatRoomId,
      senderId: sender.id,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      body,
      messageType,
      owner: OWNER,
      createdAt: minutesAgo(minsAgo),
      updatedAt: minutesAgo(minsAgo),
    });
  };

  // chatroom-001: CyberStrike Session (LunaCipher solo)
  add("chatroom-001", users[1], "LunaCipher started a session", 35, "SYSTEM");
  add("chatroom-001", users[1], "Just started — join up!", 33);

  // chatroom-002: Dragon's Ascent Co-op (KaiPhoenix + LunaCipher)
  add("chatroom-002", users[2], "KaiPhoenix started a session", 12, "SYSTEM");
  add("chatroom-002", users[1], "LunaCipher joined the session", 10, "JOIN");
  add("chatroom-002", users[2], "Hey Luna, let's hit the Ice Caves first", 8);
  add("chatroom-002", users[1], "Sounds good, I'll go healer", 6);
  add("chatroom-002", users[2], "Ready for the boss fight?", 3);

  // chatroom-003: Direct chat AlexStorm ↔ LunaCipher
  add("chatroom-003", users[0], "Hey, wanna do some CyberStrike later?", 90);
  add("chatroom-003", users[1], "Sure! I'll be on around 8", 85);
  add("chatroom-003", users[0], "Perfect, I'll set up the lobby", 80);
  add("chatroom-003", users[1], "That was a sick clutch lol", 20);
  add("chatroom-003", users[0], "gg, nice game!", 15);

  // chatroom-004: Direct chat AlexStorm ↔ KaiPhoenix
  add("chatroom-004", users[2], "Yo, I just hit Master rank in Dragon's Ascent!", 180);
  add("chatroom-004", users[0], "No way, congrats!! 🎉", 175);
  add("chatroom-004", users[2], "Thanks! Took me like 200 hours lol", 170);
  add("chatroom-004", users[0], "Wanna play later tonight?", 60);

  return messages;
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

  const requiredModels = ["User", "Game", "PlayerStats", "Activity", "GameStats", "Achievement", "Friendship", "LeaderboardEntry", "LiveSession", "ChatRoom", "ChatMessage"];
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
  console.log("🔐 Fetching Cognito user subs...");
  const cognitoUsers = await fetchCognitoUsers();
  for (const { email, sub } of cognitoUsers) {
    console.log(`   ${email} → ${sub}`);
  }
  console.log();

  const cognitoUserRecords = generateUsers(cognitoUsers);
  const synthUserRecords = generateSyntheticUsers();
  const allUserRecords = [...cognitoUserRecords, ...synthUserRecords];
  const games = generateGames();
  const playerStats = generatePlayerStats(cognitoUserRecords);
  const synthPlayerStats = generateSyntheticPlayerStats(synthUserRecords);
  const allPlayerStats = [...playerStats, ...synthPlayerStats];
  const activities = generateActivities(cognitoUserRecords, games);
  const gameStatsList = generateGameStats(cognitoUserRecords, games);
  const synthGameStatsList = generateSyntheticGameStats(synthUserRecords, games);
  const allGameStats = [...gameStatsList, ...synthGameStatsList];
  const achievements = generateAchievements(cognitoUserRecords, games);
  const friendships = generateFriendships(cognitoUserRecords);
  const leaderboardEntries = generateLeaderboardEntries(allUserRecords, allPlayerStats, allGameStats, games);
  const liveSessions = generateLiveSessions(cognitoUserRecords, games);
  const chatRooms = generateChatRooms(cognitoUserRecords, liveSessions);
  const chatMessages = generateChatMessages(chatRooms, cognitoUserRecords);

  // Write in dependency order: Users first, then Games, then child tables
  console.log("📝 Seeding User table...");
  const usersWritten = await batchWriteItems(tableMap.User, allUserRecords);
  console.log(`   ✓ ${usersWritten} users written (${cognitoUserRecords.length} Cognito + ${synthUserRecords.length} synthetic)\n`);

  console.log("📝 Seeding Game table...");
  const gamesWritten = await batchWriteItems(tableMap.Game, games);
  console.log(`   ✓ ${gamesWritten} games written\n`);

  console.log("📝 Seeding PlayerStats table...");
  const statsWritten = await batchWriteItems(tableMap.PlayerStats, allPlayerStats);
  console.log(`   ✓ ${statsWritten} player stats written\n`);

  console.log("📝 Seeding Activity table...");
  const activitiesWritten = await batchWriteItems(tableMap.Activity, activities);
  console.log(`   ✓ ${activitiesWritten} activities written\n`);

  console.log("📝 Seeding GameStats table...");
  const gameStatsWritten = await batchWriteItems(tableMap.GameStats, allGameStats);
  console.log(`   ✓ ${gameStatsWritten} game stats written\n`);

  console.log("📝 Seeding Achievement table...");
  const achievementsWritten = await batchWriteItems(tableMap.Achievement, achievements);
  console.log(`   ✓ ${achievementsWritten} achievements written\n`);

  console.log("📝 Seeding Friendship table...");
  const friendshipsWritten = await batchWriteItems(tableMap.Friendship, friendships);
  console.log(`   ✓ ${friendshipsWritten} friendships written\n`);

  console.log("📝 Seeding LeaderboardEntry table...");
  const lbWritten = await batchWriteItems(tableMap.LeaderboardEntry, leaderboardEntries);
  console.log(`   ✓ ${lbWritten} leaderboard entries written\n`);

  console.log("📝 Seeding LiveSession table...");
  const liveSessionsWritten = await batchWriteItems(tableMap.LiveSession, liveSessions);
  console.log(`   ✓ ${liveSessionsWritten} live sessions written\n`);

  console.log("📝 Seeding ChatRoom table...");
  const chatRoomsWritten = await batchWriteItems(tableMap.ChatRoom, chatRooms);
  console.log(`   ✓ ${chatRoomsWritten} chat rooms written\n`);

  console.log("📝 Seeding ChatMessage table...");
  const chatMessagesWritten = await batchWriteItems(tableMap.ChatMessage, chatMessages);
  console.log(`   ✓ ${chatMessagesWritten} chat messages written\n`);

  const total = usersWritten + gamesWritten + statsWritten + activitiesWritten + gameStatsWritten + achievementsWritten + friendshipsWritten + lbWritten + liveSessionsWritten + chatRoomsWritten + chatMessagesWritten;
  console.log("✅ Seed complete!");
  console.log(`   Total items: ${total}`);
  console.log(`\n💡 To remove this data run: node scripts/seed-dynamodb-data.js --delete`);
}

main().catch((err) => {
  console.error("\n❌ Seed script failed:", err.message ?? err);
  process.exit(1);
});

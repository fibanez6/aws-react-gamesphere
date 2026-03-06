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
    [0, 0, 320.5,  0, 4, 68.2, 220, 150, 70],   // AlexStorm → Stellar Odyssey
    [0, 1, 180.3,  2, 3, 55.0, 120, 66,  54],    // AlexStorm → CyberStrike
    [0, 2, 95.0,   5, 2, 72.0, 50,  36,  14],    // AlexStorm → Dragon's Ascent
    [1, 1, 410.2,  0, 4, 62.5, 340, 212, 128],   // LunaCipher → CyberStrike
    [1, 5, 250.0,  1, 3, 58.0, 180, 104, 76],    // LunaCipher → Arcane Legends
    [2, 2, 680.7,  0, 5, 74.3, 450, 334, 116],   // KaiPhoenix → Dragon's Ascent
    [2, 9, 520.1,  1, 5, 71.0, 380, 270, 110],   // KaiPhoenix → Skybound Horizons
    [2, 0, 210.0,  3, 4, 66.0, 160, 106, 54],    // KaiPhoenix → Stellar Odyssey
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

  const requiredModels = ["User", "Game", "PlayerStats", "Activity", "GameStats", "Achievement", "Friendship"];
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

  const users = generateUsers(cognitoUsers);
  const games = generateGames();
  const playerStats = generatePlayerStats(users);
  const activities = generateActivities(users, games);
  const gameStatsList = generateGameStats(users, games);
  const achievements = generateAchievements(users, games);
  const friendships = generateFriendships(users);

  // Write in dependency order: Users first, then Games, then child tables
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

  console.log("📝 Seeding GameStats table...");
  const gameStatsWritten = await batchWriteItems(tableMap.GameStats, gameStatsList);
  console.log(`   ✓ ${gameStatsWritten} game stats written\n`);

  console.log("📝 Seeding Achievement table...");
  const achievementsWritten = await batchWriteItems(tableMap.Achievement, achievements);
  console.log(`   ✓ ${achievementsWritten} achievements written\n`);

  console.log("📝 Seeding Friendship table...");
  const friendshipsWritten = await batchWriteItems(tableMap.Friendship, friendships);
  console.log(`   ✓ ${friendshipsWritten} friendships written\n`);

  console.log("✅ Seed complete!");
  console.log(`   Total items: ${usersWritten + gamesWritten + statsWritten + activitiesWritten + gameStatsWritten + achievementsWritten + friendshipsWritten}`);
  console.log(`\n💡 To remove this data run: node scripts/seed-dynamodb-data.js --delete`);
}

main().catch((err) => {
  console.error("\n❌ Seed script failed:", err.message ?? err);
  process.exit(1);
});

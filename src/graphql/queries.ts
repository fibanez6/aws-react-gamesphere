// GraphQL Queries

// ============================================
// Fragments - Reusable field selections
// ============================================

const UserCoreFields = /* GraphQL */ `
  fragment UserCoreFields on User {
    id
    username
    email
    avatar
    level
    rank
    xp
    status
    createdAt
    updatedAt
  }
`;

const PlayerStatsFields = /* GraphQL */ `
  fragment PlayerStatsFields on PlayerStats {
    userId
    gamesOwned
    achievementsUnlocked
    totalHoursPlayed
    totalAchievements
    totalWins
    totalMatches
    winRate
    weeklyPlaytime
    monthlyPlaytime
    currentStreak
    longestStreak
  }
`;

const ActivityFields = /* GraphQL */ `
  fragment ActivityFields on Activity {
    id
    type
    userId
    username
    avatar
    title
    description
    gameId
    gameName
    gameCover
    createdAt
  }
`;

const GameStatsFields = /* GraphQL */ `
  fragment GameStatsFields on GameStats {
    gameId
    gameName
    gameCover
    hoursPlayed
    lastPlayed
    rank
    winRate
    totalMatches
    wins
    losses
  }
`;

const AchievementFields = /* GraphQL */ `
  fragment AchievementFields on Achievement {
    id
    name
    description
    icon
    rarity
    gameId
    gameName
    unlockedAt
  }
`;

const GameFields = /* GraphQL */ `
  fragment GameFields on Game {
    id
    name
    coverImage
    genre
    platform
    activePlayers
    avgPlaytime
    rating
    description
    releaseDate
  }
`;

// ============================================
// User Queries
// ============================================

export const getCurrentUser = /* GraphQL */ `
  query GetCurrentUser($userId: ID!) {
    getUser(userId: $userId) {
      ...UserCoreFields
      xpToNextLevel
      isOnline
      isPublicProfile
      lastActiveAt
    }
  }
  ${UserCoreFields}
`;

export const getUserStats = /* GraphQL */ `
  query GetPlayerStats($userId: ID!) {
    getPlayerStats(userId: $userId) {
      ...PlayerStatsFields
    }
  }
  ${PlayerStatsFields}
`;

// ============================================
// Player Profile Queries
// ============================================

export const getPlayerProfile = /* GraphQL */ `
  query GetPlayerProfile($userId: ID!) {
    getPlayerProfile(userId: $userId) {
      user {
        ...UserCoreFields
      }
      stats {
        ...PlayerStatsFields
      }
      gameStats {
        ...GameStatsFields
      }
      achievements {
        ...AchievementFields
      }
      recentActivity {
        ...ActivityFields
      }
    }
  }
  ${UserCoreFields}
  ${PlayerStatsFields}
  ${GameStatsFields}
  ${AchievementFields}
  ${ActivityFields}
`;

// Dashboard uses a subset of player profile
export const getPlayerDashboard = /* GraphQL */ `
  query GetPlayerDashboard($userId: ID!) {
    getPlayerProfile(userId: $userId) {
      user {
        ...UserCoreFields
      }
      recentActivity {
        ...ActivityFields
      }
    }
  }
  ${UserCoreFields}
  ${ActivityFields}
`;

// ============================================
// Activity Queries
// ============================================

export const getRecentActivities = /* GraphQL */ `
  query GetRecentActivities($userId: ID!, $limit: Int, $nextToken: String) {
    getRecentActivities(userId: $userId, limit: $limit, nextToken: $nextToken) {
      items {
        ...ActivityFields
      }
      nextToken
      totalCount
    }
  }
  ${ActivityFields}
`;

// ============================================
// Game Queries
// ============================================

export const getGame = /* GraphQL */ `
  query GetGame($gameId: ID!) {
    getGame(gameId: $gameId) {
      ...GameFields
    }
  }
  ${GameFields}
`;

export const listTopGames = /* GraphQL */ `
  query ListTopGames($filter: GameFilterInput, $limit: Int, $nextToken: String) {
    listTopGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        ...GameFields
      }
      nextToken
      totalCount
    }
  }
  ${GameFields}
`;

export const getGameDetails = /* GraphQL */ `
  query GetGameDetails($gameId: ID!) {
    getGameDetails(gameId: $gameId) {
      ...GameFields
    }
  }
  ${GameFields}
`;

// ============================================
// Friends Queries
// ============================================

export const getFriends = /* GraphQL */ `
  query GetFriends($userId: ID!, $limit: Int, $nextToken: String) {
    getFriends(userId: $userId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
        avatar
        level
        isOnline
        currentGame
        lastActiveAt
        status
      }
      nextToken
      totalCount
    }
  }
`;

// ============================================
// Leaderboard Queries
// ============================================

export const getLeaderboard = /* GraphQL */ `
  query GetLeaderboard($type: LeaderboardType!, $metric: LeaderboardMetric!, $gameId: ID, $timeRange: TimeRange, $limit: Int) {
    getLeaderboard(type: $type, metric: $metric, gameId: $gameId, timeRange: $timeRange, limit: $limit) {
      items {
        rank
        userId
        username
        avatar
        level
        score
        metric
        change
        changeAmount
      }
      totalCount
    }
  }
`;

// ============================================
// Live Sessions Queries
// ============================================

export const getLiveSessions = /* GraphQL */ `
  query GetLiveSessions($filter: LiveSessionFilterInput, $limit: Int, $nextToken: String) {
    getLiveSessions(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        username
        avatar
        gameId
        gameName
        gameImage
        startedAt
        duration
        isLive
      }
      nextToken
      totalCount
    }
  }
`;

// ============================================
// Search Queries
// ============================================

export const searchUsers = /* GraphQL */ `
  query SearchUsers($query: String!, $limit: Int) {
    searchUsers(query: $query, limit: $limit) {
      items {
        id
        username
        avatar
        level
        isOnline
      }
      totalCount
    }
  }
`;

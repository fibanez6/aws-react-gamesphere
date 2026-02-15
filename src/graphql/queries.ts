// GraphQL Queries
export const getCurrentUser = /* GraphQL */ `
  query GetCurrentUser($userId: ID!) {
    getUser(userId: $userId) {
      id
      username
      email
      avatar
      level
      rank
      xp
      xpToNextLevel
      isOnline
      isPublicProfile
      createdAt
      lastActiveAt
    }
  }
`;

export const getGame = /* GraphQL */ `
  query GetGame($gameId: ID!) {
    getGame(gameId: $gameId) {
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
  }
`;

export const getUserStats = /* GraphQL */ `
  query GetPlayerStats($userId: ID!) {
    getPlayerStats(userId: $userId) {
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
  }
`;

export const getRecentActivities = /* GraphQL */ `
  query GetRecentActivities($userId: ID!, $limit: Int, $nextToken: String) {
    getRecentActivities(userId: $userId, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      totalCount
    }
  }
`;

export const getPlayerDashboard = /* GraphQL */ `
  query GetPlayerProfile($userId: ID!) {
    getPlayerProfile(userId: $userId) {
      user {
        avatar
        createdAt
        email
        id
        level
        rank
        status
        updatedAt
        username
        xp
      }
      recentActivity {
        avatar
        createdAt
        description
        gameCover
        gameId
        gameName
        id
        title
        type
        userId
        username
      }
    }
  }
`;

export const getPlayerProfile = /* GraphQL */ `
  query GetPlayerProfile($userId: ID!) {
    getPlayerProfile(userId: $userId) {
      user {
        avatar
        createdAt
        email
        id
        level
        rank
        status
        updatedAt
        username
        xp
      }
      stats {
        achievementsUnlocked
        currentStreak
        gamesOwned
        longestStreak
        monthlyPlaytime
        totalAchievements
        totalHoursPlayed
        totalMatches
        totalWins
        userId
        weeklyPlaytime
        winRate
      }
      gameStats {
        gameCover
        gameId
        gameName
        hoursPlayed
        lastPlayed
        losses
        rank
        totalMatches
        wins
        winRate
      }
      achievements {
        gameId
        description
        gameName
        icon
        id
        name
        unlockedAt
        rarity
      }
      recentActivity {
        avatar
        createdAt
        description
        gameCover
        gameId
        gameName
        id
        title
        type
        userId
        username
      }
    }
  }
`;

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

export const listTopGames = /* GraphQL */ `
  query ListTopGames($filter: GameFilterInput, $limit: Int, $nextToken: String) {
    listTopGames(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
      totalCount
    }
  }
`;

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

export const getGameDetails = /* GraphQL */ `
  query GetGameDetails($gameId: ID!) {
    getGameDetails(gameId: $gameId) {
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
  }
`;

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

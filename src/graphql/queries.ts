// GraphQL Queries

export const getUserStats = /* GraphQL */ `
  query GetUserStats($userId: ID!) {
    getUserStats(userId: $userId) {
      userId
      totalHoursPlayed
      gamesOwned
      achievementsUnlocked
      totalAchievements
      winRate
      totalWins
      totalMatches
      favoriteGame
      weeklyPlaytime
      monthlyPlaytime
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
        description
        metadata {
          gameId
          gameName
          achievementId
          achievementName
          newLevel
          newRank
          duration
        }
        createdAt
      }
      nextToken
      totalCount
    }
  }
`;

export const getPlayerProfile = /* GraphQL */ `
  query GetPlayerProfile($playerId: ID!) {
    getPlayerProfile(playerId: $playerId) {
      user {
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
      stats {
        userId
        totalHoursPlayed
        gamesOwned
        achievementsUnlocked
        totalAchievements
        winRate
        totalWins
        totalMatches
        favoriteGame
        weeklyPlaytime
        monthlyPlaytime
      }
      gameStats {
        gameId
        gameName
        hoursPlayed
        winRate
        rank
        lastPlayed
        achievements
        totalAchievements
      }
      achievements {
        id
        name
        description
        icon
        rarity
        unlockedAt
        gameId
        gameName
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

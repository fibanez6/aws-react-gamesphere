// GraphQL Subscriptions

export const onFriendStatusChange = /* GraphQL */ `
  subscription OnFriendStatusChange($userId: ID!) {
    onFriendStatusChange(userId: $userId) {
      friendId
      isOnline
      status
      currentGame
    }
  }
`;

export const onFriendActivity = /* GraphQL */ `
  subscription OnFriendActivity($userId: ID!) {
    onFriendActivity(userId: $userId) {
      activity {
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
    }
  }
`;

export const onLiveSessionUpdate = /* GraphQL */ `
  subscription OnLiveSessionUpdate($filter: LiveSessionSubscriptionFilter) {
    onLiveSessionUpdate(filter: $filter) {
      type
      session {
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
    }
  }
`;

export const onLeaderboardUpdate = /* GraphQL */ `
  subscription OnLeaderboardUpdate($type: LeaderboardType!, $metric: LeaderboardMetric!, $gameId: ID) {
    onLeaderboardUpdate(type: $type, metric: $metric, gameId: $gameId) {
      entry {
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
    }
  }
`;

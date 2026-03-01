// GraphQL Mutations

export const updateProfile = /* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      username
      avatar
      isPublicProfile
    }
  }
`;

export const sendFriendRequest = /* GraphQL */ `
  mutation SendFriendRequest($toUserId: ID!) {
    sendFriendRequest(toUserId: $toUserId) {
      id
      fromUser {
        id
        username
        avatar
      }
      toUserId
      status
      createdAt
    }
  }
`;

export const respondToFriendRequest = /* GraphQL */ `
  mutation RespondToFriendRequest($requestId: ID!, $accept: Boolean!) {
    respondToFriendRequest(requestId: $requestId, accept: $accept) {
      id
      status
    }
  }
`;

export const removeFriend = /* GraphQL */ `
  mutation RemoveFriend($friendId: ID!) {
    removeFriend(friendId: $friendId) {
      success
      message
    }
  }
`;

export const startGameSession = /* GraphQL */ `
  mutation StartGameSession($gameId: ID!) {
    startGameSession(gameId: $gameId) {
      id
      userId
      gameId
      gameName
      startedAt
      isLive
    }
  }
`;

export const endGameSession = /* GraphQL */ `
  mutation EndGameSession($sessionId: ID!) {
    endGameSession(sessionId: $sessionId) {
      id
      duration
      isLive
    }
  }
`;

export const updateUserStatus = /* GraphQL */ `
  mutation UpdateUserStatus($status: UserStatus!) {
    updateUserStatus(status: $status) {
      id
      isOnline
      lastActiveAt
    }
  }
`;

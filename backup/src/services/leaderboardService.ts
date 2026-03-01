// Leaderboard Service
// Retrieves leaderboard data from mock or GraphQL based on environment

import envConfig, { debugLog } from '../config/environment';
import { graphqlLeaderboardService } from './graphql/graphqlLeaderboardService';
import { mockLeaderboardService } from './mocks/mockLeaderboardService';

// Select the appropriate service based on environment
const getLeaderboardService = () => {
  debugLog(`Leaderboard service provider: ${envConfig.useMockData ? 'mock' : 'graphql'}`);
  return envConfig.useMockData ? mockLeaderboardService : graphqlLeaderboardService;
};

export const leaderboardService = getLeaderboardService();

export default leaderboardService;

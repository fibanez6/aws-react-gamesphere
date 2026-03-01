// Game Service
// Retrieves game data from mock or GraphQL based on environment

import envConfig, { debugLog } from '../config/environment';
import { graphqlGameService } from './graphql/graphqlGameService';
import { mockGameService } from './mocks/mockGameService';

// Select the appropriate service based on environment
const getGameService = () => {
  debugLog(`Game service provider: ${envConfig.useMockData ? 'mock' : 'graphql'}`);
  return envConfig.useMockData ? mockGameService : graphqlGameService;
};

export const gameService = getGameService();

export default gameService;

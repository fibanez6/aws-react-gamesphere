// Session Service
// Retrieves live session data from mock or GraphQL based on environment

import envConfig, { debugLog } from '../config/environment';
import { graphqlSessionService } from './graphql/graphqlSessionService';
import { mockSessionService } from './mocks/mockSessionService';

// Select the appropriate service based on environment
const getSessionService = () => {
  debugLog(`Session service provider: ${envConfig.useMockData ? 'mock' : 'graphql'}`);
  return envConfig.useMockData ? mockSessionService : graphqlSessionService;
};

export const sessionService = getSessionService();

export default sessionService;

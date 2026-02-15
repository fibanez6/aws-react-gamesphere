// User Service
// Retrieves user data from mock or GraphQL based on environment

import envConfig, { debugLog } from '../config/environment';
import { graphqlUserService } from './graphql/graphqlUserService';
import { mockUserService } from './mocks/mockUserService';

// Re-export types for convenience
export type { PaginatedResponse, PlayerProfile } from './userService.types.ts';

// Select the appropriate service based on environment
const getUserService = () => {
  debugLog(`User service provider: ${envConfig.useMockData ? 'mock' : 'graphql'}`);
  return envConfig.useMockData ? mockUserService : graphqlUserService;
};

export const userService = getUserService();

export default userService;


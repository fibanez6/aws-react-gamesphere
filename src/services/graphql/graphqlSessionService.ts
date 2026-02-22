// GraphQL Session Service Implementation
// Used when VITE_USE_MOCK_DATA is false

import { generateClient } from 'aws-amplify/api';
import { debugError, debugLog } from '../../config/environment';
import { getLiveSessions } from '../../graphql/queries';
import { GameSession } from '../../types';
import type { PaginatedResponse } from '../userService.types.ts';

// Get GraphQL client
const getClient = () => generateClient();

export const graphqlSessionService = {
  async getLiveSessions(
    filter?: { friendsOnly?: boolean; gameId?: string },
    limit = 10,
    nextToken?: string
  ): Promise<PaginatedResponse<GameSession>> {
    debugLog('GraphQL: Getting live sessions', { filter, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getLiveSessions,
        variables: { filter, limit, nextToken },
      });
      const data = (result as any).data?.getLiveSessions;
      return {
        items: data?.items || [],
        nextToken: data?.nextToken,
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting live sessions', error);
      throw error;
    }
  },
};

export default graphqlSessionService;

// GraphQL Game Service Implementation
// Used when VITE_USE_MOCK_DATA is false

import { generateClient } from 'aws-amplify/api';
import { debugError, debugLog } from '../../config/environment';
import { getGameDetails, listTopGames } from '../../graphql/queries';
import { Game } from '../../types';
import type { PaginatedResponse } from '../userService.types.ts';

// Get GraphQL client
const getClient = () => generateClient();

export const graphqlGameService = {
  async getTopGames(
    filter?: { genre?: string; platform?: string },
    limit = 10,
    nextToken?: string
  ): Promise<PaginatedResponse<Game>> {
    debugLog('GraphQL: Getting top games', { filter, limit });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: listTopGames,
        variables: { filter, limit, nextToken },
      });
      const data = (result as any).data?.listTopGames;
      return {
        items: data?.items || [],
        nextToken: data?.nextToken,
        totalCount: data?.totalCount,
      };
    } catch (error) {
      debugError('GraphQL: Error getting top games', error);
      throw error;
    }
  },

  async getGameDetails(gameId: string): Promise<Game | null> {
    debugLog('GraphQL: Getting game details', { gameId });
    try {
      const client = getClient();
      const result = await client.graphql({
        query: getGameDetails,
        variables: { gameId },
      });
      return (result as any).data?.getGameDetails || null;
    } catch (error) {
      debugError('GraphQL: Error getting game details', error);
      throw error;
    }
  },
};

export default graphqlGameService;

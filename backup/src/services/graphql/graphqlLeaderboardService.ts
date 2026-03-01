// GraphQL Leaderboard Service Implementation
// Used when VITE_USE_MOCK_DATA is false

import { generateClient } from 'aws-amplify/api';
import { debugError, debugLog } from '../../config/environment';
import { getLeaderboard } from '../../graphql/queries';
import { LeaderboardEntry } from '../../types';

// Get GraphQL client
const getClient = () => generateClient();

export const graphqlLeaderboardService = {
  async getLeaderboard(
    type: 'global' | 'friends' | 'game',
    metric: string,
    options?: { gameId?: string }
  ): Promise<LeaderboardEntry[]> {
    debugLog('GraphQL: Getting leaderboard', { type, metric, options });
    try {
      const client = getClient();

      const filter: Record<string, string | undefined> = {
        type: type.toUpperCase(),
        metric: metric.toUpperCase(),
      };
      if (options?.gameId) {
        filter.gameId = options.gameId;
      }

      const result = await client.graphql({
        query: getLeaderboard,
        variables: { filter },
      });
      return (result as any).data?.getLeaderboard || [];
    } catch (error) {
      debugError('GraphQL: Error getting leaderboard', error);
      throw error;
    }
  },
};

export default graphqlLeaderboardService;

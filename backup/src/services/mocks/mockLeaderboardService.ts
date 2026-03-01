// Mock Leaderboard Service Implementation
// Used when VITE_USE_MOCK_DATA is true

import envConfig, { debugLog } from '../../config/environment';
import { mockLeaderboard } from '../../data/mockData';
import { LeaderboardEntry } from '../../types';

// Simulate network delay for mock mode
const mockDelay = () => new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));

export const mockLeaderboardService = {
  async getLeaderboard(
    _type: 'global' | 'friends' | 'game',
    _metric: string,
    _options?: { gameId?: string }
  ): Promise<LeaderboardEntry[]> {
    debugLog('Mock: Getting leaderboard', { _type, _metric, _options });
    await mockDelay();

    // Mock data is a single set — return it directly
    // (real service uses pk = TYPE#METRIC on DynamoDB)
    return mockLeaderboard;
  },
};

export default mockLeaderboardService;

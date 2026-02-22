// Mock Session Service Implementation
// Used when VITE_USE_MOCK_DATA is true

import envConfig, { debugLog } from '../../config/environment';
import { mockLiveSessions } from '../../data/mockData';
import { GameSession } from '../../types';
import type { PaginatedResponse } from '../userService.types.ts';

// Simulate network delay for mock mode
const mockDelay = () => new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));

export const mockSessionService = {
  async getLiveSessions(
    filter?: { friendsOnly?: boolean; gameId?: string },
    limit = 10,
    _nextToken?: string
  ): Promise<PaginatedResponse<GameSession>> {
    debugLog('Mock: Getting live sessions', { filter, limit });
    await mockDelay();

    let sessions = mockLiveSessions.filter(s => s.isLive);
    if (filter?.gameId) {
      sessions = sessions.filter(s => s.gameId === filter.gameId);
    }

    return {
      items: sessions.slice(0, limit),
      totalCount: sessions.length,
    };
  },
};

export default mockSessionService;

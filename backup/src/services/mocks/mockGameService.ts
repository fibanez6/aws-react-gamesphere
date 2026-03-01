// Mock Game Service Implementation
// Used when VITE_USE_MOCK_DATA is true

import envConfig, { debugLog } from '../../config/environment';
import { mockGames } from '../../data/mockData';
import { Game } from '../../types';
import type { PaginatedResponse } from '../userService.types.ts';

// Simulate network delay for mock mode
const mockDelay = () => new Promise(resolve => setTimeout(resolve, envConfig.apiTimeout));

export const mockGameService = {
  async getTopGames(
    filter?: { genre?: string; platform?: string },
    limit = 10,
    _nextToken?: string
  ): Promise<PaginatedResponse<Game>> {
    debugLog('Mock: Getting top games', { filter, limit });
    await mockDelay();

    let games = [...mockGames];
    if (filter?.genre) {
      games = games.filter(g => g.genre.toLowerCase() === filter.genre?.toLowerCase());
    }
    if (filter?.platform) {
      games = games.filter(g => g.platform.includes(filter.platform!));
    }

    return {
      items: games.slice(0, limit),
      totalCount: games.length,
    };
  },

  async getGameDetails(gameId: string): Promise<Game | null> {
    debugLog('Mock: Getting game details', { gameId });
    await mockDelay();
    return mockGames.find(g => g.id === gameId) || null;
  },
};

export default mockGameService;

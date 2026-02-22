import { useCallback, useEffect, useState } from 'react';
import gameService from '../services/gameService';
import { Game, GameFilter } from '../types';
import { debugLog } from '@/config/environment';

interface UseTopGamesResult {
  games: Game[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useTopGames(filter?: GameFilter): UseTopGamesResult {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);

  const fetchGames = useCallback(async (reset = true) => {
    setIsLoading(true);
    setError(null);
    try {
      debugLog('UseTopGames: Fetching top games with filter:', filter);
      const result = await gameService.getTopGames(
        { genre: filter?.genre, platform: filter?.platform },
        10,
        reset ? undefined : nextToken ?? undefined
      );

      setGames(prev => reset ? result.items : [...prev, ...result.items]);
      setNextToken(result.nextToken ?? null);
    } catch (err) {
      debugLog('UseTopGames: Error fetching games:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch games'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchGames(true);
  }, [fetchGames]);

  const loadMore = useCallback(() => {
    if (nextToken) {
      fetchGames(false);
    }
  }, [nextToken, fetchGames]);

  return {
    games,
    isLoading,
    error,
    hasMore: !!nextToken,
    loadMore,
    refetch: () => fetchGames(true),
  };
}

interface UseGameDetailsResult {
  game: Game | null;
  isLoading: boolean;
  error: Error | null;
}

export function useGameDetails(gameId: string): UseGameDetailsResult {
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      setIsLoading(true);
      setError(null);
      try {
        debugLog('UseGameDetails: Fetching game details for:', gameId);
        const result = await gameService.getGameDetails(gameId);
        setGame(result);
      } catch (err) {
        debugLog('UseGameDetails: Error fetching game details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch game details'));
      } finally {
        setIsLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  return { game, isLoading, error };
}

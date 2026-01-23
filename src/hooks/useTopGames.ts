import { useCallback, useEffect, useState } from 'react';
import { mockGames } from '../data/mockData';
import { Game, GameFilter } from '../types';

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
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({
      //   query: listTopGames,
      //   variables: { filter, limit: 10, nextToken: reset ? null : nextToken }
      // });
      // const data = result.data.listTopGames;
      // setGames(prev => reset ? data.items : [...prev, ...data.items]);
      // setNextToken(data.nextToken);

      // For development, use mock data with filtering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredGames = [...mockGames];
      
      if (filter?.genre) {
        filteredGames = filteredGames.filter(g => g.genre === filter.genre);
      }
      
      if (filter?.platform) {
        filteredGames = filteredGames.filter(g => g.platform.includes(filter.platform!));
      }
      
      if (filter?.sortBy === 'activePlayers') {
        filteredGames.sort((a, b) => b.activePlayers - a.activePlayers);
      } else if (filter?.sortBy === 'avgPlaytime') {
        filteredGames.sort((a, b) => b.avgPlaytime - a.avgPlaytime);
      } else if (filter?.sortBy === 'rating') {
        filteredGames.sort((a, b) => b.rating - a.rating);
      }
      
      setGames(filteredGames);
      setNextToken(null);
    } catch (err) {
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
        // In production:
        // const client = generateClient();
        // const result = await client.graphql({
        //   query: getGameDetails,
        //   variables: { gameId }
        // });
        // setGame(result.data.getGameDetails);

        // For development, use mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        const foundGame = mockGames.find(g => g.id === gameId);
        setGame(foundGame || null);
      } catch (err) {
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

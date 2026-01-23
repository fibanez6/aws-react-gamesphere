import { useCallback, useEffect, useState } from 'react';
import { mockLeaderboard } from '../data/mockData';
import { LeaderboardEntry, LeaderboardFilter } from '../types';

interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  userRank: LeaderboardEntry | null;
  refetch: () => void;
}

export function useLeaderboard(filter: LeaderboardFilter): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({
      //   query: getLeaderboard,
      //   variables: { type: filter.type, metric: filter.metric, gameId: filter.gameId, timeRange: filter.timeRange }
      // });
      // setEntries(result.data.getLeaderboard.items);

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredLeaderboard = [...mockLeaderboard];
      
      // Simulate different metrics
      if (filter.metric === 'wins') {
        filteredLeaderboard = filteredLeaderboard.map(entry => ({
          ...entry,
          score: Math.floor(entry.score * 1.2),
          metric: 'wins',
        }));
      } else if (filter.metric === 'achievements') {
        filteredLeaderboard = filteredLeaderboard.map(entry => ({
          ...entry,
          score: Math.floor(entry.score * 0.3),
          metric: 'achievements',
        }));
      } else if (filter.metric === 'winrate') {
        filteredLeaderboard = filteredLeaderboard.map(entry => ({
          ...entry,
          score: Math.floor(45 + Math.random() * 30),
          metric: 'winrate',
        })).sort((a, b) => b.score - a.score);
      }
      
      // Simulate friends-only filter
      if (filter.type === 'friends') {
        filteredLeaderboard = filteredLeaderboard.filter(
          entry => entry.userId.startsWith('friend_') || entry.userId === 'user_001'
        );
        // Re-rank after filtering
        filteredLeaderboard = filteredLeaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
      }
      
      setEntries(filteredLeaderboard);
      
      // Find current user's rank
      const currentUserEntry = filteredLeaderboard.find(e => e.userId === 'user_001');
      setUserRank(currentUserEntry || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    isLoading,
    error,
    userRank,
    refetch: fetchLeaderboard,
  };
}

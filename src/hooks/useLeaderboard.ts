import { useCallback, useEffect, useState } from 'react';
import leaderboardService from '../services/leaderboardService';
import { LeaderboardEntry, LeaderboardFilter } from '../types';
import { debugLog } from '@/config/environment';

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
      debugLog('UseLeaderboard: Fetching leaderboard with filter:', filter);
      // Map filter metric to AppSync metric enum values
      const metricMap: Record<string, string> = {
        hours: 'HOURS',
        wins: 'WINS',
        achievements: 'ACHIEVEMENTS',
        winrate: 'XP',
      };
      const serviceMetric = metricMap[filter.metric] || 'HOURS';

      // When filtering by game, pass type as 'global' so the resolver builds
      // pk = GLOBAL#{gameId} (matching the seed data pattern).
      const serviceType = filter.type === 'game' ? 'global' : filter.type;

      const items = await leaderboardService.getLeaderboard(
        serviceType,
        serviceMetric,
        {
          gameId: filter.gameId,
        }
      );

      setEntries(items);

      // Find current user's rank
      const currentUserEntry = items.find(e => e.userId === 'user_001');
      setUserRank(currentUserEntry || null);
    } catch (err) {
      debugLog('UseLeaderboard: Error fetching leaderboard:', err);
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

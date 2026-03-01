import { useCallback, useEffect, useState } from 'react';
import userService from '../services/userService';
import { Activity, PlayerStats } from '../types';
import { debugLog } from '@/config/environment';

interface UseUserStatsResult {
  stats: PlayerStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserStats(userId: string): UseUserStatsResult {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      debugLog('UseUserStats: Fetching user stats for userId:', userId);
      const result = await userService.getUserStats(userId);
      setStats(result);
    } catch (err) {
      debugLog('UseUserStats: Error fetching user stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

interface UseRecentActivitiesResult {
  activities: Activity[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useRecentActivities(userId: string, limit = 10): UseRecentActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);

  const fetchActivities = useCallback(async (reset = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userService.getRecentActivities(
        userId,
        limit,
        reset ? undefined : nextToken
      );
      setActivities(prev => reset ? result.items : [...prev, ...result.items]);
      setNextToken(result.nextToken);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, nextToken]);

  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]);

  const loadMore = useCallback(() => {
    if (nextToken) {
      fetchActivities(false);
    }
  }, [nextToken, fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    hasMore: !!nextToken,
    loadMore,
    refetch: () => fetchActivities(true),
  };
}

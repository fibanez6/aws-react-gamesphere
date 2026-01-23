import { useCallback, useEffect, useState } from 'react';
import { mockActivities, mockPlayerStats } from '../data/mockData';
import { Activity, PlayerStats } from '../types';

// In production, these would use the GraphQL client
// import { generateClient } from 'aws-amplify/api';
// import { getUserStats, getRecentActivities } from '../graphql/queries';

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
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({ query: getUserStats, variables: { userId } });
      // setStats(result.data.getUserStats);

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats(mockPlayerStats);
    } catch (err) {
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
  const [nextToken, setNextToken] = useState<string | null>(null);

  const fetchActivities = useCallback(async (reset = true) => {
    setIsLoading(true);
    setError(null);
    try {
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({
      //   query: getRecentActivities,
      //   variables: { userId, limit, nextToken: reset ? null : nextToken }
      // });
      // const data = result.data.getRecentActivities;
      // setActivities(prev => reset ? data.items : [...prev, ...data.items]);
      // setNextToken(data.nextToken);

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      if (reset) {
        setActivities(mockActivities.slice(0, limit));
      } else {
        setActivities(prev => [...prev, ...mockActivities.slice(prev.length, prev.length + limit)]);
      }
      setNextToken(activities.length < mockActivities.length ? 'token' : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, nextToken, activities.length]);

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

import { useCallback, useEffect, useState } from 'react';
import { mockLiveSessions } from '../data/mockData';
import { GameSession, LiveSessionEvent } from '../types';

interface UseLiveSessionsResult {
  sessions: GameSession[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLiveSessions(friendsOnly = false): UseLiveSessionsResult {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({
      //   query: getLiveSessions,
      //   variables: { filter: { friendsOnly } }
      // });
      // setSessions(result.data.getLiveSessions.items);

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setSessions(mockLiveSessions);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch live sessions'));
    } finally {
      setIsLoading(false);
    }
  }, [friendsOnly]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    refetch: fetchSessions,
  };
}

export function useLiveSessionSubscription(
  onSessionUpdate: (event: LiveSessionEvent) => void
) {
  useEffect(() => {
    // In production:
    // const client = generateClient();
    // const subscription = client.graphql({
    //   query: onLiveSessionUpdate,
    //   variables: { filter: {} }
    // }).subscribe({
    //   next: ({ data }) => onSessionUpdate(data.onLiveSessionUpdate),
    //   error: (err) => console.error('Subscription error:', err)
    // });
    // return () => subscription.unsubscribe();

    // For development, simulate random session updates
    const interval = setInterval(() => {
      const randomSession = mockLiveSessions[Math.floor(Math.random() * mockLiveSessions.length)];
      const event: LiveSessionEvent = {
        type: 'updated',
        session: {
          ...randomSession,
          duration: randomSession.duration + 1,
        },
      };
      onSessionUpdate(event);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [onSessionUpdate]);
}

// Hook to calculate live session duration
export function useSessionTimer(startedAt: string): number {
  const [duration, setDuration] = useState(() => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000 / 60);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      setDuration(Math.floor((now - start) / 1000 / 60));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startedAt]);

  return duration;
}

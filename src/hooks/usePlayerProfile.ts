import { useCallback, useEffect, useState } from 'react';
import { mockAchievements, mockCurrentUser, mockGameStats, mockPlayerStats } from '../data/mockData';
import { Achievement, GameStats, PlayerStats, User } from '../types';

interface PlayerProfile {
  user: User;
  stats: PlayerStats;
  gameStats: GameStats[];
  achievements: Achievement[];
}

interface UsePlayerProfileResult {
  profile: PlayerProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export function usePlayerProfile(playerId?: string): UsePlayerProfileResult {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({
      //   query: getPlayerProfile,
      //   variables: { playerId: playerId || currentUserId }
      // });
      // setProfile(result.data.getPlayerProfile);

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 600));
      setProfile({
        user: mockCurrentUser,
        stats: mockPlayerStats,
        gameStats: mockGameStats,
        achievements: mockAchievements,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      // In production:
      // const client = generateClient();
      // await client.graphql({
      //   query: updateProfileMutation,
      //   variables: { input: data }
      // });

      // For development
      await new Promise(resolve => setTimeout(resolve, 300));
      setProfile(prev => prev ? { ...prev, user: { ...prev.user, ...data } } : null);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update profile');
    }
  }, []);

  return { profile, isLoading, error, refetch: fetchProfile, updateProfile };
}

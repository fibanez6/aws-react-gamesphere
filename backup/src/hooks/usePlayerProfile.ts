import { debugLog } from '@/config/environment';
import { useCallback, useEffect, useState } from 'react';
import userService, { PlayerProfile } from '../services/userService';
import { User } from '../types';

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
    if (!playerId) {
      debugLog('UsePlayerProfile: No playerId provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      debugLog('UsePlayerProfile: Fetching player profile for playerId:', playerId);
      const data = await userService.getPlayerProfile(playerId);
      debugLog('UsePlayerProfile: Fetched player profile:', data);
      setProfile(data);
    } catch (err) {
      debugLog('UsePlayerProfile: Error fetching player profile:', err);
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
      // TODO: Add updateProfile to userService when backend supports it
      await new Promise(resolve => setTimeout(resolve, 300));
      setProfile(prev => prev ? { ...prev, user: { ...prev.user, ...data } } : null);
    } catch (err) {
      debugLog('UsePlayerProfile: Error updating player profile:', err);
      throw err instanceof Error ? err : new Error('Failed to update profile');
    }
  }, []);

  return { profile, isLoading, error, refetch: fetchProfile, updateProfile };
}

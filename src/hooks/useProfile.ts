import { debugLog } from '@/config/environment';
import type { SelectionSet } from 'aws-amplify/data';
import { useCallback, useEffect, useState } from 'react';
import { dataClient } from '../config/amplifyClient';
import { useUser } from '../context/UserContext';
import type { User } from '../types';


const PROFILE_SELECTION_SET = [
  'id',
  'email',
  'username',
  'avatar',
  'rank',
  'xp',
  'level',
  'status',
  'stats.*',
  'gameStats.*',
  'achievements.*',
] as const;

type PlayerProfile = SelectionSet<User, typeof PROFILE_SELECTION_SET>;
type PlayerStats = Omit<PlayerProfile['stats'], 'user'> & { hoursThisWeek: number };
type GameStats = Omit<PlayerProfile['gameStats'][number], 'user'>;
type Achievement = Omit<PlayerProfile['achievements'][number], 'user'>;

interface UseProfileReturn {
  userProfile: PlayerProfile | null;
  playerStats: PlayerStats | null;
  gameStats: GameStats[] | null;
  achievements: Achievement[] | null;
  loading: boolean;
  error: string | null;
  updateProfile: (fields: Partial<Pick<PlayerProfile, 'username' | 'avatar' | 'status'>>) => Promise<void>;
  refresh: () => Promise<void>;
}

export default function useProfile(): UseProfileReturn {
  const { userProfile, updateProfile } = useUser();
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [gameStats, setGameStats] = useState<GameStats[] | null>(null);
  const [achievements, setAchievements] = useState<Achievement[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
      if (!userProfile?.id) {
          setLoading(false);
          return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: currentUser, errors } = await dataClient.models.User.get(
            { id: userProfile.id },
            { selectionSet: PROFILE_SELECTION_SET }
        );

        if (errors?.length) {
          throw new Error(errors.map((e) => e.message).join(', '));
        }

        if (!currentUser) {
          setPlayerStats(null);
          setGameStats([]);
          return;
        }

        // Process stats from the nested relation
        const playerStats = currentUser.stats;
        if (playerStats) {
          const weeklyPlaytime = (playerStats.weeklyPlaytime ?? []) as number[];
          const hoursThisWeek = weeklyPlaytime.reduce((sum, h) => sum + h, 0);

          setPlayerStats({ ...playerStats, hoursThisWeek });
        } else {
          setPlayerStats(null);
        }

        // Process game stats from the nested relation
        const gameStats = currentUser.gameStats;
        if (gameStats) {
          setGameStats(gameStats);
        } else {
          setGameStats([]);
        }

        // Process achievements from the nested relation
        const achievements = currentUser.achievements;
        if (achievements) {
          setAchievements(achievements);
        } else {
          setAchievements([]);
        }

        debugLog('Profile data fetched:', { profile: userProfile, playerStats, gameStats, achievements });
        
      } catch (err) {
          console.error('Failed to fetch profile data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
          setLoading(false)
      }
    }, [userProfile?.id]);

  useEffect(() => {
      fetchProfileData();
  }, [fetchProfileData]);

  const normalizedUserProfile = userProfile ? { ...userProfile, avatar: userProfile.avatar ?? null } : null;

  return { 
    userProfile: normalizedUserProfile as PlayerProfile | null, 
    playerStats, 
    gameStats, 
    achievements, 
    loading, 
    error, 
    updateProfile, 
    refresh: fetchProfileData 
  };
}   
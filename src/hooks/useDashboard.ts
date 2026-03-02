import type { SelectionSet } from 'aws-amplify/data';
import { useCallback, useEffect, useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { dataClient } from '../config/amplifyClient';
import { debugLog } from '../config/environment';
import { useUser } from '../context/UserContext';
import type { User } from '../types';

type UserProfile = Schema['User']['type'];

// Single selection set that eagerly loads stats (hasOne) and activities (hasMany)
const DASHBOARD_SELECTION_SET = [
  'id',
  'email',
  'username',
  'avatar',
  'rank',
  'xp',
  'level',
  'status',
  'stats.*',
  'activities.*',
] as const;

type PlayerProfile = SelectionSet<User, typeof DASHBOARD_SELECTION_SET>;
export type PlayerActivities = PlayerProfile['activities'][number];
type PlayerStats = Omit<PlayerProfile['stats'], 'user'> & { hoursThisWeek: number };
type PlayerTopGame = Pick<Schema['Game']['type'], 'id' | 'name' | 'coverImage' | 'genre' | 'platforms' | 'activePlayers' | 'rating'>;

interface UseDashboardReturn {
  userProfile: UserProfile | null;
  stats: PlayerStats | null;
  activities: PlayerActivities[];
  topGame: PlayerTopGame | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export default function useDashboard(): UseDashboardReturn {
  const { userProfile } = useUser();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [activities, setActivities] = useState<PlayerActivities[]>([]);
  const [topGame, setTopGame] = useState<PlayerTopGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Single GraphQL query: fetch the User with related stats + activities via selectionSet
      const { data: currentUser, errors } = await dataClient.models.User.get(
        { id: userProfile.id },
        { selectionSet: DASHBOARD_SELECTION_SET },
      );

      if (errors?.length) {
        throw new Error(errors.map((e) => e.message).join(', '));
      }

      if (!currentUser) {
        setStats(null);
        setActivities([]);
        setTopGame(null);
        return;
      }

      // Process stats from the nested relation
      const playerStats = currentUser.stats;

      if (playerStats) {
        const weeklyPlaytime = (playerStats.weeklyPlaytime ?? []) as number[];
        const hoursThisWeek = weeklyPlaytime.reduce((sum, h) => sum + h, 0);

        setStats({ ...playerStats, hoursThisWeek });
      } else {
        setStats(null);
      }

      // Process activities from the nested relation
      const sortedActivities = [...(currentUser.activities ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setActivities(sortedActivities);

      // Derive top game from the most frequent GAME_PLAYED activity
      const gamePlayed = sortedActivities.filter((a) => a.type === 'GAME_PLAYED' && a.gameId);
      const gameCountMap = new Map<string, number>();
      for (const a of gamePlayed) {
        gameCountMap.set(a.gameId!, (gameCountMap.get(a.gameId!) ?? 0) + 1);
      }

      if (gameCountMap.size > 0) {
        const topGameId = [...gameCountMap.entries()].sort((a, b) => b[1] - a[1])[0][0];
        const { data: game } = await dataClient.models.Game.get({ id: topGameId });
        if (game) {
          setTopGame({
            id: game.id,
            name: game.name,
            coverImage: game.coverImage,
            genre: game.genre,
            platforms: game.platforms,
            activePlayers: game.activePlayers,
            rating: game.rating,
          });
        } else {
          setTopGame(null);
        }
      } else {
        setTopGame(null);
      }

      debugLog('Dashboard data fetched:', { profile: userProfile, stats: playerStats, activities: sortedActivities.length });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    userProfile,
    stats,
    activities,
    topGame,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}

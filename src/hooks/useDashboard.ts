import { useQuery } from '@tanstack/react-query';
import type { SelectionSet } from 'aws-amplify/data';
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

interface DashboardData {
  stats: PlayerStats | null;
  activities: PlayerActivities[];
  topGame: PlayerTopGame | null;
}

interface UseDashboardReturn {
  userProfile: UserProfile | null;
  stats: PlayerStats | null;
  activities: PlayerActivities[];
  topGame: PlayerTopGame | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const { data: currentUser, errors } = await dataClient.models.User.get(
    { id: userId },
    { selectionSet: DASHBOARD_SELECTION_SET },
  );

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }

  if (!currentUser) {
    return { stats: null, activities: [], topGame: null };
  }

  // Process stats
  let stats: PlayerStats | null = null;
  const playerStats = currentUser.stats;
  if (playerStats) {
    const weeklyPlaytime = (playerStats.weeklyPlaytime ?? []) as number[];
    const hoursThisWeek = weeklyPlaytime.reduce((sum, h) => sum + h, 0);
    stats = { ...playerStats, hoursThisWeek };
  }

  // Process activities
  const sortedActivities = [...(currentUser.activities ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Derive top game from the most frequent GAME_PLAYED activity
  let topGame: PlayerTopGame | null = null;
  const gamePlayed = sortedActivities.filter((a) => a.type === 'GAME_PLAYED' && a.gameId);
  const gameCountMap = new Map<string, number>();
  for (const a of gamePlayed) {
    gameCountMap.set(a.gameId!, (gameCountMap.get(a.gameId!) ?? 0) + 1);
  }
  if (gameCountMap.size > 0) {
    const topGameId = [...gameCountMap.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const { data: game } = await dataClient.models.Game.get({ id: topGameId });
    if (game) {
      topGame = {
        id: game.id,
        name: game.name,
        coverImage: game.coverImage,
        genre: game.genre,
        platforms: game.platforms,
        activePlayers: game.activePlayers,
        rating: game.rating,
      };
    }
  }

  debugLog('Dashboard data fetched:', { stats, activities: sortedActivities.length });
  return { stats, activities: sortedActivities, topGame };
}

export default function useDashboard(): UseDashboardReturn {
  const { userProfile } = useUser();
  const userId = userProfile?.id;

  const { data, isFetching, error, refetch } = useQuery<DashboardData, Error>({
    queryKey: ['dashboard', userId],
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
  });

  return {
    userProfile: userProfile ?? null,
    stats: data?.stats ?? null,
    activities: data?.activities ?? [],
    topGame: data?.topGame ?? null,
    loading: isFetching,
    error: error?.message ?? null,
    refresh: async () => { await refetch(); },
  };
}

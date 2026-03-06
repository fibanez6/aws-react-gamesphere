import { debugLog } from '@/config/environment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SelectionSet } from 'aws-amplify/data';
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

interface ProfileData {
  userProfile: PlayerProfile;
  playerStats: PlayerStats | null;
  gameStats: GameStats[];
  achievements: Achievement[];
}

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

async function fetchProfileData(userId: string): Promise<ProfileData> {
  const { data: currentUser, errors } = await dataClient.models.User.get(
    { id: userId },
    { selectionSet: PROFILE_SELECTION_SET }
  );

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }

  if (!currentUser) {
    throw new Error('User not found');
  }

  let playerStats: PlayerStats | null = null;
  if (currentUser.stats) {
    const weeklyPlaytime = (currentUser.stats.weeklyPlaytime ?? []) as number[];
    const hoursThisWeek = weeklyPlaytime.reduce((sum, h) => sum + h, 0);
    playerStats = { ...currentUser.stats, hoursThisWeek };
  }

  const gameStats = (currentUser.gameStats ?? []) as GameStats[];
  const achievements = (currentUser.achievements ?? []) as Achievement[];

  debugLog('Profile data fetched:', { userId, playerStats, gameStats, achievements });

  return {
    userProfile: currentUser as PlayerProfile,
    playerStats,
    gameStats,
    achievements,
  };
}

export default function useProfile(targetUserId?: string): UseProfileReturn {
  const { userProfile: authUserProfile, updateProfile: contextUpdateProfile } = useUser();
  const resolvedUserId = targetUserId || authUserProfile?.id;
  const isOwnProfile = !targetUserId || targetUserId === authUserProfile?.id;
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery<ProfileData, Error>({
    queryKey: ['profile', resolvedUserId],
    queryFn: () => fetchProfileData(resolvedUserId!),
    enabled: !!resolvedUserId,
  });

  const mutation = useMutation({
    mutationFn: (fields: Partial<Pick<PlayerProfile, 'username' | 'avatar' | 'status'>>) =>
      contextUpdateProfile(fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', resolvedUserId] });
    },
  });

  const normalizedUserProfile = data?.userProfile
    ? { ...data.userProfile, avatar: data.userProfile.avatar ?? null }
    : null;

  return {
    userProfile: normalizedUserProfile as PlayerProfile | null,
    playerStats: data?.playerStats ?? null,
    gameStats: data?.gameStats ?? null,
    achievements: data?.achievements ?? null,
    loading: isFetching,
    error: error?.message ?? null,
    updateProfile: isOwnProfile
      ? (fields) => mutation.mutateAsync(fields)
      : async () => { throw new Error('Cannot edit another player\'s profile'); },
    refresh: async () => { await refetch(); },
  };
}
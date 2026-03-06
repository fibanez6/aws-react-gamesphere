import { useQuery } from '@tanstack/react-query';
import { dataClient } from '../config/amplifyClient';
import { debugLog } from '../config/environment';
import { useUser } from '../context/UserContext';

export interface TopGameView {
  gameStatsId: string;
  gameId: string;
  gameName: string;
  gameCover: string | null;
  hoursPlayed: number;
  lastPlayed: string;
  rank: string | null;
  winRate: number;
  totalMatches: number;
  wins: number;
  losses: number;
}

interface TopGamesData {
  games: TopGameView[];
  isOwner: boolean;
  isFriend: boolean;
  targetUsername: string | null;
}

/**
 * Check whether the logged-in user is an accepted friend of `targetUserId`.
 */
async function checkFriendship(loggedInUserId: string, targetUserId: string): Promise<boolean> {
  // Requester side
  const { data: asRequester } = await dataClient.models.Friendship.list({
    filter: {
      requesterId: { eq: loggedInUserId },
      addresseeId: { eq: targetUserId },
      status: { eq: 'ACCEPTED' },
    },
  });
  if (asRequester?.length) return true;

  // Addressee side
  const { data: asAddressee } = await dataClient.models.Friendship.list({
    filter: {
      requesterId: { eq: targetUserId },
      addresseeId: { eq: loggedInUserId },
      status: { eq: 'ACCEPTED' },
    },
  });
  return (asAddressee?.length ?? 0) > 0;
}

async function fetchTopGames(
  targetUserId: string,
  loggedInUserId: string,
): Promise<TopGamesData> {
  const isOwner = targetUserId === loggedInUserId;

  // Resolve target user info
  const { data: targetUser } = await dataClient.models.User.get({ id: targetUserId });
  const targetUsername = targetUser?.username ?? null;

  // If not the owner, verify friendship
  let isFriend = false;
  if (!isOwner) {
    isFriend = await checkFriendship(loggedInUserId, targetUserId);
    if (!isFriend) {
      debugLog('Top games access denied — not a friend', { loggedInUserId, targetUserId });
      return { games: [], isOwner: false, isFriend: false, targetUsername };
    }
  }

  // Fetch all GameStats for the target user
  const { data: stats, errors } = await dataClient.models.GameStats.list({
    filter: { userId: { eq: targetUserId } },
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

  const games: TopGameView[] = (stats ?? [])
    .sort((a, b) => b.hoursPlayed - a.hoursPlayed)
    .map((s) => ({
      gameStatsId: s.id,
      gameId: s.gameId,
      gameName: s.gameName,
      gameCover: s.gameCover ?? null,
      hoursPlayed: s.hoursPlayed,
      lastPlayed: s.lastPlayed,
      rank: s.rank ?? null,
      winRate: s.winRate,
      totalMatches: s.totalMatches,
      wins: s.wins,
      losses: s.losses,
    }));

  debugLog('Top games fetched:', { targetUserId, count: games.length });

  return { games, isOwner, isFriend: isOwner || isFriend, targetUsername };
}

export default function useTopGames(targetUserId?: string) {
  const { userProfile } = useUser();
  const loggedInUserId = userProfile?.id;
  const resolvedUserId = targetUserId || loggedInUserId;

  const { data, isFetching, error, refetch } = useQuery<TopGamesData, Error>({
    queryKey: ['topGames', resolvedUserId],
    queryFn: () => fetchTopGames(resolvedUserId!, loggedInUserId!),
    enabled: !!resolvedUserId && !!loggedInUserId,
  });

  return {
    games: data?.games ?? [],
    isOwner: data?.isOwner ?? true,
    isFriend: data?.isFriend ?? false,
    targetUsername: data?.targetUsername ?? null,
    loading: isFetching,
    error: error?.message ?? null,
    refresh: async () => { await refetch(); },
  };
}

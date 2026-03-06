import { useQuery } from '@tanstack/react-query';
import { dataClient } from '../config/amplifyClient';
import { debugLog } from '../config/environment';
import { useUser } from '../context/UserContext';

// ── Types ──────────────────────────────────────────────────────────────────

export type LeaderboardTab = 'global' | 'friends' | 'game';
export type LeaderboardMetric = 'hoursPlayed' | 'wins' | 'achievementsUnlocked' | 'winRate';
export type LeaderboardPeriod = 'DAILY' | 'MONTHLY' | 'ALL_TIME';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  userRank: string | null;
  hoursPlayed: number;
  wins: number;
  achievementsUnlocked: number;
  winRate: number;
  totalMatches: number;
}

export interface LeaderboardResult {
  rows: LeaderboardRow[];
  totalCount: number;
}

export interface GameOption {
  id: string;
  name: string;
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

/**
 * Returns the set of friend user IDs (ACCEPTED) for the logged-in user.
 */
async function fetchFriendIds(userId: string): Promise<Set<string>> {
  const [{ data: asRequester }, { data: asAddressee }] = await Promise.all([
    dataClient.models.Friendship.list({ filter: { requesterId: { eq: userId }, status: { eq: 'ACCEPTED' } } }),
    dataClient.models.Friendship.list({ filter: { addresseeId: { eq: userId }, status: { eq: 'ACCEPTED' } } }),
  ]);

  const ids = new Set<string>();
  ids.add(userId); // include self
  for (const f of asRequester ?? []) ids.add(f.addresseeId);
  for (const f of asAddressee ?? []) ids.add(f.requesterId);
  return ids;
}

/**
 * Fetch leaderboard entries for a given period + optional gameId, join with User data,
 * sort by the chosen metric, and return the full ranked list.
 */
async function fetchLeaderboard(
  period: LeaderboardPeriod,
  gameId: string | undefined,
): Promise<{ entries: LeaderboardRow[] }> {
  // Build filter
  const filter: Record<string, unknown> = { period: { eq: period } };
  if (gameId) {
    filter.gameId = { eq: gameId };
  } else {
    // Global entries have no gameId — Amplify stores null/missing fields
    // We stored them without gameId so they'll have attributeExists: false
  }

  const { data: lbEntries, errors } = await dataClient.models.LeaderboardEntry.list({ filter });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

  // When fetching global (no gameId), filter out per-game entries client-side
  const filtered = gameId
    ? (lbEntries ?? [])
    : (lbEntries ?? []).filter((e) => !e.gameId);

  // De-dup by userId (keep highest hours entry if duplicates)
  const byUser = new Map<string, typeof filtered[number]>();
  for (const entry of filtered) {
    const existing = byUser.get(entry.userId);
    if (!existing || entry.hoursPlayed > existing.hoursPlayed) {
      byUser.set(entry.userId, entry);
    }
  }

  // Fetch user details in parallel
  const userIds = [...byUser.keys()];
  const userResults = await Promise.all(
    userIds.map((id) => dataClient.models.User.get({ id })),
  );

  const userMap = new Map<string, { username: string; avatar: string; level: number; rank: string | null }>();
  for (let i = 0; i < userIds.length; i++) {
    const u = userResults[i].data;
    userMap.set(userIds[i], {
      username: u?.username ?? 'Unknown',
      avatar: u?.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${userIds[i]}`,
      level: u?.level ?? 0,
      rank: u?.rank ?? null,
    });
  }

  // Build rows (unranked — caller will sort & rank)
  const rows: LeaderboardRow[] = [...byUser.entries()].map(([userId, entry]) => {
    const user = userMap.get(userId)!;
    return {
      rank: 0,
      userId,
      username: user.username,
      avatar: user.avatar,
      level: user.level,
      userRank: user.rank,
      hoursPlayed: entry.hoursPlayed,
      wins: entry.wins,
      achievementsUnlocked: entry.achievementsUnlocked,
      winRate: entry.winRate,
      totalMatches: entry.totalMatches,
    };
  });

  debugLog('Leaderboard fetched:', { period, gameId, count: rows.length });

  return { entries: rows };
}

async function fetchGameOptions(): Promise<GameOption[]> {
  const { data: games } = await dataClient.models.Game.list();
  return (games ?? []).map((g) => ({ id: g.id, name: g.name })).sort((a, b) => a.name.localeCompare(b.name));
}

// ── Hook ───────────────────────────────────────────────────────────────────

interface UseLeaderboardOptions {
  tab: LeaderboardTab;
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  gameId?: string;
  page: number;
  pageSize: number;
}

export default function useLeaderboard({ tab, period, metric, gameId, page, pageSize }: UseLeaderboardOptions) {
  const { userProfile } = useUser();
  const loggedInUserId = userProfile?.id;

  // Fetch the full leaderboard
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['leaderboard', period, tab === 'game' ? gameId : 'global'],
    queryFn: () => fetchLeaderboard(period, tab === 'game' ? gameId : undefined),
    enabled: tab !== 'game' || !!gameId,
  });

  // Fetch friend IDs (only needed for friends tab)
  const { data: friendIds } = useQuery({
    queryKey: ['friendIds', loggedInUserId],
    queryFn: () => fetchFriendIds(loggedInUserId!),
    enabled: !!loggedInUserId && tab === 'friends',
  });

  // Fetch game list for dropdown
  const { data: gameOptions } = useQuery({
    queryKey: ['gameOptions'],
    queryFn: fetchGameOptions,
  });

  // Process rows: filter by tab, sort by metric, paginate
  let rows = data?.entries ?? [];

  // Friends filter
  if (tab === 'friends' && friendIds) {
    rows = rows.filter((r) => friendIds.has(r.userId));
  }

  // Sort by metric descending
  rows = [...rows].sort((a, b) => {
    const av = a[metric];
    const bv = b[metric];
    return (bv as number) - (av as number);
  });

  // Assign ranks
  rows = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  const totalCount = rows.length;

  // Paginate
  const startIdx = (page - 1) * pageSize;
  const paginatedRows = rows.slice(startIdx, startIdx + pageSize);

  // Find logged-in user's rank
  const myRank = rows.find((r) => r.userId === loggedInUserId)?.rank ?? null;

  return {
    rows: paginatedRows,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    myRank,
    loading: isFetching,
    error: error?.message ?? null,
    refresh: async () => { await refetch(); },
    gameOptions: gameOptions ?? [],
  };
}

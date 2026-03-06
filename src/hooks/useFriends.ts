import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dataClient } from '../config/amplifyClient';
import { debugLog } from '../config/environment';
import { useUser } from '../context/UserContext';
import type { Friendship, User } from '../types';

export interface FriendView {
  friendshipId: string;
  friendId: string;
  username: string;
  avatar: string;
  level: number;
  rank: string | null;
  status: Friendship['status'];
  onlineStatus: User['status'];
  friendSince: string | null;
  note: string | null;
  playingGame: string | null;
  interactionCount: number | null;
  lastInteractionAt: string | null;
  updatedAt: string;
}

interface FriendsData {
  accepted: FriendView[];
  pending: FriendView[];
  declined: FriendView[];
}

async function fetchFriends(userId: string): Promise<FriendsData> {
  // Fetch friendships where the user is the requester
  const { data: asRequester, errors: e1 } = await dataClient.models.Friendship.list({
    filter: { requesterId: { eq: userId } },
  });
  if (e1?.length) throw new Error(e1.map((e) => e.message).join(', '));

  // Fetch friendships where the user is the addressee
  const { data: asAddressee, errors: e2 } = await dataClient.models.Friendship.list({
    filter: { addresseeId: { eq: userId } },
  });
  if (e2?.length) throw new Error(e2.map((e) => e.message).join(', '));

  const allFriendships = [...(asRequester ?? []), ...(asAddressee ?? [])];

  // Deduplicate — keep only unique friendship IDs
  const unique = [...new Map(allFriendships.map((f) => [f.id, f])).values()];

  // Resolve friend user details in parallel
  const friendUserIds = unique.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );

  const friendUsers = await Promise.all(
    friendUserIds.map((id) => dataClient.models.User.get({ id })),
  );

  const friendViews: FriendView[] = unique.map((f, i) => {
    const friendUserId = friendUserIds[i];
    const friendUser = friendUsers[i].data;

    debugLog('Processing friendship:', { friendshipId: f.id, friendUserId, friendUser });

    return {
      friendshipId: f.id,
      friendId: friendUserId,
      username: friendUser?.username ?? 'Unknown',
      avatar: friendUser?.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${friendUserId}`,
      level: friendUser?.level ?? 0,
      rank: friendUser?.rank ?? null,
      status: f.status,
      onlineStatus: friendUser?.status ?? 'OFFLINE',
      friendSince: f.friendSince ?? null,
      note: f.note ?? null,
      playingGame: null,
      interactionCount: f.interactionCount ?? 0,
      lastInteractionAt: f.lastInteractionAt ?? null,
      updatedAt: f.updatedAt,
    };
  });

  debugLog('Friends fetched:', { total: friendViews.length });

  return {
    accepted: friendViews.filter((f) => f.status === 'ACCEPTED'),
    pending: friendViews.filter((f) => f.status === 'PENDING'),
    declined: friendViews.filter((f) => f.status === 'DECLINED'),
  };
}

export default function useFriends() {
  const { userProfile } = useUser();
  const userId = userProfile?.id;
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery<FriendsData, Error>({
    queryKey: ['friends', userId],
    queryFn: () => fetchFriends(userId!),
    enabled: !!userId,
  });

  const removeMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { errors } = await dataClient.models.Friendship.delete({ id: friendshipId });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', userId] });
    },
  });

  return {
    accepted: data?.accepted ?? [],
    pending: data?.pending ?? [],
    declined: data?.declined ?? [],
    loading: isFetching,
    error: error?.message ?? null,
    refresh: async () => { await refetch(); },
    removeFriend: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
}

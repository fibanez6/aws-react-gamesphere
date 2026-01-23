import { useCallback, useEffect, useState } from 'react';
import { mockActivities, mockFriends } from '../data/mockData';
import { Activity, Friend, FriendStatusChangeEvent } from '../types';

interface UseFriendsResult {
  friends: Friend[];
  isLoading: boolean;
  error: Error | null;
  onlineFriends: Friend[];
  offlineFriends: Friend[];
  refetch: () => void;
  addFriend: (userId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

export function useFriends(): UseFriendsResult {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In production:
      // const client = generateClient();
      // const result = await client.graphql({ query: getFriends, variables: { userId } });
      // setFriends(result.data.getFriends.items);

      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setFriends(mockFriends);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const addFriend = useCallback(async (userId: string) => {
    try {
      // In production:
      // const client = generateClient();
      // await client.graphql({ query: sendFriendRequestMutation, variables: { toUserId: userId } });

      // For development
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`Friend request sent to ${userId}`);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to send friend request');
    }
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      // In production:
      // const client = generateClient();
      // await client.graphql({ query: removeFriendMutation, variables: { friendId } });

      // For development
      await new Promise(resolve => setTimeout(resolve, 300));
      setFriends(prev => prev.filter(f => f.id !== friendId));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to remove friend');
    }
  }, []);

  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);

  return {
    friends,
    isLoading,
    error,
    onlineFriends,
    offlineFriends,
    refetch: fetchFriends,
    addFriend,
    removeFriend,
  };
}

// Hook for friend status subscription
export function useFriendStatusSubscription(
  onStatusChange: (event: FriendStatusChangeEvent) => void
) {
  useEffect(() => {
    // In production:
    // const client = generateClient();
    // const subscription = client.graphql({
    //   query: onFriendStatusChange,
    //   variables: { userId }
    // }).subscribe({
    //   next: ({ data }) => onStatusChange(data.onFriendStatusChange),
    //   error: (err) => console.error('Subscription error:', err)
    // });
    // return () => subscription.unsubscribe();

    // For development, simulate random status changes
    const interval = setInterval(() => {
      const randomFriend = mockFriends[Math.floor(Math.random() * mockFriends.length)];
      const event: FriendStatusChangeEvent = {
        friendId: randomFriend.id,
        isOnline: !randomFriend.isOnline,
        status: randomFriend.isOnline ? 'offline' : 'online',
      };
      onStatusChange(event);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [onStatusChange]);
}

// Hook for friend activity subscription
export function useFriendActivitySubscription(
  onActivity: (activity: Activity) => void
) {
  useEffect(() => {
    // In production:
    // const client = generateClient();
    // const subscription = client.graphql({
    //   query: onFriendActivity,
    //   variables: { userId }
    // }).subscribe({
    //   next: ({ data }) => onActivity(data.onFriendActivity.activity),
    //   error: (err) => console.error('Subscription error:', err)
    // });
    // return () => subscription.unsubscribe();

    // For development, simulate random activities
    const interval = setInterval(() => {
      const randomActivity = mockActivities[Math.floor(Math.random() * mockActivities.length)];
      onActivity({ ...randomActivity, id: `act_${Date.now()}`, createdAt: new Date().toISOString() });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [onActivity]);
}

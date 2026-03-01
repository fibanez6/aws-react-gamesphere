import { clsx } from 'clsx';
import { Friend } from '../../types';
import Avatar from '../common/Avatar';
import { ListItemSkeleton } from '../common/Skeleton';

interface FriendsListProps {
  friends: Friend[];
  isLoading: boolean;
  onSelectFriend?: (friend: Friend) => void;
}

export default function FriendsList({ friends, isLoading, onSelectFriend }: FriendsListProps) {
  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Friends</h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Friends</h3>
        <span className="text-sm text-dark-400">
          <span className="text-green-400">{onlineFriends.length}</span> online
        </span>
      </div>

      {friends.length === 0 ? (
        <p className="text-dark-400 text-center py-8">No friends yet</p>
      ) : (
        <div className="space-y-4">
          {/* Online Friends */}
          {onlineFriends.length > 0 && (
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wide mb-2">
                Online — {onlineFriends.length}
              </p>
              <div className="space-y-1">
                {onlineFriends.map((friend) => (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    onClick={() => onSelectFriend?.(friend)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Offline Friends */}
          {offlineFriends.length > 0 && (
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wide mb-2">
                Offline — {offlineFriends.length}
              </p>
              <div className="space-y-1">
                {offlineFriends.map((friend) => (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    onClick={() => onSelectFriend?.(friend)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FriendItemProps {
  friend: Friend;
  onClick?: () => void;
}

function FriendItem({ friend, onClick }: FriendItemProps) {
  const getStatusColor = () => {
    switch (friend.status) {
      case 'online':
        return 'text-green-400';
      case 'in-game':
        return 'text-primary-400';
      case 'away':
        return 'text-yellow-400';
      default:
        return 'text-dark-500';
    }
  };

  const getStatusText = () => {
    switch (friend.status) {
      case 'online':
        return 'Online';
      case 'in-game':
        return `Playing ${friend.currentGame}`;
      case 'away':
        return 'Away';
      default:
        return 'Offline';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700/50 transition-colors text-left"
    >
      <Avatar
        src={friend.avatar}
        alt={friend.username}
        size="md"
        isOnline={friend.isOnline}
        showStatus
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{friend.username}</span>
          <span className="text-xs text-dark-500">Lv.{friend.level}</span>
        </div>
        <p className={clsx('text-sm truncate', getStatusColor())}>
          {getStatusText()}
        </p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-dark-500" />
    </button>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

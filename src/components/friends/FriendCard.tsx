import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { FriendView } from '../../hooks/useFriends';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

interface FriendCardProps {
  friend: FriendView;
  onRemove: (friendshipId: string) => void;
  onViewProfile: (friendId: string) => void;
  isRemoving?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'primary' | 'accent' }> = {
  ONLINE: { label: 'Online', variant: 'success' },
  IN_GAME: { label: 'In Game', variant: 'accent' },
  AWAY: { label: 'Away', variant: 'warning' },
  OFFLINE: { label: 'Offline', variant: 'default' },
};

const friendshipBadge: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  ACCEPTED: { label: 'Friend', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  DECLINED: { label: 'Declined', variant: 'danger' },
  BLOCKED: { label: 'Blocked', variant: 'danger' },
};

export default function FriendCard({ friend, onRemove, onViewProfile, isRemoving }: FriendCardProps) {
  const isFriend = friend.status === 'ACCEPTED';
  const online = isFriend && (friend.onlineStatus === 'ONLINE' || friend.onlineStatus === 'IN_GAME');
  const statusCfg = statusConfig[friend.onlineStatus ?? 'OFFLINE'] ?? statusConfig.OFFLINE;
  const fBadge = friendshipBadge[friend.status ?? 'PENDING'] ?? friendshipBadge.PENDING;

  const lastActive = friend.lastInteractionAt
    ? formatDistanceToNow(new Date(friend.lastInteractionAt), { addSuffix: true })
    : null;

  const friendSince = friend.friendSince
    ? formatDistanceToNow(new Date(friend.friendSince), { addSuffix: false })
    : null;

  return (
    <div
      className={clsx(
        'card card-hover flex flex-col gap-4 transition-all duration-200',
        online && 'ring-1 ring-green-500/30',
      )}
    >
      {/* Header: Avatar + basic info */}
      <div className="flex items-center gap-4 relative">
        <Avatar
          src={friend.avatar}
          alt={friend.username}
          size="lg"
          isOnline={online}
          showStatus={isFriend}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{friend.username}</h3>
            <Badge variant={fBadge.variant} size="sm">{fBadge.label}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {friend.rank && (
              <Badge variant="primary" size="sm">🏅 {friend.rank}</Badge>
            )}
            <span className="text-xs text-dark-500">Lv.{friend.level}</span>
          </div>
        </div>

        {/* Online/Offline pill — top-right (only for accepted friends) */}
        {isFriend && (
          <span
            className={clsx(
              'absolute top-0 right-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              statusCfg.variant === 'success' && 'bg-green-500/15 text-green-400',
              statusCfg.variant === 'accent' && 'bg-accent-500/15 text-accent-400',
              statusCfg.variant === 'warning' && 'bg-yellow-500/15 text-yellow-400',
              statusCfg.variant === 'default' && 'bg-dark-700 text-dark-400',
            )}
          >
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                statusCfg.variant === 'success' && 'bg-green-400',
                statusCfg.variant === 'accent' && 'bg-accent-400 animate-pulse',
                statusCfg.variant === 'warning' && 'bg-yellow-400',
                statusCfg.variant === 'default' && 'bg-dark-500',
              )}
            />
            {statusCfg.label}
          </span>
        )}
      </div>

      {/* In-Game banner (only for accepted friends) */}
      {isFriend && friend.onlineStatus === 'IN_GAME' && friend.playingGame && (
        <div className="flex items-center gap-2 bg-accent-500/10 border border-accent-500/20 rounded-lg px-3 py-2">
          <span className="text-accent-400 text-sm">🎮</span>
          <span className="text-sm text-accent-300 font-medium truncate">
            Playing {friend.playingGame}
          </span>
        </div>
      )}

      {/* Meta info (activity details only for accepted friends) */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-dark-400">
        {isFriend && friendSince && (
          <span>Friends for {friendSince}</span>
        )}
        {isFriend && lastActive && !online && (
          <span>Last active {lastActive}</span>
        )}
        {isFriend && friend.interactionCount != null && friend.interactionCount > 0 && (
          <span>{friend.interactionCount} interactions</span>
        )}
        {friend.note && (
          <span className="italic text-dark-500">"{friend.note}"</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-dark-800">
        <button
          onClick={() => onViewProfile(friend.friendId)}
          className="btn-secondary flex-1 text-sm py-2"
        >
          View Profile
        </button>
        <button
          onClick={() => onRemove(friend.friendshipId)}
          disabled={isRemoving}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg
                     text-red-400 hover:bg-red-500/10 hover:text-red-300
                     border border-dark-700 hover:border-red-500/30
                     transition-all duration-200 disabled:opacity-50"
        >
          <TrashIcon className="w-4 h-4" />
          Remove
        </button>
      </div>
    </div>
  );
}

// --- Skeleton loader ---
export function FriendCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-dark-700" />
        <div className="flex-1">
          <div className="h-4 bg-dark-700 rounded w-32 mb-2" />
          <div className="h-3 bg-dark-700 rounded w-20" />
        </div>
      </div>
      <div className="h-3 bg-dark-700 rounded w-40 mb-4" />
      <div className="flex gap-2 pt-2 border-t border-dark-800">
        <div className="h-9 bg-dark-700 rounded-lg flex-1" />
        <div className="h-9 bg-dark-700 rounded-lg w-24" />
      </div>
    </div>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

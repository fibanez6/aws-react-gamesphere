import { clsx } from 'clsx';
import { Friend } from '../../types';
import Avatar from '../common/Avatar';

interface FriendCardProps {
  friend: Friend;
  onViewProfile?: () => void;
  onRemoveFriend?: () => void;
  onSendMessage?: () => void;
}

export default function FriendCard({
  friend,
  onViewProfile,
  onRemoveFriend,
  onSendMessage,
}: FriendCardProps) {
  const getStatusBadge = () => {
    const statusConfig = {
      online: { color: 'bg-green-500/20 text-green-400', label: 'Online' },
      'in-game': { color: 'bg-primary-500/20 text-primary-400', label: 'In Game' },
      away: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Away' },
      offline: { color: 'bg-dark-600 text-dark-400', label: 'Offline' },
    };
    const config = statusConfig[friend.status];
    return (
      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', config.color)}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="card-hover">
      <div className="flex items-start gap-4">
        <Avatar
          src={friend.avatar}
          alt={friend.username}
          size="lg"
          isOnline={friend.isOnline}
          showStatus
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{friend.username}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-dark-400">Level {friend.level}</p>

          {friend.currentGame && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-dark-700/50 rounded-lg">
              <GameIcon className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">{friend.currentGame}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onViewProfile}
          className="btn-secondary flex-1 text-sm"
        >
          <UserIcon className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={onSendMessage}
          className="btn-primary flex-1 text-sm"
        >
          <MessageIcon className="w-4 h-4" />
          Message
        </button>
        <button
          onClick={onRemoveFriend}
          className="btn-ghost p-2 text-dark-400 hover:text-red-400"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Icon components
function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

import { User } from '../../types';
import Avatar from '../common/Avatar';
import { RankBadge } from '../common/Badge';
import Skeleton from '../common/Skeleton';

interface PlayerInfoProps {
  user: User | null;
  isLoading: boolean;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

export default function PlayerInfo({
  user,
  isLoading,
  isOwnProfile = false,
  onEditProfile,
}: PlayerInfoProps) {
  if (isLoading || !user) {
    return (
      <div className="card">
        <div className="flex flex-col items-center text-center">
          <Skeleton variant="circular" width={96} height={96} />
          <Skeleton width={150} height={24} className="mt-4" />
          <Skeleton width={100} className="mt-2" />
        </div>
      </div>
    );
  }

  const xp = user.xp ?? 0;
  const xpToNextLevel = user.xpToNextLevel ?? 1000;
  const xpPercentage = (xp / xpToNextLevel) * 100;

  return (
    <div className="card">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative">
          <Avatar
            src={user.avatar}
            alt={user.username}
            size="xl"
            isOnline={user.isOnline}
            showStatus
          />
          {isOwnProfile && (
            <button
              onClick={onEditProfile}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Username & Rank */}
        <h2 className="text-2xl font-bold mt-4">{user.username}</h2>
        <div className="flex items-center gap-2 mt-2">
          <RankBadge rank={user.rank} />
          <span className="text-dark-400">•</span>
          <span className="text-dark-400">Level {user.level ?? 1}</span>
        </div>

        {/* XP Progress */}
        <div className="w-full mt-6">
          <div className="flex justify-between text-xs text-dark-400 mb-2">
            <span>XP Progress</span>
            <span>{xp.toLocaleString()} / {xpToNextLevel.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <p className="text-xs text-dark-500 mt-1">
            {(xpToNextLevel - xp).toLocaleString()} XP to Level {(user.level ?? 1) + 1}
          </p>
        </div>

        {/* Profile Status */}
        <div className="flex items-center gap-2 mt-4">
          <span className={user.isOnline ? 'online-indicator' : 'offline-indicator'} />
          <span className="text-sm text-dark-400">
            {user.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Actions */}
        {isOwnProfile ? (
          <div className="flex gap-2 mt-6 w-full">
            <button className="btn-secondary flex-1 text-sm">
              <ShareIcon className="w-4 h-4" />
              Share Profile
            </button>
            <button className="btn-ghost p-2">
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mt-6 w-full">
            <button className="btn-primary flex-1">
              <UserPlusIcon className="w-4 h-4" />
              Add Friend
            </button>
            <button className="btn-secondary flex-1">
              <MessageIcon className="w-4 h-4" />
              Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Icon components
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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

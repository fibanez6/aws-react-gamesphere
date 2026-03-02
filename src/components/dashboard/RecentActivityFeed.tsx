import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import type { PlayerActivities } from '../../hooks/useDashboard';
import Avatar from '../common/Avatar';
import { ListItemSkeleton } from '../common/Skeleton';

interface RecentActivityFeedProps {
  activities: PlayerActivities[];
  isLoading: boolean;
}

export default function RecentActivityFeed({ activities, isLoading }: RecentActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
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
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button className="text-sm text-primary-400 hover:text-primary-300">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-dark-400 text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: PlayerActivities }) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'GAME_PLAYED':
        return <GameIcon className="w-4 h-4" />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <TrophyIcon className="w-4 h-4" />;
      case 'FRIEND_ADDED':
        return <UserPlusIcon className="w-4 h-4" />;
      case 'LEVEL_UP':
        return <StarIcon className="w-4 h-4" />;
      case 'RANK_UP':
        return <ArrowUpIcon className="w-4 h-4" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case 'GAME_PLAYED':
        return 'bg-primary-500/20 text-primary-400';
      case 'ACHIEVEMENT_UNLOCKED':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'FRIEND_ADDED':
        return 'bg-green-500/20 text-green-400';
      case 'LEVEL_UP':
        return 'bg-accent-500/20 text-accent-400';
      case 'RANK_UP':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-dark-600 text-dark-300';
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-700/30 transition-colors">
      <Avatar
        src={activity.avatar ?? ''}
        alt={activity.username}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.username}</span>{' '}
          <span className="text-dark-400">
            {getActivityDescription(activity)}
          </span>
        </p>
        <p className="text-xs text-dark-500 mt-1">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div
        className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          getActivityColor()
        )}
      >
        {getActivityIcon()}
      </div>
    </div>
  );
}

function getActivityDescription(activity: PlayerActivities): string {
  // Use description if available, otherwise derive from type
  if (activity.description) {
    return activity.description;
  }
  
  switch (activity.type) {
    case 'GAME_PLAYED':
      return `played ${activity.gameName || 'a game'}`;
    case 'ACHIEVEMENT_UNLOCKED':
      return activity.title || 'unlocked an achievement';
    case 'FRIEND_ADDED':
      return 'added a new friend';
    case 'LEVEL_UP':
      return activity.title || 'leveled up';
    case 'RANK_UP':
      return activity.title || 'ranked up';
    default:
      return activity.title || 'activity';
  }
}

// Icons
function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

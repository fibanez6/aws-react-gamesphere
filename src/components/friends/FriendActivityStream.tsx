import { formatDistanceToNow } from 'date-fns';
import { Activity } from '../../types';
import Avatar from '../common/Avatar';
import { ListItemSkeleton } from '../common/Skeleton';

interface FriendActivityStreamProps {
  activities: Activity[];
  isLoading: boolean;
}

export default function FriendActivityStream({
  activities,
  isLoading,
}: FriendActivityStreamProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Friend Activity</h3>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Filter to only show friend activities (not own)
  const friendActivities = activities.filter(a => a.userId !== 'user_001');

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Friend Activity</h3>
        <span className="text-sm text-dark-400">Live updates</span>
      </div>

      {friendActivities.length === 0 ? (
        <p className="text-dark-400 text-center py-8">No recent friend activity</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-dark-700" />

          <div className="space-y-4">
            {friendActivities.map((activity) => (
              <ActivityTimelineItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTimelineItem({ activity }: { activity: Activity }) {
  const getActivityEmoji = () => {
    switch (activity.type) {
      case 'game_played':
        return '🎮';
      case 'achievement_unlocked':
        return '🏆';
      case 'friend_added':
        return '👋';
      case 'level_up':
        return '⭐';
      case 'rank_up':
        return '📈';
      default:
        return '📌';
    }
  };

  return (
    <div className="relative flex gap-4 pl-10">
      {/* Timeline dot */}
      <div className="absolute left-3.5 w-3 h-3 bg-primary-500 rounded-full ring-4 ring-dark-800" />

      <div className="flex-1 bg-dark-700/30 rounded-lg p-4 hover:bg-dark-700/50 transition-colors">
        <div className="flex items-start gap-3">
          <Avatar
            src={activity.avatar}
            alt={activity.username}
            size="sm"
          />
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-medium">{activity.username}</span>{' '}
              <span className="text-dark-400">{activity.description}</span>{' '}
              <span className="text-lg">{getActivityEmoji()}</span>
            </p>
            <p className="text-xs text-dark-500 mt-1">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

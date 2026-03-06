import { clsx } from 'clsx';
import { RarityBadge } from '../common/Badge';
import Skeleton from '../common/Skeleton';

interface AchievementItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string | null;
  gameName: string | null;
  unlockedAt: string | null;
}

interface AchievementGridProps {
  achievements: AchievementItem[];
  isLoading: boolean;
}

export default function AchievementGrid({ achievements, isLoading }: AchievementGridProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-dark-700/50 rounded-xl p-4 animate-pulse">
              <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-3" />
              <Skeleton width="80%" className="mx-auto mb-2" />
              <Skeleton width="60%" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        <p className="text-dark-400 text-center py-8">No achievements unlocked yet</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <span className="text-sm text-dark-400">{achievements.length} unlocked</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementItem }) {
  const rarity = (achievement.rarity ?? 'common').toLowerCase();

  const rarityGlow: Record<string, string> = {
    common: '',
    uncommon: 'ring-green-500/30',
    rare: 'ring-blue-500/30',
    epic: 'ring-purple-500/30',
    legendary: 'ring-yellow-500/30 glow',
  };

  const rarityBg: Record<string, string> = {
    common: 'bg-dark-700/50',
    uncommon: 'bg-green-900/20',
    rare: 'bg-blue-900/20',
    epic: 'bg-purple-900/20',
    legendary: 'bg-gradient-to-br from-yellow-900/30 to-amber-900/20',
  };

  return (
    <div
      className={clsx(
        'rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ring-1 ring-dark-700 hover:ring-2',
        rarityBg[rarity],
        rarityGlow[rarity]
      )}
    >
      <div className="text-4xl mb-3">{achievement.icon}</div>
      <h4 className="font-medium text-sm mb-1">{achievement.name}</h4>
      <p className="text-xs text-dark-400 mb-2 line-clamp-2">{achievement.description}</p>
      <RarityBadge rarity={rarity} />
      {achievement.gameName && (
        <p className="text-xs text-dark-500 mt-2">{achievement.gameName}</p>
      )}
    </div>
  );
}

// Compact Achievement List for sidebar
interface AchievementListProps {
  achievements: AchievementItem[];
  maxItems?: number;
}

export function AchievementList({ achievements, maxItems = 5 }: AchievementListProps) {
  const displayAchievements = achievements.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayAchievements.map((achievement) => (
        <div
          key={achievement.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors"
        >
          <span className="text-2xl">{achievement.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{achievement.name}</p>
            <p className="text-xs text-dark-400 truncate">{achievement.gameName}</p>
          </div>
          <RarityBadge rarity={(achievement.rarity ?? 'common').toLowerCase()} />
        </div>
      ))}
    </div>
  );
}

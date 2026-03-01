import { Game } from '../../types';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';

interface GameCardProps {
  game: Game;
  onClick?: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
  return (
    <div
      onClick={onClick}
      className="card-hover cursor-pointer overflow-hidden group"
    >
      {/* Cover Image */}
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
        <img
          src={game.coverImage}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-transparent to-transparent" />
        
        {/* Active Players Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="success" size="sm">
            <span className="online-indicator mr-1.5 scale-75" />
            {formatNumber(game.activePlayers)} playing
          </Badge>
        </div>
      </div>

      {/* Game Info */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1">{game.name}</h3>
          <div className="flex items-center gap-1 text-yellow-400 flex-shrink-0">
            <StarIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{game.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge variant="primary" size="sm">{game.genre}</Badge>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-dark-400">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span>{game.avgPlaytime}h avg</span>
          </div>
          <div className="flex gap-1">
            {game.platform.slice(0, 3).map((platform) => (
              <PlatformIcon key={platform} platform={platform} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton variant
export function GameCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <Skeleton variant="rectangular" height={160} className="-mx-6 -mt-6 mb-4" />
      <Skeleton width="70%" height={24} className="mb-2" />
      <Skeleton width="40%" height={20} className="mb-4" />
      <div className="flex justify-between">
        <Skeleton width="30%" />
        <Skeleton width="20%" />
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    PC: '💻',
    PlayStation: '🎮',
    Xbox: '🎯',
    Switch: '🕹️',
    Mobile: '📱',
  };
  return (
    <span className="text-xs" title={platform}>
      {icons[platform] || '🎮'}
    </span>
  );
}

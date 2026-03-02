import Skeleton from '../common/Skeleton';

interface TopGameHighlightGame {
  name: string;
  coverImage: string;
  genre: string;
  activePlayers: number;
  rating: number;
}

interface TopGameHighlightProps {
  game: TopGameHighlightGame | null;
  hoursThisWeek?: number;
  isLoading: boolean;
}

export default function TopGameHighlight({ game, hoursThisWeek = 0, isLoading }: TopGameHighlightProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Most Played This Week</h3>
        <div className="flex gap-4">
          <Skeleton variant="rectangular" width={120} height={160} className="rounded-xl" />
          <div className="flex-1">
            <Skeleton width="80%" className="mb-2" />
            <Skeleton width="60%" className="mb-4" />
            <Skeleton width="40%" />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Most Played This Week</h3>
        <p className="text-dark-400 text-center py-8">No games played this week</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Most Played This Week</h3>
      
      <div className="flex gap-4">
        {/* Game Cover */}
        <div className="relative w-32 h-44 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={game.coverImage}
            alt={game.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Game Info */}
        <div className="flex-1">
          <h4 className="text-xl font-bold mb-1">{game.name}</h4>
          <p className="text-dark-400 text-sm mb-4">{game.genre}</p>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-dark-500 mb-1">Hours This Week</p>
              <p className="text-2xl font-bold text-primary-400">{hoursThisWeek}h</p>
            </div>

            <div className="flex gap-4">
              <div>
                <p className="text-xs text-dark-500 mb-1">Active Players</p>
                <p className="text-sm font-medium">{game.activePlayers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">Rating</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" />
                  {game.rating}
                </p>
              </div>
            </div>
          </div>

          <button className="btn-primary mt-4 text-sm">
            <PlayIcon className="w-4 h-4" />
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );
}

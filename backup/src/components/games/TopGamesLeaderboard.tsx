import { Game } from '../../types';
import Badge from '../common/Badge';
import { ListItemSkeleton } from '../common/Skeleton';

interface TopGamesLeaderboardProps {
  games: Game[];
  isLoading: boolean;
  onSelectGame?: (game: Game) => void;
}

export default function TopGamesLeaderboard({
  games,
  isLoading,
  onSelectGame,
}: TopGamesLeaderboardProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Top Games</h3>
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
        <h3 className="text-lg font-semibold">Top Games Leaderboard</h3>
        <Badge variant="primary">Trending</Badge>
      </div>

      <div className="space-y-2">
        {games.slice(0, 10).map((game, index) => (
          <button
            key={game.id}
            onClick={() => onSelectGame?.(game)}
            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-dark-700/50 transition-colors text-left"
          >
            {/* Rank */}
            <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
              <span
                className={`font-bold ${
                  index < 3 ? 'text-yellow-400' : 'text-dark-400'
                }`}
              >
                {index + 1}
              </span>
            </div>

            {/* Game Image */}
            <img
              src={game.coverImage}
              alt={game.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />

            {/* Game Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{game.name}</p>
              <p className="text-sm text-dark-400">{game.genre}</p>
            </div>

            {/* Stats */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-green-400">
                {formatNumber(game.activePlayers)}
              </p>
              <p className="text-xs text-dark-500">playing</p>
            </div>
          </button>
        ))}
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

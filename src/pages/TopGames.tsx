import { useState } from 'react';
import GameCard, { GameCardSkeleton } from '../components/games/GameCard';
import GameDetailModal from '../components/games/GameDetailModal';
import GameFilter from '../components/games/GameFilter';
import TopGamesLeaderboard from '../components/games/TopGamesLeaderboard';
import { useTopGames } from '../hooks/useTopGames';
import { Game, GameFilter as GameFilterType } from '../types';

export default function TopGames() {
  const [filter, setFilter] = useState<GameFilterType>({
    sortBy: 'activePlayers',
    timeRange: '7d',
  });
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { games, isLoading } = useTopGames(filter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Top Games</h1>
        <p className="text-dark-400 mt-1">
          Discover trending and popular games across all platforms
        </p>
      </div>

      {/* Filters */}
      <GameFilter filter={filter} onFilterChange={setFilter} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Games Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-dark-400 mb-4">No games found matching your filters</p>
              <button
                onClick={() => setFilter({})}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => setSelectedGame(game)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="lg:col-span-1">
          <TopGamesLeaderboard
            games={games}
            isLoading={isLoading}
            onSelectGame={setSelectedGame}
          />

          {/* Quick Stats */}
          <div className="card mt-6">
            <h4 className="font-semibold mb-4">Platform Stats</h4>
            <div className="space-y-3">
              <PlatformStat platform="PC" players={1250000} />
              <PlatformStat platform="PlayStation" players={890000} />
              <PlatformStat platform="Xbox" players={750000} />
              <PlatformStat platform="Switch" players={420000} />
              <PlatformStat platform="Mobile" players={2100000} />
            </div>
          </div>
        </div>
      </div>

      {/* Game Detail Modal */}
      <GameDetailModal
        game={selectedGame}
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}

interface PlatformStatProps {
  platform: string;
  players: number;
}

function PlatformStat({ platform, players }: PlatformStatProps) {
  const icons: Record<string, string> = {
    PC: '💻',
    PlayStation: '🎮',
    Xbox: '🎯',
    Switch: '🕹️',
    Mobile: '📱',
  };

  const formatPlayers = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{icons[platform]}</span>
        <span className="text-sm">{platform}</span>
      </div>
      <span className="text-sm text-primary-400 font-medium">
        {formatPlayers(players)} playing
      </span>
    </div>
  );
}

import { clsx } from 'clsx';
import { LeaderboardFilter, LeaderboardMetric, LeaderboardType } from '../../types';

const AVAILABLE_GAMES = [
  { id: 'game_001', name: 'Elden Ring' },
  { id: 'game_002', name: 'Cyberpunk 2077' },
  { id: 'game_003', name: 'Valorant' },
  { id: 'game_004', name: 'League of Legends' },
  { id: 'game_005', name: 'Minecraft' },
  { id: 'game_006', name: 'Fortnite' },
];

export const DEFAULT_GAME_ID = AVAILABLE_GAMES[0].id;

interface LeaderboardFiltersProps {
  filter: LeaderboardFilter;
  onFilterChange: (filter: LeaderboardFilter) => void;
}

export default function LeaderboardFilters({
  filter,
  onFilterChange,
}: LeaderboardFiltersProps) {
  const types: { value: LeaderboardType; label: string; icon: string }[] = [
    { value: 'global', label: 'Global', icon: '🌍' },
    { value: 'friends', label: 'Friends', icon: '👥' },
    { value: 'game', label: 'By Game', icon: '🎮' },
  ];

  const metrics: { value: LeaderboardMetric; label: string }[] = [
    { value: 'hours', label: 'Total Hours' },
    { value: 'wins', label: 'Total Wins' },
    { value: 'achievements', label: 'Achievements' },
    { value: 'winrate', label: 'Win Rate' },
  ];

  const handleTypeChange = (type: LeaderboardType) => {
    if (type === 'game') {
      onFilterChange({ ...filter, type, gameId: filter.gameId || DEFAULT_GAME_ID });
    } else {
      // Remove gameId when switching away from game type
      const { gameId: _, ...rest } = filter;
      onFilterChange({ ...rest, type });
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type.value}
            onClick={() => handleTypeChange(type.value)}
            className={clsx(
              'px-4 py-2 rounded-lg font-medium transition-all',
              filter.type === type.value
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700/50 text-dark-300 hover:bg-dark-700'
            )}
          >
            <span className="mr-2">{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* Metric / Game Selector */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {filter.type === 'game' ? (
            /* Game Selector */
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-dark-400 mb-2">Select Game</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GAMES.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => onFilterChange({ ...filter, gameId: game.id })}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filter.gameId === game.id
                        ? 'bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/50'
                        : 'bg-dark-700/50 text-dark-400 hover:text-white'
                    )}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Metric Selector */
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-dark-400 mb-2">Ranking By</label>
              <div className="flex flex-wrap gap-2">
                {metrics.map((metric) => (
                  <button
                    key={metric.value}
                    onClick={() => onFilterChange({ ...filter, metric: metric.value })}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      filter.metric === metric.value
                        ? 'bg-accent-600/20 text-accent-400 ring-1 ring-accent-500/50'
                        : 'bg-dark-700/50 text-dark-400 hover:text-white'
                    )}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

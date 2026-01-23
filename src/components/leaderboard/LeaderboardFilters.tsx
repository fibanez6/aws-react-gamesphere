import { clsx } from 'clsx';
import { LeaderboardFilter, LeaderboardMetric, LeaderboardType } from '../../types';

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

  const timeRanges = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type.value}
            onClick={() => onFilterChange({ ...filter, type: type.value })}
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

      {/* Metric and Time Selector */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Metric Selector */}
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

          {/* Time Range Selector */}
          <div className="flex-shrink-0">
            <label className="block text-xs text-dark-400 mb-2">Time Range</label>
            <div className="flex gap-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() =>
                    onFilterChange({
                      ...filter,
                      timeRange: range.value as LeaderboardFilter['timeRange'],
                    })
                  }
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    filter.timeRange === range.value
                      ? 'bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/50'
                      : 'bg-dark-700/50 text-dark-400 hover:text-white'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

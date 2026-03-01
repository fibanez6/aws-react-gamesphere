import { genres, platforms } from '../../data/mockData';
import { GameFilter as GameFilterType } from '../../types';

interface GameFilterProps {
  filter: GameFilterType;
  onFilterChange: (filter: GameFilterType) => void;
}

export default function GameFilter({ filter, onFilterChange }: GameFilterProps) {
  const timeRanges = [
    { value: '24h', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
  ];

  const sortOptions = [
    { value: 'activePlayers', label: 'Most Active' },
    { value: 'avgPlaytime', label: 'Most Played' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  return (
    <div className="card mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Genre Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-dark-400 mb-1">Genre</label>
          <select
            value={filter.genre || ''}
            onChange={(e) => onFilterChange({ ...filter, genre: e.target.value || undefined })}
            className="input text-sm"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-dark-400 mb-1">Platform</label>
          <select
            value={filter.platform || ''}
            onChange={(e) => onFilterChange({ ...filter, platform: e.target.value || undefined })}
            className="input text-sm"
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-dark-400 mb-1">Time Range</label>
          <select
            value={filter.timeRange || '7d'}
            onChange={(e) => onFilterChange({ ...filter, timeRange: e.target.value as GameFilterType['timeRange'] })}
            className="input text-sm"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-dark-400 mb-1">Sort By</label>
          <select
            value={filter.sortBy || 'activePlayers'}
            onChange={(e) => onFilterChange({ ...filter, sortBy: e.target.value as GameFilterType['sortBy'] })}
            className="input text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex-shrink-0 self-end">
          <button
            onClick={() => onFilterChange({})}
            className="btn-ghost text-sm text-dark-400"
          >
            <ClearIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

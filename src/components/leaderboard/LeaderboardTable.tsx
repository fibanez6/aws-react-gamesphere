import { clsx } from 'clsx';
import { LeaderboardEntry } from '../../types';
import Avatar from '../common/Avatar';
import { TableRowSkeleton } from '../common/Skeleton';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  currentUserId?: string;
  metric: string;
}

export default function LeaderboardTable({
  entries,
  isLoading,
  currentUserId,
  metric,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Player</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={4} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const getMetricLabel = () => {
    switch (metric) {
      case 'hours':
        return 'Hours';
      case 'wins':
        return 'Wins';
      case 'achievements':
        return 'Achievements';
      case 'winrate':
        return 'Win Rate';
      default:
        return 'Score';
    }
  };

  const formatScore = (entry: LeaderboardEntry) => {
    return entry.score.toLocaleString();
  };

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
              <th className="pb-3 font-medium w-20">Rank</th>
              <th className="pb-3 font-medium">Player</th>
              <th className="pb-3 font-medium w-32">{getMetricLabel()}</th>
              <th className="pb-3 font-medium w-24">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/50">
            {entries.map((entry) => (
              <tr
                key={entry.userId}
                className={clsx(
                  'transition-colors',
                  entry.userId === currentUserId
                    ? 'bg-primary-500/10 hover:bg-primary-500/20'
                    : 'hover:bg-dark-700/30'
                )}
              >
                <td className="py-4">
                  <RankDisplay rank={entry.rank} />
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={entry.avatar}
                      alt={entry.username}
                      size="sm"
                    />
                    <span className={clsx(
                      'font-medium',
                      entry.userId === currentUserId && 'text-primary-400'
                    )}>
                      {entry.username}
                      {entry.userId === currentUserId && (
                        <span className="text-xs text-dark-400 ml-2">(You)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="font-semibold text-primary-400">
                    {formatScore(entry)}
                  </span>
                </td>
                <td className="py-4">
                  <RankChange change={entry.change} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <span className="text-yellow-400">🥇</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-400/20 flex items-center justify-center">
        <span className="text-gray-300">🥈</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center">
        <span className="text-amber-500">🥉</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center">
      <span className="text-dark-300 font-medium">{rank}</span>
    </div>
  );
}

function RankChange({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return <span className="text-dark-500">—</span>;
  }

  const direction = change > 0 ? 'up' : 'down';
  const amount = Math.abs(change);

  return (
    <div
      className={clsx(
        'flex items-center gap-1',
        direction === 'up' ? 'text-green-400' : 'text-red-400'
      )}
    >
      {direction === 'up' ? (
        <ArrowUpIcon className="w-4 h-4" />
      ) : (
        <ArrowDownIcon className="w-4 h-4" />
      )}
      <span className="font-medium">{amount}</span>
    </div>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

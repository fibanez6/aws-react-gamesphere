import { clsx } from 'clsx';
import { LeaderboardEntry } from '../../types';
import Avatar from '../common/Avatar';

interface PlayerRankCardProps {
  entry: LeaderboardEntry | null;
  totalPlayers?: number;
}

export default function PlayerRankCard({ entry, totalPlayers = 1000 }: PlayerRankCardProps) {
  if (!entry) {
    return (
      <div className="card">
        <p className="text-dark-400 text-center py-8">Not ranked yet</p>
      </div>
    );
  }

  const percentile = Math.round((1 - entry.rank / totalPlayers) * 100);

  return (
    <div className="card bg-gradient-to-br from-primary-900/30 to-accent-900/20 border-primary-500/30">
      <div className="text-center">
        <p className="text-sm text-dark-400 mb-2">Your Rank</p>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <Avatar
            src={entry.avatar}
            alt={entry.username}
            size="lg"
          />
          <div className="text-left">
            <p className="font-semibold text-lg">{entry.username}</p>
            <p className="text-sm text-dark-400">{entry.userRank}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 mb-4">
          <div>
            <p className="text-4xl font-bold text-gradient">#{entry.rank}</p>
            <p className="text-xs text-dark-400">Global Rank</p>
          </div>
          <div className="h-12 w-px bg-dark-700" />
          <div>
            <p className="text-4xl font-bold text-primary-400">
              {entry.score.toLocaleString()}
            </p>
            <p className="text-xs text-dark-400">Score</p>
          </div>
        </div>

        <div className="bg-dark-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-dark-400">Top {100 - percentile}%</span>
            <span className="text-primary-400 font-medium">
              Better than {percentile}% of players
            </span>
          </div>
          <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>

        {entry.change !== null && entry.change !== 0 && (
          <div className={clsx(
            'mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
            entry.change > 0
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          )}>
            {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)} positions this week
          </div>
        )}
      </div>
    </div>
  );
}

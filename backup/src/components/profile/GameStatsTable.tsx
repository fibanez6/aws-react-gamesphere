import { GameStats } from '../../types';
import { RankBadge } from '../common/Badge';
import { TableRowSkeleton } from '../common/Skeleton';

interface GameStatsTableProps {
  gameStats: GameStats[];
  isLoading: boolean;
}

export default function GameStatsTable({ gameStats, isLoading }: GameStatsTableProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Game Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
                <th className="pb-3 font-medium">Game</th>
                <th className="pb-3 font-medium">Hours</th>
                <th className="pb-3 font-medium">Win Rate</th>
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Achievements</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (gameStats.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Game Statistics</h3>
        <p className="text-dark-400 text-center py-8">No game statistics available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Game Statistics</h3>
        <button className="text-sm text-primary-400 hover:text-primary-300">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
              <th className="pb-3 font-medium">Game</th>
              <th className="pb-3 font-medium">Hours</th>
              <th className="pb-3 font-medium">Win Rate</th>
              <th className="pb-3 font-medium">Rank</th>
              <th className="pb-3 font-medium">Achievements</th>
              <th className="pb-3 font-medium">Last Played</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/50">
            {gameStats.map((stat) => (
              <tr key={stat.gameId} className="hover:bg-dark-700/30 transition-colors">
                <td className="py-4">
                  <span className="font-medium">{stat.gameName}</span>
                </td>
                <td className="py-4">
                  <span className="text-primary-400 font-medium">{stat.hoursPlayed}h</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${stat.winRate * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(stat.winRate * 100)}%</span>
                  </div>
                </td>
                <td className="py-4">
                  <RankBadge rank={stat.rank} size="sm" />
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1">
                    <TrophyIcon className="w-4 h-4 text-yellow-400" />
                    <span>{stat.achievements}</span>
                    <span className="text-dark-500">/ {stat.totalAchievements}</span>
                  </div>
                </td>
                <td className="py-4 text-dark-400 text-sm">
                  {stat.lastPlayed}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
    </svg>
  );
}

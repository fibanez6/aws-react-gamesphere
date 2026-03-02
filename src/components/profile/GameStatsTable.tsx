import { RankBadge } from '../common/Badge';
import { TableRowSkeleton } from '../common/Skeleton';

interface GameStatItem {
  gameId: string;
  gameName: string;
  hoursPlayed: number;
  winRate: number;
  rank: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  lastPlayed: string;
}

interface GameStatsTableProps {
  gameStats: GameStatItem[];
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
              <th className="pb-3 font-medium">W / Total</th>
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
                        style={{ width: `${stat.winRate}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(stat.winRate)}%</span>
                  </div>
                </td>
                <td className="py-4">
                  <RankBadge rank={stat.rank ?? 'Unranked'} size="sm" />
                </td>
                <td className="py-4">
                  <span>{stat.wins} / {stat.totalMatches}</span>
                </td>
                <td className="py-4 text-dark-400 text-sm">
                  {new Date(stat.lastPlayed).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

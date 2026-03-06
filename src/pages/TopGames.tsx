import useTopGames from '@/hooks/useTopGames';
import { useParams } from 'react-router-dom';
import { RankBadge } from '../components/common/Badge';
import { TableRowSkeleton } from '../components/common/Skeleton';
import { useUser } from '../context/UserContext';

export default function TopGames() {
  const { playerId } = useParams<{ playerId?: string }>();
  const { userProfile: loggedInUser } = useUser();
  const { games, isFriend, targetUsername, loading, error } = useTopGames(playerId);

  const isOwnPage = !playerId || playerId === loggedInUser?.id;

  // Access denied state
  if (!loading && !isOwnPage && !isFriend) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Top Games</h1>
          <p className="text-dark-400 mt-1">
            {targetUsername ? `${targetUsername}'s` : "This player's"} game stats are private.
          </p>
        </div>
        <div className="card text-center py-16">
          <span className="text-5xl mb-4 block">🔒</span>
          <h3 className="text-lg font-semibold mb-2">Friends Only</h3>
          <p className="text-dark-400 max-w-md mx-auto">
            You must be friends with this player to view their top games.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isOwnPage ? 'My Top Games' : `${targetUsername ?? 'Player'}'s Top Games`}
        </h1>
        <p className="text-dark-400 mt-1">
          {isOwnPage
            ? 'Your most-played games ranked by hours'
            : `Viewing ${targetUsername ?? 'player'}'s game stats`}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="card border border-red-500/30 bg-red-500/10 text-red-300 p-4">
          Failed to load top games: {error}
        </div>
      )}

      {/* Stats summary cards */}
      {!loading && games.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Games Played"
            value={games.length.toString()}
            icon="🎮"
          />
          <SummaryCard
            label="Total Hours"
            value={`${games.reduce((s, g) => s + g.hoursPlayed, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}h`}
            icon="⏱️"
          />
          <SummaryCard
            label="Avg. Win Rate"
            value={`${Math.round(games.reduce((s, g) => s + g.winRate, 0) / games.length)}%`}
            icon="🏆"
          />
          <SummaryCard
            label="Total Matches"
            value={games.reduce((s, g) => s + g.totalMatches, 0).toLocaleString()}
            icon="⚔️"
          />
        </div>
      )}

      {/* Games table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Game Statistics</h3>
          {!loading && (
            <span className="text-sm text-dark-400">{games.length} games</span>
          )}
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Game</th>
                  <th className="pb-3 font-medium">Hours</th>
                  <th className="pb-3 font-medium">Win Rate</th>
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">W / L</th>
                  <th className="pb-3 font-medium">Last Played</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={7} />
                ))}
              </tbody>
            </table>
          </div>
        ) : games.length === 0 ? (
          <p className="text-dark-400 text-center py-8">No game statistics yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Game</th>
                  <th className="pb-3 font-medium">Hours</th>
                  <th className="pb-3 font-medium">Win Rate</th>
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">W / L</th>
                  <th className="pb-3 font-medium">Last Played</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {games.map((game, idx) => (
                  <tr key={game.gameStatsId} className="hover:bg-dark-700/30 transition-colors">
                    <td className="py-4 text-dark-400 font-mono text-sm">{idx + 1}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {game.gameCover && (
                          <img
                            src={game.gameCover}
                            alt={game.gameName}
                            className="w-10 h-14 rounded object-cover hidden sm:block"
                          />
                        )}
                        <span className="font-medium">{game.gameName}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-primary-400 font-medium">
                        {game.hoursPlayed.toLocaleString(undefined, { maximumFractionDigits: 1 })}h
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(game.winRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm">{Math.round(game.winRate)}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <RankBadge rank={game.rank ?? 'Unranked'} size="sm" />
                    </td>
                    <td className="py-4">
                      <span className="text-green-400">{game.wins}</span>
                      <span className="text-dark-500 mx-1">/</span>
                      <span className="text-red-400">{game.losses}</span>
                    </td>
                    <td className="py-4 text-dark-400 text-sm">
                      {new Date(game.lastPlayed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-dark-400 text-xs">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
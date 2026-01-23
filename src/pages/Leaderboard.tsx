import { useState } from 'react';
import LeaderboardFilters from '../components/leaderboard/LeaderboardFilters';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import PlayerRankCard from '../components/leaderboard/PlayerRankCard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { LeaderboardFilter } from '../types';

export default function Leaderboard() {
  const [filter, setFilter] = useState<LeaderboardFilter>({
    type: 'global',
    metric: 'hours',
    timeRange: 'all',
  });

  const { entries, isLoading, userRank } = useLeaderboard(filter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-dark-400 mt-1">
          Compete with players worldwide and climb the ranks
        </p>
      </div>

      {/* Filters */}
      <LeaderboardFilters filter={filter} onFilterChange={setFilter} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaderboard Table */}
        <div className="lg:col-span-3">
          <LeaderboardTable
            entries={entries}
            isLoading={isLoading}
            metric={filter.metric}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Your Rank Card */}
          <PlayerRankCard entry={userRank} totalPlayers={entries.length * 100} />

          {/* Top Performers */}
          <div className="card">
            <h4 className="font-semibold mb-4">🏆 Hall of Fame</h4>
            <div className="space-y-3">
              {entries.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-dark-700/30"
                >
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.username}</p>
                    <p className="text-xs text-dark-400">
                      {entry.score.toLocaleString()} {filter.metric}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h4 className="font-semibold mb-4">📊 Your Stats</h4>
            <div className="space-y-4">
              <StatItem
                label="Best Rank Achieved"
                value="#5"
                icon="🎯"
              />
              <StatItem
                label="Weeks in Top 10"
                value="8"
                icon="📅"
              />
              <StatItem
                label="Rank Improvement"
                value="+12"
                icon="📈"
                isPositive
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  icon: string;
  isPositive?: boolean;
}

function StatItem({ label, value, icon, isPositive }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-dark-400">{label}</p>
        <p
          className={`font-semibold ${
            isPositive ? 'text-green-400' : ''
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

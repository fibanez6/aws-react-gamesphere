import useLeaderboard, {
    type LeaderboardMetric,
    type LeaderboardPeriod,
    type LeaderboardTab,
} from '@/hooks/useLeaderboard';
import { useState } from 'react';
import { RankBadge } from '../components/common/Badge';
import { TableRowSkeleton } from '../components/common/Skeleton';
import { useUser } from '../context/UserContext';

const TABS: { key: LeaderboardTab; label: string; icon: string }[] = [
  { key: 'global', label: 'Global', icon: '🌍' },
  { key: 'friends', label: 'Friends', icon: '👥' },
  { key: 'game', label: 'By Game', icon: '🎮' },
];

const METRICS: { key: LeaderboardMetric; label: string }[] = [
  { key: 'hoursPlayed', label: 'Hours Played' },
  { key: 'wins', label: 'Wins' },
  { key: 'achievementsUnlocked', label: 'Achievements' },
  { key: 'winRate', label: 'Win Rate' },
];

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'DAILY', label: 'Today' },
  { key: 'MONTHLY', label: 'This Month' },
  { key: 'ALL_TIME', label: 'All Time' },
];

const PAGE_SIZES = [10, 25, 50, 100];

export default function Leaderboard() {
  const { userProfile } = useUser();
  const [tab, setTab] = useState<LeaderboardTab>('global');
  const [metric, setMetric] = useState<LeaderboardMetric>('hoursPlayed');
  const [period, setPeriod] = useState<LeaderboardPeriod>('ALL_TIME');
  const [gameId, setGameId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { rows, totalCount, totalPages, myRank, loading, error, gameOptions } =
    useLeaderboard({ tab, period, metric, gameId: gameId || undefined, page, pageSize });

  // Reset page when filters change
  const handleTabChange = (t: LeaderboardTab) => { setTab(t); setPage(1); };
  const handleMetricChange = (m: LeaderboardMetric) => { setMetric(m); setPage(1); };
  const handlePeriodChange = (p: LeaderboardPeriod) => { setPeriod(p); setPage(1); };
  const handleGameChange = (id: string) => { setGameId(id); setPage(1); };
  const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1); };

  const formatMetricValue = (row: typeof rows[number], m: LeaderboardMetric) => {
    switch (m) {
      case 'hoursPlayed': return `${row.hoursPlayed.toLocaleString(undefined, { maximumFractionDigits: 1 })}h`;
      case 'wins': return row.wins.toLocaleString();
      case 'achievementsUnlocked': return row.achievementsUnlocked.toLocaleString();
      case 'winRate': return `${Math.round(row.winRate)}%`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-dark-400 mt-1">See how you stack up against other players</p>
        </div>
        {myRank && (
          <div className="card flex items-center gap-3 px-4 py-2 !bg-primary-500/10 border border-primary-500/30">
            <span className="text-2xl">🏅</span>
            <div>
              <p className="text-xs text-dark-400">Your Rank</p>
              <p className="text-lg font-bold text-primary-400">#{myRank}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period */}
        <div className="flex rounded-lg overflow-hidden border border-dark-600">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePeriodChange(p.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.key
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Metric */}
        <select
          value={metric}
          onChange={(e) => handleMetricChange(e.target.value as LeaderboardMetric)}
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>

        {/* Game selector (only for "game" tab) */}
        {tab === 'game' && (
          <select
            value={gameId}
            onChange={(e) => handleGameChange(e.target.value)}
            className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-dark-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select a game…</option>
            {gameOptions.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Page size */}
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-dark-200 focus:outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span>per page</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border border-red-500/30 bg-red-500/10 text-red-300 p-4">
          Failed to load leaderboard: {error}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-dark-400 text-sm border-b border-dark-700">
                <th className="pb-3 font-medium w-14">#</th>
                <th className="pb-3 font-medium">Player</th>
                <th className="pb-3 font-medium">Level</th>
                <th className="pb-3 font-medium">Rank</th>
                <th className="pb-3 font-medium">Hours</th>
                <th className="pb-3 font-medium">Wins</th>
                <th className="pb-3 font-medium">Achievements</th>
                <th className="pb-3 font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {loading ? (
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={8} />
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-dark-400">
                    {tab === 'game' && !gameId
                      ? 'Select a game to view rankings'
                      : 'No leaderboard data for the current filters'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isMe = row.userId === userProfile?.id;
                  return (
                    <tr
                      key={row.userId}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-primary-500/10 hover:bg-primary-500/15'
                          : 'hover:bg-dark-700/30'
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3">
                        <RankPosition rank={row.rank} />
                      </td>
                      {/* Player */}
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.avatar}
                            alt={row.username}
                            className="w-8 h-8 rounded-full bg-dark-600"
                          />
                          <span className={`font-medium ${isMe ? 'text-primary-400' : ''}`}>
                            {row.username}
                            {isMe && <span className="ml-1.5 text-xs text-primary-500">(you)</span>}
                          </span>
                        </div>
                      </td>
                      {/* Level */}
                      <td className="py-3 text-dark-300">{row.level}</td>
                      {/* Rank badge */}
                      <td className="py-3">
                        <RankBadge rank={row.userRank ?? 'Unranked'} size="sm" />
                      </td>
                      {/* Hours */}
                      <td className={`py-3 ${metric === 'hoursPlayed' ? 'text-primary-400 font-semibold' : 'text-dark-300'}`}>
                        {formatMetricValue(row, 'hoursPlayed')}
                      </td>
                      {/* Wins */}
                      <td className={`py-3 ${metric === 'wins' ? 'text-primary-400 font-semibold' : 'text-dark-300'}`}>
                        {formatMetricValue(row, 'wins')}
                      </td>
                      {/* Achievements */}
                      <td className={`py-3 ${metric === 'achievementsUnlocked' ? 'text-primary-400 font-semibold' : 'text-dark-300'}`}>
                        {formatMetricValue(row, 'achievementsUnlocked')}
                      </td>
                      {/* Win Rate */}
                      <td className={`py-3 ${metric === 'winRate' ? 'text-primary-400 font-semibold' : 'text-dark-300'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.min(row.winRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{Math.round(row.winRate)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
            <span className="text-sm text-dark-400">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-1">
              <PaginationButton
                disabled={page <= 1}
                onClick={() => setPage(1)}
                label="«"
              />
              <PaginationButton
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                label="‹"
              />
              {generatePageNumbers(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1 text-dark-500">…</span>
                ) : (
                  <PaginationButton
                    key={p}
                    active={p === page}
                    onClick={() => setPage(p as number)}
                    label={String(p)}
                  />
                )
              )}
              <PaginationButton
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                label="›"
              />
              <PaginationButton
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                label="»"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RankPosition({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return <span className="text-dark-400 font-mono text-sm">{rank}</span>;
}

function PaginationButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[32px] px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-500 text-white'
          : disabled
            ? 'bg-dark-800 text-dark-600 cursor-not-allowed'
            : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Generate page number array with ellipses, e.g. [1, '...', 4, 5, 6, '...', 10]
 */
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
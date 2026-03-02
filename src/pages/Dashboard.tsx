import useDashboard from '../hooks/useDashboard';
import { StatsGrid } from '../components/dashboard/StatsSummaryCard';
import PerformanceTrendChart from '../components/dashboard/PerformanceTrendChart';
import TopGameHighlight from '../components/dashboard/TopGameHighlight';
import QuickStatItem from '../components/dashboard/QuickStatItem';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';

export default function Dashboard() {
  const { userProfile, stats, activities, topGame, loading } = useDashboard();

  if (!userProfile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{userProfile.username}</span>! 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's what's happening in your gaming world</p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-dark-400">
          <span className="inline-flex items-center gap-1">
            🏅 {userProfile.rank}
          </span>
          <span className="inline-flex items-center gap-1">
            ⭐ Level {userProfile.level}
          </span>
          <span className="inline-flex items-center gap-1">
            ✨ {userProfile.xp} XP
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats ?? null} isLoading={loading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2">
          <PerformanceTrendChart
            data={(stats?.weeklyPlaytime as number[]) || [0, 0, 0, 0, 0, 0, 0]}
            isLoading={loading}
          />
        </div>

        {/* Right Column - Top Game */}
        <div>
          <TopGameHighlight
            game={topGame}
            hoursThisWeek={Math.round(stats?.hoursThisWeek || 0)}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed activities={activities} isLoading={loading} />

        {/* Quick Stats */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickStatItem
              label="Games Owned"
              value={stats?.gamesOwned?.toString() ?? '-'}
              icon="🎮"
            />
            <QuickStatItem
              label="Achievements"
              value={stats?.achievementsUnlocked?.toString() ?? '-'}
              icon="🏆"
            />
            <QuickStatItem
              label="Current Streak"
              value={stats?.currentStreak?.toString() ?? '-'}
              icon="🔥"
            />
            <QuickStatItem
              label="Win Rate"
              value={stats ? `${Math.round((stats.winRate || 0) * 100)}%` : '-'}
              icon="📊"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
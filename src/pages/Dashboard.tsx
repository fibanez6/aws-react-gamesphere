import PerformanceTrendChart from '../components/dashboard/PerformanceTrendChart';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';
import { StatsGrid } from '../components/dashboard/StatsSummaryCard';
import TopGameHighlight from '../components/dashboard/TopGameHighlight';
import { useAuth } from '../context/AuthContext';
import { mockGames } from '../data/mockData';
import { useFriends } from '../hooks/useFriends';
import { useRecentActivities, useUserStats } from '../hooks/useUserStats';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats(user?.id || '');
  const { activities, isLoading: activitiesLoading } = useRecentActivities(user?.id || '', 5);
  const { onlineFriends } = useFriends();

  // Get the most played game this week (mock)
  const topGame = mockGames[0];
  const hoursThisWeek = stats?.weeklyPlaytime?.reduce((a, b) => a + b, 0) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{user?.username}</span>! 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's what's happening in your gaming world</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-dark-400">
          <span>Last updated:</span>
          <span className="text-white">Just now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={stats} isLoading={statsLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart */}
        <div className="lg:col-span-2">
          <PerformanceTrendChart
            data={stats?.weeklyPlaytime || [0, 0, 0, 0, 0, 0, 0]}
            isLoading={statsLoading}
          />
        </div>

        {/* Right Column - Top Game */}
        <div>
          <TopGameHighlight
            game={topGame}
            hoursThisWeek={Math.round(hoursThisWeek)}
            isLoading={statsLoading}
          />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityFeed activities={activities} isLoading={activitiesLoading} />

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
              label="Friends Online"
              value={onlineFriends.length.toString()}
              icon="👥"
              isLive
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

interface QuickStatItemProps {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  isLive?: boolean;
}

function QuickStatItem({ label, value, icon, trend, isLive }: QuickStatItemProps) {
  return (
    <div className="bg-dark-700/30 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        {isLive && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="online-indicator scale-75" />
            Live
          </span>
        )}
        {trend && !isLive && (
          <span className="text-xs text-green-400">{trend}</span>
        )}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs text-dark-400">{label}</p>
    </div>
  );
}

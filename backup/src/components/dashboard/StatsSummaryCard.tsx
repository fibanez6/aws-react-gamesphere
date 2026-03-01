import { clsx } from 'clsx';
import Skeleton from '../common/Skeleton';

interface StatsSummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning';
  isLoading?: boolean;
}

export default function StatsSummaryCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  isLoading = false,
}: StatsSummaryCardProps) {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/30',
    accent: 'from-accent-500/20 to-accent-600/10 border-accent-500/30',
    success: 'from-green-500/20 to-green-600/10 border-green-500/30',
    warning: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
  };

  const iconColorClasses = {
    primary: 'bg-primary-500/20 text-primary-400',
    accent: 'bg-accent-500/20 text-accent-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1">
            <Skeleton width="60%" className="mb-2" />
            <Skeleton width="40%" height={28} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border p-6 bg-gradient-to-br',
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-400 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={clsx(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-dark-500">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            iconColorClasses[color]
          )}
        >
          {icon}
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
    </div>
  );
}

// Stats Grid Component
interface StatsGridProps {
  stats: {
    totalHoursPlayed: number;
    gamesOwned: number;
    achievementsUnlocked: number;
    winRate: number;
  } | null;
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsSummaryCard
        title="Total Hours Played"
        value={stats?.totalHoursPlayed.toLocaleString() ?? 0}
        icon={<ClockIcon className="w-6 h-6" />}
        trend={{ value: 12, isPositive: true }}
        color="primary"
        isLoading={isLoading}
      />
      <StatsSummaryCard
        title="Games Owned"
        value={stats?.gamesOwned ?? 0}
        icon={<GameIcon className="w-6 h-6" />}
        trend={{ value: 3, isPositive: true }}
        color="accent"
        isLoading={isLoading}
      />
      <StatsSummaryCard
        title="Achievements"
        value={stats?.achievementsUnlocked ?? 0}
        icon={<TrophyIcon className="w-6 h-6" />}
        trend={{ value: 8, isPositive: true }}
        color="success"
        isLoading={isLoading}
      />
      <StatsSummaryCard
        title="Win Rate"
        value={`${Math.round((stats?.winRate ?? 0) * 100)}%`}
        icon={<ChartIcon className="w-6 h-6" />}
        trend={{ value: 2, isPositive: true }}
        color="warning"
        isLoading={isLoading}
      />
    </div>
  );
}

// Icon Components
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

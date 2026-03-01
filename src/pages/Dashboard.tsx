import { debugLog } from '@/config/environment';
import { useUser } from '../context/UserContext';
import { StatsGrid } from '../components/dashboard/StatsSummaryCard';
import PerformanceTrendChart from '../components/dashboard/PerformanceTrendChart';
import TopGameHighlight from '../components/dashboard/TopGameHighlight';
import QuickStatItem from '../components/dashboard/QuickStatItem';
import RecentActivityFeed from '../components/dashboard/RecentActivityFeed';

// TODO: Replace with real data fetching logic
const stats = {
  totalHoursPlayed: 128,
  gamesOwned: 85,
  achievementsUnlocked: 12,
  winRate: 66.4,
  weeklyPlaytime: [5, 8, 12, 10, 15, 20, 18],
  topGame: {
    id: '1',
    name: 'Elden Ring',
    coverImage: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8i.jpg',
    genre: 'Action RPG',
    platform: ['PC', 'PS5', 'Xbox Series X'],
    activePlayers: 500000,
    avgPlaytime: 50,
    rating: 9.5,
    description: 'A sprawling open-world action RPG from FromSoftware.',
    releaseDate: '2022-02-25',  
  },
  hoursThisWeek: 20,
};

const activities = [
  {
    id: '1',
    type: 'game_played',
    userId: 'user1',
    username: 'GamerGal92',
    avatar: 'https://api.example.com/avatar/gamerGal92.jpg',
    title: 'Played Elden Ring',
    description: 'Defeated Malenia, Blade of Miquella',
    gameId: '1',
    gameName: 'Elden Ring',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8i.jpg',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'achievement_unlocked',
    userId: 'user2',
    username: 'PixelWarrior',
    avatar: 'https://api.example.com/avatar/pixelWarrior.jpg',
    title: 'Unlocked Achievement',
    description: 'Speedrunner - Completed in under 2 hours',
    gameId: '2',
    gameName: 'Cyberpunk 2077',
    gameCover: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2fyd.jpg',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'level_up',
    userId: 'user3',
    username: 'ArcadeAce',
    avatar: 'https://api.example.com/avatar/arcadeAce.jpg',
    title: 'Reached Level 25',
    description: 'Keep grinding to unlock new rewards!',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

const onlineFriends = [
  { id: '1', username: 'GamerGal92' },
  { id: '2', username: 'PixelWarrior' },
  { id: '3', username: 'ArcadeAce' },
];

export default function Dashboard() {
  const { userProfile, loading } = useUser();

  if (!userProfile) return null;

  debugLog('Rendering Dashboard for user:', userProfile);

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
            data={stats?.weeklyPlaytime || [0, 0, 0, 0, 0, 0, 0]}
            isLoading={loading}
          />
        </div>

        {/* Right Column - Top Game */}
        <div>
          <TopGameHighlight
            game={stats?.topGame}
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
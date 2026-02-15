import { useParams } from 'react-router-dom';
import AchievementGrid from '../components/profile/AchievementGrid';
import GameStatsTable from '../components/profile/GameStatsTable';
import PlayerInfo from '../components/profile/PlayerInfo';
import { useAuth } from '../context/AuthContext';
import { usePlayerProfile } from '../hooks/usePlayerProfile';

export default function Profile() {
  const { playerId } = useParams<{ playerId?: string }>();
  const { user } = useAuth();
  const effectivePlayerId = playerId || user?.id;
  const { profile, isLoading } = usePlayerProfile(effectivePlayerId);

  const isOwnProfile = !playerId || playerId === user?.id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isOwnProfile ? 'My Profile' : 'Player Profile'}
        </h1>
        <p className="text-dark-400 mt-1">
          {isOwnProfile
            ? 'View and manage your gaming profile'
            : `Viewing ${profile?.user?.username || 'player'}'s profile`}
        </p>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Player Info */}
        <div className="lg:col-span-1">
          <PlayerInfo
            user={profile?.user || null}
            isLoading={isLoading}
            isOwnProfile={isOwnProfile}
          />

          {/* Stats Summary */}
          {!isLoading && profile?.stats && (
            <div className="card mt-6">
              <h4 className="font-semibold mb-4">Statistics</h4>
              <div className="space-y-3">
                <StatRow
                  label="Total Hours"
                  value={`${(profile.stats.totalHoursPlayed ?? 0).toLocaleString()}h`}
                />
                <StatRow
                  label="Games Owned"
                  value={(profile.stats.gamesOwned ?? 0).toString()}
                />
                <StatRow
                  label="Win Rate"
                  value={`${Math.round((profile.stats.winRate ?? 0) * 100)}%`}
                />
                <StatRow
                  label="Total Wins"
                  value={(profile.stats.totalWins ?? 0).toLocaleString()}
                />
                <StatRow
                  label="Total Matches"
                  value={(profile.stats.totalMatches ?? 0).toLocaleString()}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Game Stats Table */}
          <GameStatsTable
            gameStats={profile?.gameStats || []}
            isLoading={isLoading}
          />

          {/* Achievement Grid */}
          <AchievementGrid
            achievements={profile?.achievements || []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dark-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

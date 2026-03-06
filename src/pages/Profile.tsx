import useProfile from '@/hooks/useProfile';
import { useParams } from 'react-router-dom';
import AchievementGrid from '../components/profile/AchievementGrid';
import GameStatsTable from '../components/profile/GameStatsTable';
import PlayerInfo from '../components/profile/PlayerInfo';
import StatRow from '../components/profile/StatRow';
import { debugLog } from '../config/environment';
import { useUser } from '../context/UserContext';

export default function Profile() {
    const { playerId } = useParams<{ playerId?: string }>();
    const { userProfile: loggedInUser } = useUser();
    
    const { userProfile, playerStats, gameStats, achievements, loading } = useProfile(playerId);
    
    const isOwnProfile = !playerId || playerId === loggedInUser?.id;
    
    debugLog('Rendering Profile page for playerId:', playerId, 'isOwnProfile:', isOwnProfile);

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
            : `Viewing ${userProfile?.username || 'player'}'s profile`}
        </p>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Player Info */}
        <div className="lg:col-span-1">
          <PlayerInfo
            user={userProfile || null}
            isLoading={loading}
            isOwnProfile={isOwnProfile}
          />

          {/* Stats Summary */}
          {!loading && userProfile?.stats && (
            <div className="card mt-6">
              <h4 className="font-semibold mb-4">Statistics</h4>
              <div className="space-y-3">
                <StatRow
                  label="Total Hours"
                  value={`${(playerStats?.totalHoursPlayed ?? 0).toLocaleString()}h`}
                />
                <StatRow
                  label="Games Owned"
                  value={(playerStats?.gamesOwned ?? 0).toString()}
                />
                <StatRow
                  label="Win Rate"
                  value={`${Math.round((playerStats?.winRate ?? 0) * 100)}%`}
                />
                <StatRow
                  label="Total Wins"
                  value={(playerStats?.totalWins ?? 0).toLocaleString()}
                />
                <StatRow
                  label="Total Matches"
                  value={(playerStats?.totalMatches ?? 0).toLocaleString()}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Game Stats Table */}
          <GameStatsTable
            gameStats={gameStats || []}
            isLoading={loading}
          />

          {/* Achievement Grid */}
          <AchievementGrid
            achievements={achievements || []}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
    );
}
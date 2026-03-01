import LiveSessionBanner, { CurrentlyPlayingList } from '../components/live/LiveSessionBanner';
import { mockGames } from '../data/mockData';
import { useLiveSessions } from '../hooks/useLiveSessions';

export default function LiveSessions() {
  const { sessions, isLoading } = useLiveSessions(true);

  // Group sessions by game
  const sessionsByGame = sessions.reduce((acc, session) => {
    if (!acc[session.gameName]) {
      acc[session.gameName] = [];
    }
    acc[session.gameName].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Live Sessions</h1>
        <p className="text-dark-400 mt-1">
          See who's playing right now and join the action
        </p>
      </div>

      {/* Live Banner */}
      <LiveSessionBanner sessions={sessions} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-2">
          <CurrentlyPlayingList sessions={sessions} isLoading={isLoading} />

          {/* Sessions by Game */}
          {!isLoading && Object.keys(sessionsByGame).length > 0 && (
            <div className="card mt-6">
              <h3 className="text-lg font-semibold mb-4">Sessions by Game</h3>
              <div className="space-y-4">
                {Object.entries(sessionsByGame).map(([gameName, gameSessions]) => (
                  <div
                    key={gameName}
                    className="p-4 bg-dark-700/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{gameName}</h4>
                      <span className="text-sm text-green-400">
                        {gameSessions.length} playing
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {gameSessions.map((session) => (
                        <img
                          key={session.id}
                          src={session.avatar}
                          alt={session.username}
                          title={session.username}
                          className="w-10 h-10 rounded-full ring-2 ring-dark-800"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Popular Games Right Now */}
          <div className="card">
            <h4 className="font-semibold mb-4">🔥 Hot Right Now</h4>
            <div className="space-y-3">
              {mockGames.slice(0, 5).map((game, index) => (
                <div
                  key={game.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-700/30 transition-colors"
                >
                  <span className="text-lg text-dark-500 w-6">#{index + 1}</span>
                  <img
                    src={game.coverImage}
                    alt={game.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{game.name}</p>
                    <p className="text-xs text-green-400">
                      {game.activePlayers.toLocaleString()} playing
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h4 className="font-semibold mb-4">Quick Actions</h4>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                <PlayIcon className="w-5 h-5" />
                Start Gaming Session
              </button>
              <button className="btn-secondary w-full">
                <UsersIcon className="w-5 h-5" />
                Invite Friends
              </button>
            </div>
          </div>

          {/* Session Tips */}
          <div className="card bg-gradient-to-br from-accent-900/20 to-primary-900/20 border-accent-500/30">
            <h4 className="font-semibold mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-dark-300">
              Start a game session to let your friends know you're online and
              playing. They can join you directly from this page!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

import { clsx } from 'clsx';
import { useSessionTimer } from '../../hooks/useLiveSessions';
import { GameSession } from '../../types';
import Avatar from '../common/Avatar';

interface LiveSessionBannerProps {
  sessions: GameSession[];
}

export default function LiveSessionBanner({ sessions }: LiveSessionBannerProps) {
  const liveCount = sessions.filter(s => s.isActive).length;

  if (liveCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-primary-900/30 border border-green-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="font-semibold text-green-400">LIVE</span>
          </div>
          <span className="text-dark-300">
            {liveCount} friend{liveCount !== 1 ? 's' : ''} playing right now
          </span>
        </div>

        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {sessions.slice(0, 5).map((session) => (
            <Avatar
              key={session.id}
              src={session.avatar}
              alt={session.username}
              size="sm"
            />
          ))}
          {sessions.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium ring-2 ring-dark-800">
              +{sessions.length - 5}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Currently Playing List Component
interface CurrentlyPlayingListProps {
  sessions: GameSession[];
  isLoading: boolean;
}

export function CurrentlyPlayingList({ sessions, isLoading }: CurrentlyPlayingListProps) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Currently Playing</h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-dark-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-dark-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-dark-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Currently Playing</h3>
        <p className="text-dark-400 text-center py-8">No friends playing right now</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Currently Playing</h3>
        <span className="text-sm text-green-400">
          {sessions.length} live
        </span>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: GameSession }) {
  const duration = useSessionTimer(session.startTime);

  return (
    <div className="flex items-center gap-4 p-3 bg-dark-700/30 rounded-lg hover:bg-dark-700/50 transition-colors">
      {/* Game Image */}
      <img
        src={session.gameCover}
        alt={session.gameName}
        className="w-16 h-16 rounded-lg object-cover"
      />

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Avatar
            src={session.avatar}
            alt={session.username}
            size="xs"
            isOnline
            showStatus
          />
          <span className="font-medium truncate">{session.username}</span>
        </div>
        <p className="text-sm text-primary-400 truncate">{session.gameName}</p>
      </div>

      {/* Duration */}
      <div className="text-right flex-shrink-0">
        <SessionTimer duration={duration} />
        <div className="flex items-center gap-1 justify-end mt-1">
          <span className="online-indicator scale-75" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>
    </div>
  );
}

function SessionTimer({ duration }: { duration: number }) {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <div className={clsx(
      'font-mono text-lg font-semibold',
      duration >= 120 ? 'text-red-400' : duration >= 60 ? 'text-yellow-400' : 'text-green-400'
    )}>
      {hours > 0 && `${hours}h `}{minutes}m
    </div>
  );
}

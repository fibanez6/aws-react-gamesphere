import { debugLog } from '@/config/environment';
import { useUser } from '../context/UserContext';

export default function Dashboard() {
  const { userProfile } = useUser();

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
    </div>
  );
}
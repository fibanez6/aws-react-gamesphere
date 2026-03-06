import { clsx } from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FriendCard, { FriendCardSkeleton } from '../components/friends/FriendCard';
import useFriends from '../hooks/useFriends';

type Tab = 'accepted' | 'pending' | 'declined';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'accepted', label: 'Friends', icon: '👥' },
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'declined', label: 'Declined', icon: '🚫' },
];

export default function Friends() {
  const { accepted, pending, declined, loading, error, refresh, removeFriend, isRemoving } = useFriends();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('accepted');

  const lists: Record<Tab, typeof accepted> = { accepted, pending, declined };
  const currentList = lists[activeTab];

  const counts: Record<Tab, number> = {
    accepted: accepted.length,
    pending: pending.length,
    declined: declined.length,
  };

  const handleViewProfile = (friendId: string) => {
    navigate(`/profile/${friendId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Friends <span className="text-dark-400 text-xl font-normal">({accepted.length})</span>
          </h1>
          <p className="text-dark-400 mt-1">Manage your friends list and stay connected</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <RefreshIcon className={clsx('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800/50 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-dark-700 text-white shadow-sm'
                : 'text-dark-400 hover:text-white hover:bg-dark-700/50',
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={clsx(
                  'min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5',
                  activeTab === tab.key
                    ? 'bg-primary-500/30 text-primary-300'
                    : 'bg-dark-600 text-dark-300',
                )}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Friend Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <FriendCardSkeleton key={i} />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <TabState tab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentList.map((friend) => (
            <FriendCard
              key={friend.friendshipId}
              friend={friend}
              onRemove={removeFriend}
              onViewProfile={handleViewProfile}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { icon: string; title: string; description: string }> = {
    accepted: {
      icon: '👥',
      title: 'No friends yet',
      description: 'Start connecting with other players to grow your friends list.',
    },
    pending: {
      icon: '⏳',
      title: 'No pending requests',
      description: 'All friend requests have been handled.',
    },
    declined: {
      icon: '✅',
      title: 'Nothing here',
      description: 'No declined requests to show.',
    },
  };

  const msg = messages[tab];

  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{msg.icon}</span>
      <h3 className="text-lg font-semibold text-white mb-1">{msg.title}</h3>
      <p className="text-dark-400 text-sm max-w-sm">{msg.description}</p>
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
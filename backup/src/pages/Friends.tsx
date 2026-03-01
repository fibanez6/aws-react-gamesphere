import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddFriendModal from '../components/friends/AddFriendModal';
import FriendActivityStream from '../components/friends/FriendActivityStream';
import FriendCard from '../components/friends/FriendCard';
import FriendsList from '../components/friends/FriendsList';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { useRecentActivities } from '../hooks/useUserStats';
import { Friend } from '../types';

export default function Friends() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, isLoading, onlineFriends, addFriend, removeFriend } = useFriends();
  const { activities, isLoading: activitiesLoading } = useRecentActivities(user?.id || '', 10);

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const handleViewProfile = (friend: Friend) => {
    navigate(`/profile/${friend.id}`);
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      await removeFriend(friendId);
      if (selectedFriend?.id === friendId) {
        setSelectedFriend(null);
      }
    }
  };

  const handleAddFriend = useCallback(async (username: string) => {
    await addFriend(username);
  }, [addFriend]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Friends & Social Hub</h1>
          <p className="text-dark-400 mt-1">
            Connect with friends and see what they're playing
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-dark-700 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-dark-700 text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setIsAddFriendModalOpen(true)}
            className="btn-primary"
          >
            <UserPlusIcon className="w-5 h-5" />
            Add Friend
          </button>
        </div>
      </div>

      {/* Online Friends Banner */}
      {onlineFriends.length > 0 && (
        <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="online-indicator" />
              <span className="text-green-400 font-medium">
                {onlineFriends.length} friends online
              </span>
            </div>
            <div className="flex -space-x-2">
              {onlineFriends.slice(0, 5).map((friend) => (
                <img
                  key={friend.id}
                  src={friend.avatar}
                  alt={friend.username}
                  className="w-8 h-8 rounded-full ring-2 ring-dark-800"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends List/Grid */}
        <div className="lg:col-span-2">
          {viewMode === 'list' ? (
            <FriendsList
              friends={friends}
              isLoading={isLoading}
              onSelectFriend={setSelectedFriend}
            />
          ) : (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">
                All Friends ({friends.length})
              </h3>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-dark-700 rounded-xl h-48" />
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-dark-400 mb-4">No friends yet</p>
                  <button
                    onClick={() => setIsAddFriendModalOpen(true)}
                    className="btn-primary"
                  >
                    Add Your First Friend
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onViewProfile={() => handleViewProfile(friend)}
                      onRemoveFriend={() => handleRemoveFriend(friend.id)}
                      onSendMessage={() => console.log('Message', friend.username)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Stream */}
        <div className="lg:col-span-1">
          <FriendActivityStream
            activities={activities}
            isLoading={activitiesLoading}
          />
        </div>
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onAddFriend={handleAddFriend}
      />
    </div>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

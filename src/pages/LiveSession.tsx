import useFriends from '@/hooks/useFriends';
import useLiveSession, { type ChatMessageView, type ChatRoomView, type LiveSessionView } from '@/hooks/useLiveSession';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '../context/UserContext';

export default function LiveSession() {
  const { userProfile } = useUser();
  const userId = userProfile?.id;

  const {
    friendSessions,
    mySession,
    sessionsLoading,
    startSession,
    isStarting,
    endSession,
    isEnding,
    joinSession,
    isJoining,
    chatRooms,
    activeChatRoomId,
    setActiveChatRoomId,
    messages,
    messagesLoading,
    sendMessage,
    isSending,
    createDirectChat,
    notifiedRoomIds,
    gameOptions,
  } = useLiveSession();

  const { accepted: friends } = useFriends();

  const [showStartModal, setShowStartModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const totalNotifications = notifiedRoomIds.size;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live Sessions</h1>
          <p className="text-dark-400 mt-1">See who's playing and join the action</p>
        </div>
        <div className="flex gap-2">
          {!mySession ? (
            <button
              onClick={() => setShowStartModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <span>🎮</span> Start Session
            </button>
          ) : (
            <button
              onClick={() => endSession(mySession.id)}
              disabled={isEnding}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              {isEnding ? 'Ending…' : '⏹ End My Session'}
            </button>
          )}
        </div>
      </div>

      {/* My active session banner */}
      {mySession && (
        <div className="card border border-primary-500/30 !bg-primary-500/5">
          <div className="flex items-center gap-4">
            {mySession.gameCover && (
              <img src={mySession.gameCover} alt={mySession.gameName} className="w-16 h-20 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <span className="text-sm text-green-400 font-medium">Your session is live</span>
              </div>
              <h3 className="text-lg font-bold mt-1">{mySession.title || mySession.gameName}</h3>
              <p className="text-dark-400 text-sm">{mySession.gameName} · {mySession.currentPlayers}/{mySession.maxPlayers} players · Started {formatTimeAgo(mySession.startedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main layout: sessions + chat side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Friend Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Friends Playing Now</h2>
          {sessionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse h-24" />
              ))}
            </div>
          ) : friendSessions.length === 0 ? (
            <div className="card text-center py-12">
              <span className="text-4xl block mb-3">😴</span>
              <h3 className="font-semibold mb-1">No friends online</h3>
              <p className="text-dark-400 text-sm">Start a session to let your friends know you're playing!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  userId={userId!}
                  onJoin={() => joinSession(session)}
                  isJoining={isJoining}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Chat Panel */}
        <div className="lg:col-span-1">
          <div className="card !p-0 overflow-hidden h-[600px] flex flex-col">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Chat</h3>
                {totalNotifications > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalNotifications}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {activeChatRoomId && (
                  <button
                    onClick={() => setActiveChatRoomId(null)}
                    className="text-xs text-dark-400 hover:text-dark-200 px-2 py-1 rounded hover:bg-dark-700"
                  >
                    ← Rooms
                  </button>
                )}
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="text-xs text-primary-400 hover:text-primary-300 px-2 py-1 rounded hover:bg-dark-700"
                >
                  + New
                </button>
              </div>
            </div>

            {/* Chat content */}
            {!activeChatRoomId ? (
              <ChatRoomList
                rooms={chatRooms}
                userId={userId!}
                onSelect={(id) => setActiveChatRoomId(id)}
                notifiedRoomIds={notifiedRoomIds}
              />
            ) : (
              <ChatPanel
                messages={messages}
                loading={messagesLoading}
                userId={userId!}
                onSend={(body) => sendMessage({ chatRoomId: activeChatRoomId, body })}
                isSending={isSending}
              />
            )}
          </div>
        </div>
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <StartSessionModal
          gameOptions={gameOptions}
          isStarting={isStarting}
          onStart={async (params) => {
            await startSession(params);
            setShowStartModal(false);
          }}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          friends={friends}
          onCreateChat={async (friendId) => {
            await createDirectChat(friendId);
            setShowNewChatModal(false);
          }}
          onClose={() => setShowNewChatModal(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SessionCard({
  session,
  userId,
  onJoin,
  isJoining,
}: {
  session: LiveSessionView;
  userId: string;
  onJoin: () => void;
  isJoining: boolean;
}) {
  const alreadyJoined = session.participantIds.includes(userId);
  const isFull = session.currentPlayers >= session.maxPlayers;

  return (
    <div className="card flex items-center gap-4 hover:bg-dark-700/30 transition-colors">
      {session.gameCover && (
        <img
          src={session.gameCover}
          alt={session.gameName}
          className="w-14 h-18 rounded-lg object-cover hidden sm:block"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <img src={session.hostAvatar} alt={session.hostUsername} className="w-6 h-6 rounded-full" />
          <span className="font-medium text-sm truncate">{session.hostUsername}</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
        <h4 className="font-semibold truncate">{session.title || session.gameName}</h4>
        <div className="flex items-center gap-3 text-xs text-dark-400 mt-1">
          <span>🎮 {session.gameName}</span>
          <span>👥 {session.currentPlayers}/{session.maxPlayers}</span>
          <span>⏱ {formatTimeAgo(session.startedAt)}</span>
        </div>
      </div>
      <div>
        {alreadyJoined ? (
          <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">Joined</span>
        ) : isFull ? (
          <span className="text-xs text-dark-500 bg-dark-700 px-3 py-1.5 rounded-lg">Full</span>
        ) : (
          <button
            onClick={onJoin}
            disabled={isJoining}
            className="text-xs font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isJoining ? 'Joining…' : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
}

function ChatRoomList({
  rooms,
  userId,
  onSelect,
  notifiedRoomIds,
}: {
  rooms: ChatRoomView[];
  userId: string;
  onSelect: (id: string) => void;
  notifiedRoomIds: Set<string>;
}) {
  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-dark-400 text-sm px-4 text-center">
        <div>
          <span className="text-3xl block mb-2">💬</span>
          <p>No chats yet. Start a new chat with a friend!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {rooms.map((room) => {
        const otherParticipants = room.participants.filter((p) => p.id !== userId);
        const displayName = room.name || otherParticipants.map((p) => p.username).join(', ') || 'Chat';
        const hasNotification = notifiedRoomIds.has(room.id);

        return (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className="w-full text-left px-4 py-3 hover:bg-dark-700/50 transition-colors border-b border-dark-700/50 flex items-center gap-3"
          >
            <div className="relative">
              {otherParticipants[0] ? (
                <img src={otherParticipants[0].avatar} alt="" className="w-9 h-9 rounded-full bg-dark-600" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-dark-600 flex items-center justify-center text-sm">💬</div>
              )}
              {hasNotification && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-800" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-dark-400 truncate">{room.lastMessagePreview || 'No messages yet'}</p>
            </div>
            {room.lastMessageAt && (
              <span className="text-[10px] text-dark-500 shrink-0">
                {formatTimeAgo(room.lastMessageAt)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ChatPanel({
  messages,
  loading,
  userId,
  onSend,
  isSending,
}: {
  messages: ChatMessageView[];
  loading: boolean;
  userId: string;
  onSend: (body: string) => void;
  isSending: boolean;
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-dark-400 text-sm py-8">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-dark-400 text-sm py-8">No messages yet. Say hello! 👋</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userId;
            const isSystem = msg.messageType === 'SYSTEM' || msg.messageType === 'JOIN' || msg.messageType === 'LEAVE';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center">
                  <span className="text-[11px] text-dark-500 bg-dark-700/50 px-2 py-0.5 rounded-full">{msg.body}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <img src={msg.senderAvatar ?? ''} alt="" className="w-7 h-7 rounded-full bg-dark-600 shrink-0 mt-1" />
                )}
                <div className={`max-w-[75%] ${isMe ? 'ml-auto' : ''}`}>
                  {!isMe && <p className="text-[10px] text-dark-500 mb-0.5">{msg.senderUsername}</p>}
                  <div
                    className={`px-3 py-1.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-primary-500 text-white rounded-br-md'
                        : 'bg-dark-700 text-dark-200 rounded-bl-md'
                    }`}
                  >
                    {msg.body}
                  </div>
                  <p className="text-[9px] text-dark-600 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-dark-700 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 bg-dark-700 border border-dark-600 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-dark-200 placeholder-dark-500"
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          className="bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors text-sm shrink-0"
        >
          ↑
        </button>
      </form>
    </>
  );
}

function StartSessionModal({
  gameOptions,
  isStarting,
  onStart,
  onClose,
}: {
  gameOptions: { id: string; name: string; coverImage: string }[];
  isStarting: boolean;
  onStart: (params: { gameId: string; gameName: string; gameCover: string; title: string; maxPlayers: number }) => void;
  onClose: () => void;
}) {
  const [gameId, setGameId] = useState('');
  const [title, setTitle] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  const selectedGame = gameOptions.find((g) => g.id === gameId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;
    onStart({
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      gameCover: selectedGame.coverImage,
      title: title || `Playing ${selectedGame.name}`,
      maxPlayers,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Start a Live Session</h2>
        <p className="text-dark-400 text-sm mb-6">Let your friends know you're playing and invite them to join!</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Game</label>
            <select
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              required
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select a game…</option>
              {gameOptions.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Session Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ranked grind, casual fun…"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Max Players</label>
            <div className="flex gap-2">
              {[2, 4, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPlayers(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    maxPlayers === n ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStarting || !gameId}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isStarting ? 'Starting…' : '🎮 Go Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewChatModal({
  friends,
  onCreateChat,
  onClose,
}: {
  friends: { friendId: string; username: string; avatar: string }[];
  onCreateChat: (friendId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">New Chat</h2>
        <p className="text-dark-400 text-sm mb-4">Choose a friend to start chatting with</p>

        {friends.length === 0 ? (
          <p className="text-dark-500 text-sm text-center py-4">No friends available</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {friends.map((f) => (
              <button
                key={f.friendId}
                onClick={() => onCreateChat(f.friendId)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors text-left"
              >
                <img src={f.avatar} alt={f.username} className="w-8 h-8 rounded-full bg-dark-600" />
                <span className="text-sm font-medium">{f.username}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
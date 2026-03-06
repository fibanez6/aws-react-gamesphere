import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dataClient } from '../config/amplifyClient';
import { debugLog } from '../config/environment';
import { useUser } from '../context/UserContext';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LiveSessionView {
  id: string;
  hostId: string;
  hostUsername: string;
  hostAvatar: string;
  hostLevel: number;
  gameId: string;
  gameName: string;
  gameCover: string | null;
  title: string | null;
  sessionStatus: string;
  maxPlayers: number;
  currentPlayers: number;
  startedAt: string;
  participantIds: string[];
}

export interface ChatMessageView {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string | null;
  body: string;
  messageType: string;
  createdAt: string;
}

export interface ChatRoomView {
  id: string;
  name: string | null;
  sessionId: string | null;
  participantIds: string[];
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  // Resolved participant info
  participants: { id: string; username: string; avatar: string }[];
  unreadCount: number;
}

export interface GameOption {
  id: string;
  name: string;
  coverImage: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchFriendIds(userId: string): Promise<Set<string>> {
  const [{ data: asReq }, { data: asAddr }] = await Promise.all([
    dataClient.models.Friendship.list({ filter: { requesterId: { eq: userId }, status: { eq: 'ACCEPTED' } } }),
    dataClient.models.Friendship.list({ filter: { addresseeId: { eq: userId }, status: { eq: 'ACCEPTED' } } }),
  ]);
  const ids = new Set<string>();
  for (const f of asReq ?? []) ids.add(f.addresseeId);
  for (const f of asAddr ?? []) ids.add(f.requesterId);
  return ids;
}

async function resolveUser(uid: string) {
  const { data } = await dataClient.models.User.get({ id: uid });
  return {
    id: uid,
    username: data?.username ?? 'Unknown',
    avatar: data?.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${uid}`,
    level: data?.level ?? 0,
  };
}

// ── Friend sessions ────────────────────────────────────────────────────────

async function fetchFriendSessions(userId: string): Promise<LiveSessionView[]> {
  const friendIds = await fetchFriendIds(userId);
  if (friendIds.size === 0) return [];

  // Fetch all active sessions
  const { data: sessions, errors } = await dataClient.models.LiveSession.list({
    filter: { sessionStatus: { eq: 'ACTIVE' } },
  });
  if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

  // Filter to friend-hosted sessions only
  const friendSessions = (sessions ?? []).filter((s) => friendIds.has(s.hostId));

  // Resolve hosts in parallel
  const hostIds = [...new Set(friendSessions.map((s) => s.hostId))];
  const hostResults = await Promise.all(hostIds.map(resolveUser));
  const hostMap = new Map(hostResults.map((h) => [h.id, h]));

  const views: LiveSessionView[] = friendSessions.map((s) => {
    const host = hostMap.get(s.hostId)!;
    return {
      id: s.id,
      hostId: s.hostId,
      hostUsername: host.username,
      hostAvatar: host.avatar,
      hostLevel: host.level,
      gameId: s.gameId,
      gameName: s.gameName,
      gameCover: s.gameCover ?? null,
      title: s.title ?? null,
      sessionStatus: s.sessionStatus ?? 'ACTIVE',
      maxPlayers: s.maxPlayers,
      currentPlayers: s.currentPlayers,
      startedAt: s.startedAt,
      participantIds: (s.participantIds ?? []) as string[],
    };
  });

  debugLog('Friend sessions fetched:', { count: views.length });
  return views.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

// ── My session ─────────────────────────────────────────────────────────────

async function fetchMySession(userId: string): Promise<LiveSessionView | null> {
  const { data: sessions } = await dataClient.models.LiveSession.list({
    filter: { hostId: { eq: userId }, sessionStatus: { eq: 'ACTIVE' } },
  });
  const s = sessions?.[0];
  if (!s) return null;

  const host = await resolveUser(userId);
  return {
    id: s.id,
    hostId: s.hostId,
    hostUsername: host.username,
    hostAvatar: host.avatar,
    hostLevel: host.level,
    gameId: s.gameId,
    gameName: s.gameName,
    gameCover: s.gameCover ?? null,
    title: s.title ?? null,
    sessionStatus: s.sessionStatus ?? 'ACTIVE',
    maxPlayers: s.maxPlayers,
    currentPlayers: s.currentPlayers,
    startedAt: s.startedAt,
    participantIds: (s.participantIds ?? []) as string[],
  };
}

// ── Chat rooms ─────────────────────────────────────────────────────────────

async function fetchChatRooms(userId: string): Promise<ChatRoomView[]> {
  // Fetch all chat rooms — filter client-side by participantIds containing userId
  const { data: rooms } = await dataClient.models.ChatRoom.list();
  const myRooms = (rooms ?? []).filter((r) =>
    ((r.participantIds ?? []) as string[]).includes(userId),
  );

  // Resolve participants
  const allParticipantIds = new Set<string>();
  for (const r of myRooms) {
    for (const pid of (r.participantIds ?? []) as string[]) allParticipantIds.add(pid);
  }
  const resolvedUsers = await Promise.all([...allParticipantIds].map(resolveUser));
  const userMap = new Map(resolvedUsers.map((u) => [u.id, u]));

  return myRooms.map((r) => ({
    id: r.id,
    name: r.name ?? null,
    sessionId: r.sessionId ?? null,
    participantIds: (r.participantIds ?? []) as string[],
    lastMessageAt: r.lastMessageAt ?? null,
    lastMessagePreview: r.lastMessagePreview ?? null,
    participants: ((r.participantIds ?? []) as string[]).map((pid) => ({
      id: pid,
      username: userMap.get(pid)?.username ?? 'Unknown',
      avatar: userMap.get(pid)?.avatar ?? '',
    })),
    unreadCount: 0,
  })).sort((a, b) =>
    (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''),
  );
}

async function fetchMessages(chatRoomId: string): Promise<ChatMessageView[]> {
  const { data: msgs } = await dataClient.models.ChatMessage.list({
    filter: { chatRoomId: { eq: chatRoomId } },
  });
  return (msgs ?? [])
    .map((m) => ({
      id: m.id,
      chatRoomId: m.chatRoomId,
      senderId: m.senderId,
      senderUsername: m.senderUsername,
      senderAvatar: m.senderAvatar ?? null,
      body: m.body,
      messageType: m.messageType ?? 'TEXT',
      createdAt: m.createdAt,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function fetchGameOptions(): Promise<GameOption[]> {
  const { data: games } = await dataClient.models.Game.list();
  return (games ?? []).map((g) => ({ id: g.id, name: g.name, coverImage: g.coverImage })).sort((a, b) => a.name.localeCompare(b.name));
}

// ── Hook ───────────────────────────────────────────────────────────────────

export default function useLiveSession() {
  const { userProfile } = useUser();
  const userId = userProfile?.id;
  const qc = useQueryClient();

  // ── Queries ──

  const friendSessionsQuery = useQuery({
    queryKey: ['liveSessions', 'friends', userId],
    queryFn: () => fetchFriendSessions(userId!),
    enabled: !!userId,
    refetchInterval: 15_000,
  });

  const mySessionQuery = useQuery({
    queryKey: ['liveSessions', 'mine', userId],
    queryFn: () => fetchMySession(userId!),
    enabled: !!userId,
    refetchInterval: 10_000,
  });

  const chatRoomsQuery = useQuery({
    queryKey: ['chatRooms', userId],
    queryFn: () => fetchChatRooms(userId!),
    enabled: !!userId,
    refetchInterval: 10_000,
  });

  const gameOptionsQuery = useQuery({
    queryKey: ['gameOptions'],
    queryFn: fetchGameOptions,
  });

  // ── Active chat room ──

  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', activeChatRoomId],
    queryFn: () => fetchMessages(activeChatRoomId!),
    enabled: !!activeChatRoomId,
    refetchInterval: 3_000,
  });

  // ── Notification count ──
  const [notifiedRoomIds, setNotifiedRoomIds] = useState<Set<string>>(new Set());
  const prevMessagesRef = useRef<Map<string, number>>(new Map());

  // Track new messages for notification badges
  useEffect(() => {
    const rooms = chatRoomsQuery.data ?? [];
    const newNotifications = new Set(notifiedRoomIds);
    for (const room of rooms) {
      if (room.id === activeChatRoomId) continue; // don't notify active room
      const prevCount = prevMessagesRef.current.get(room.id) ?? 0;
      const lastMsgTime = room.lastMessageAt ?? '';
      if (lastMsgTime && prevCount > 0) {
        // Simple heuristic — if lastMessageAt changed, mark as unread
        newNotifications.add(room.id);
      }
    }
    setNotifiedRoomIds(newNotifications);
  }, [chatRoomsQuery.data, activeChatRoomId]);

  const clearNotification = useCallback((roomId: string) => {
    setNotifiedRoomIds((prev) => {
      const next = new Set(prev);
      next.delete(roomId);
      return next;
    });
  }, []);

  // ── Mutations ──

  const startSessionMutation = useMutation({
    mutationFn: async (params: { gameId: string; gameName: string; gameCover: string; title: string; maxPlayers: number }) => {
      const { data, errors } = await dataClient.models.LiveSession.create({
        hostId: userId!,
        gameId: params.gameId,
        gameName: params.gameName,
        gameCover: params.gameCover,
        title: params.title,
        maxPlayers: params.maxPlayers,
        currentPlayers: 1,
        sessionStatus: 'ACTIVE',
        startedAt: new Date().toISOString(),
        participantIds: [userId!],
      });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

      // Create a chat room for this session
      await dataClient.models.ChatRoom.create({
        name: params.title || `${params.gameName} session`,
        sessionId: data!.id,
        participantIds: [userId!],
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Session started!',
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liveSessions'] });
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { errors } = await dataClient.models.LiveSession.update({
        id: sessionId,
        sessionStatus: 'ENDED',
        endedAt: new Date().toISOString(),
      });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liveSessions'] });
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (session: LiveSessionView) => {
      const updatedParticipants = [...session.participantIds, userId!];
      const { errors } = await dataClient.models.LiveSession.update({
        id: session.id,
        currentPlayers: session.currentPlayers + 1,
        participantIds: updatedParticipants,
      });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

      // Find or create chat room for this session
      const { data: rooms } = await dataClient.models.ChatRoom.list({
        filter: { sessionId: { eq: session.id } },
      });
      const room = rooms?.[0];
      if (room) {
        const existingParticipants = (room.participantIds ?? []) as string[];
        if (!existingParticipants.includes(userId!)) {
          await dataClient.models.ChatRoom.update({
            id: room.id,
            participantIds: [...existingParticipants, userId!],
          });
        }
        // Send a system message
        await dataClient.models.ChatMessage.create({
          chatRoomId: room.id,
          senderId: userId!,
          senderUsername: userProfile?.username ?? 'Unknown',
          senderAvatar: userProfile?.avatar ?? null,
          body: `${userProfile?.username ?? 'Someone'} joined the session!`,
          messageType: 'JOIN',
        });
        await dataClient.models.ChatRoom.update({
          id: room.id,
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: `${userProfile?.username} joined`,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liveSessions'] });
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (params: { chatRoomId: string; body: string }) => {
      const { errors } = await dataClient.models.ChatMessage.create({
        chatRoomId: params.chatRoomId,
        senderId: userId!,
        senderUsername: userProfile?.username ?? 'Unknown',
        senderAvatar: userProfile?.avatar ?? null,
        body: params.body,
        messageType: 'TEXT',
      });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

      // Update the chat room preview
      await dataClient.models.ChatRoom.update({
        id: params.chatRoomId,
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: params.body.length > 50 ? params.body.slice(0, 50) + '…' : params.body,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatMessages', activeChatRoomId] });
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });

  const createDirectChatMutation = useMutation({
    mutationFn: async (friendId: string) => {
      // Check if a direct chat already exists
      const { data: existing } = await dataClient.models.ChatRoom.list();
      const directChat = (existing ?? []).find((r) => {
        const pids = (r.participantIds ?? []) as string[];
        return pids.length === 2 && pids.includes(userId!) && pids.includes(friendId) && !r.sessionId;
      });
      if (directChat) return directChat;

      const friend = await resolveUser(friendId);
      const { data, errors } = await dataClient.models.ChatRoom.create({
        name: null,
        sessionId: null,
        participantIds: [userId!, friendId],
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: 'Chat started',
      });
      if (errors?.length) throw new Error(errors.map((e) => e.message).join(', '));

      // Send a system message
      await dataClient.models.ChatMessage.create({
        chatRoomId: data!.id,
        senderId: userId!,
        senderUsername: userProfile?.username ?? 'Unknown',
        senderAvatar: userProfile?.avatar ?? null,
        body: `Started a chat with ${friend.username}`,
        messageType: 'SYSTEM',
      });

      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
      if (data) setActiveChatRoomId(data.id);
    },
  });

  return {
    // Sessions
    friendSessions: friendSessionsQuery.data ?? [],
    mySession: mySessionQuery.data ?? null,
    sessionsLoading: friendSessionsQuery.isFetching,
    sessionsError: friendSessionsQuery.error?.message ?? null,

    // Session actions
    startSession: startSessionMutation.mutateAsync,
    isStarting: startSessionMutation.isPending,
    endSession: endSessionMutation.mutateAsync,
    isEnding: endSessionMutation.isPending,
    joinSession: joinSessionMutation.mutateAsync,
    isJoining: joinSessionMutation.isPending,

    // Chat
    chatRooms: chatRoomsQuery.data ?? [],
    chatRoomsLoading: chatRoomsQuery.isFetching,
    activeChatRoomId,
    setActiveChatRoomId: (id: string | null) => {
      setActiveChatRoomId(id);
      if (id) clearNotification(id);
    },
    messages: messagesQuery.data ?? [],
    messagesLoading: messagesQuery.isFetching,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    createDirectChat: createDirectChatMutation.mutateAsync,
    notifiedRoomIds,

    // Game options
    gameOptions: gameOptionsQuery.data ?? [],

    // Refresh
    refreshSessions: async () => { await friendSessionsQuery.refetch(); },
    refreshChat: async () => {
      await chatRoomsQuery.refetch();
      if (activeChatRoomId) await messagesQuery.refetch();
    },
  };
}

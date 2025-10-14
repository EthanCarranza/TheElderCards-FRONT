import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import { apiFetch } from "../Components/api";

interface NotificationCounts {
  unreadCount: number;
  pendingCount: number;
}

interface UseRobustNotificationsReturn {
  unreadCount: number;
  pendingCount: number;
  connected: boolean;
  error: string | null;
  requestInitialCounts: () => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  incrementPendingCount: () => void;
  decrementPendingCount: () => void;
  onNewFriendRequest: (callback: (request: unknown) => void) => void;
  onFriendRequestResponse: (callback: (response: unknown) => void) => void;
  onNewMessage: (callback: (message: unknown) => void) => void;
  onFriendshipRemoved: (callback: (payload: unknown) => void) => void;
  onUserBlocked: (callback: (payload: unknown) => void) => void;
}

export const useRobustNotifications = (): UseRobustNotificationsReturn => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const requestInitialCounts = useCallback(async () => {
    if (!user?.token) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit("request_initial_counts");
    } else {
      try {
        const [unreadResponse, pendingResponse] = await Promise.all([
          apiFetch<{ count: number }>("/messages/unread-count", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          apiFetch<{ count: number }>("/friendships/pending", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        setUnreadCount(unreadResponse.data.count || 0);
        setPendingCount(pendingResponse.data.count || 0);
      } catch (error) {
        console.warn("Failed to fetch notification counts:", error);
      }
    }
  }, [user?.token]);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const incrementPendingCount = useCallback(() => {
    setPendingCount((prev) => prev + 1);
  }, []);

  const decrementPendingCount = useCallback(() => {
    setPendingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const newFriendRequestCallbackRef = useRef<((request: unknown) => void) | null>(null);
  const friendRequestResponseCallbackRef = useRef<((response: unknown) => void) | null>(null);
  const newMessageCallbackRef = useRef<((message: unknown) => void) | null>(null);
  const friendshipRemovedCallbackRef = useRef<((payload: unknown) => void) | null>(null);
  const userBlockedCallbackRef = useRef<((payload: unknown) => void) | null>(null);

  const onNewFriendRequest = useCallback((callback: (request: unknown) => void) => {
    newFriendRequestCallbackRef.current = callback;
  }, []);

  const onFriendRequestResponse = useCallback((callback: (response: unknown) => void) => {
    friendRequestResponseCallbackRef.current = callback;
  }, []);

  const onNewMessage = useCallback((callback: (message: unknown) => void) => {
    newMessageCallbackRef.current = callback;
  }, []);

  const onFriendshipRemoved = useCallback((callback: (payload: unknown) => void) => {
    friendshipRemovedCallbackRef.current = callback;
  }, []);

  const onUserBlocked = useCallback((callback: (payload: unknown) => void) => {
    userBlockedCallbackRef.current = callback;
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    
    setUsePolling(true);
    console.log("Starting notification polling...");
    
    pollingRef.current = window.setInterval(() => {
      requestInitialCounts();
    }, 15000); // Poll every 15 seconds
  }, [requestInitialCounts]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setUsePolling(false);
  }, []);

  useEffect(() => {
    if (!user?.token) {
      setUnreadCount(0);
      setPendingCount(0);
      setConnected(false);
      setError(null);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      stopPolling();
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    
    const socket = io(serverUrl, {
      auth: {
        token: user.token,
      },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 2,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected - real-time notifications enabled");
      setConnected(true);
      setError(null);
      stopPolling(); // Stop polling if socket connects
      socket.emit("request_initial_counts");
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Socket.IO disconnected: ${reason}`);
      setConnected(false);
      
      if (!usePolling) {
        startPolling();
      }
    });

    socket.on("connect_error", (err) => {
      console.warn(`⚠️ Socket.IO connection failed: ${err.message}`);
      setConnected(false);
      
      if (!usePolling) {
        console.log("🔄 Falling back to HTTP polling for notifications");
        startPolling();
      }
      
      if (!import.meta.env.PROD) {
        setError(`Socket connection failed: ${err.message}`);
      }
    });

    socket.on("notification_counts", (data: NotificationCounts) => {
      setUnreadCount(data.unreadCount);
      setPendingCount(data.pendingCount);
    });

    socket.on("unread_count_updated", (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    });

    socket.on("pending_requests_updated", (data: { pendingCount: number }) => {
      setPendingCount(data.pendingCount);
    });

    socket.on("new_message", (message) => {
      if (newMessageCallbackRef.current) {
        newMessageCallbackRef.current(message);
      }
    });

    socket.on("new_friend_request", (request) => {
      if (newFriendRequestCallbackRef.current) {
        newFriendRequestCallbackRef.current(request);
      }
    });

    socket.on("friend_request_response", (response) => {
      if (friendRequestResponseCallbackRef.current) {
        friendRequestResponseCallbackRef.current(response);
      }
    });

    socket.on("friendship_removed", (payload) => {
      if (friendshipRemovedCallbackRef.current) {
        friendshipRemovedCallbackRef.current(payload);
      }
    });

    socket.on("user_blocked", (payload) => {
      if (userBlockedCallbackRef.current) {
        userBlockedCallbackRef.current(payload);
      }
    });

    setTimeout(() => {
      requestInitialCounts();
    }, 1000);

    return () => {
      if (socket) {
        socket.disconnect();
      }
      stopPolling();
    };
  }, [user?.token, requestInitialCounts, startPolling, stopPolling, usePolling]);

  return {
    unreadCount,
    pendingCount,
    connected: connected || usePolling, // Show as connected if either works
    error,
    requestInitialCounts,
    incrementUnreadCount,
    decrementUnreadCount,
    incrementPendingCount,
    decrementPendingCount,
    onNewFriendRequest,
    onFriendRequestResponse,
    onNewMessage,
    onFriendshipRemoved,
    onUserBlocked,
  };
};
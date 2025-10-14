import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "./useAuth";
import { apiFetch } from "../Components/api";



interface UseNotificationsReturn {
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

export const usePollingNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const requestInitialCounts = useCallback(async () => {
    if (!user?.token) return;

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
      setConnected(true);
      setError(null);
    } catch {
      setError("Error fetching notification counts");
      setConnected(false);
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

  const onNewFriendRequest = useCallback(() => {
  }, []);

  const onFriendRequestResponse = useCallback(() => {
  }, []);

  const onNewMessage = useCallback(() => {
  }, []);

  const onFriendshipRemoved = useCallback(() => {
  }, []);

  const onUserBlocked = useCallback(() => {
  }, []);

  useEffect(() => {
    if (!user?.token) {
      setUnreadCount(0);
      setPendingCount(0);
      setConnected(false);
      setError(null);
      
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Initial fetch

    pollingRef.current = window.setInterval(() => {
      requestInitialCounts();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user?.token, requestInitialCounts]);

  return {
    unreadCount,
    pendingCount,
    connected,
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
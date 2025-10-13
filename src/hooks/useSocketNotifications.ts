import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

interface NotificationCounts {
  unreadCount: number;
  pendingCount: number;
}

interface UseSocketNotificationsReturn {
  unreadCount: number;
  pendingCount: number;
  connected: boolean;
  error: string | null;
  requestInitialCounts: () => void;
}

export const useSocketNotifications = (): UseSocketNotificationsReturn => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestInitialCounts = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("request_initial_counts");
    }
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
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : "http://localhost:3000";

    const socket = io(serverUrl, {
      auth: {
        token: user.token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket conectado");
      setConnected(true);
      setError(null);
      socket.emit("request_initial_counts");
    });

    socket.on("disconnect", () => {
      console.log("WebSocket desconectado");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Error de conexión WebSocket:", err);
      setError(`Error de conexión: ${err.message}`);
      setConnected(false);
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
      console.log("Nuevo mensaje recibido:", message);
    });

    socket.on("new_friend_request", (request) => {
      console.log("Nueva solicitud de amistad:", request);
    });

    socket.on("friend_request_response", (response) => {
      console.log("Respuesta a solicitud de amistad:", response);
    });

    socket.on("notification_error", (error: string) => {
      console.error("Error de notificación:", error);
      setError(error);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?.token]);

  return {
    unreadCount,
    pendingCount,
    connected,
    error,
    requestInitialCounts,
  };
};
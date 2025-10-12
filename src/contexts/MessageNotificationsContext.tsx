import React, { useCallback } from "react";
import { useSocketNotifications } from "../hooks/useSocketNotifications";
import { MessageNotificationsContext } from "./MessageNotificationsContextDefinition";

interface MessageNotificationsProviderProps {
  children: React.ReactNode;
}

export const MessageNotificationsProvider: React.FC<
  MessageNotificationsProviderProps
> = ({ children }) => {
  const { unreadCount, connected, error, requestInitialCounts } = useSocketNotifications();

  const updateUnreadCount = useCallback(() => {
    // Con WebSockets, las actualizaciones son automáticas
    // Este método se mantiene para compatibilidad, pero solicita un refresh manual
    requestInitialCounts();
  }, [requestInitialCounts]);

  const incrementUnreadCount = useCallback(() => {
    // Con WebSockets, los incrementos son automáticos desde el servidor
    // Este método se mantiene para compatibilidad pero no hace nada
    console.log("Incremento automático via WebSocket");
  }, []);

  const decrementUnreadCount = useCallback(() => {
    // Con WebSockets, los decrementos son automáticos desde el servidor
    // Este método se mantiene para compatibilidad pero no hace nada
    console.log("Decremento automático via WebSocket");
  }, []);

  const value = {
    unreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    loading: !connected && !error, // Loading si no está conectado y no hay error
  };

  return (
    <MessageNotificationsContext.Provider value={value}>
      {children}
    </MessageNotificationsContext.Provider>
  );
};

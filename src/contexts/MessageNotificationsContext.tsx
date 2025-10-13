import React, { useCallback } from "react";
import { useSocketNotifications } from "../hooks/useSocketNotifications";
import { MessageNotificationsContext } from "./MessageNotificationsContextDefinition";

interface MessageNotificationsProviderProps {
  children: React.ReactNode;
}

export const MessageNotificationsProvider: React.FC<
  MessageNotificationsProviderProps
> = ({ children }) => {
  const { unreadCount, connected, error, requestInitialCounts } =
    useSocketNotifications();

  const updateUnreadCount = useCallback(() => {
    requestInitialCounts();
  }, [requestInitialCounts]);

  const incrementUnreadCount = useCallback(() => {
    console.log("Incremento automático via WebSocket");
  }, []);

  const decrementUnreadCount = useCallback(() => {
    console.log("Decremento automático via WebSocket");
  }, []);

  const value = {
    unreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    loading: !connected && !error,
  };

  return (
    <MessageNotificationsContext.Provider value={value}>
      {children}
    </MessageNotificationsContext.Provider>
  );
};

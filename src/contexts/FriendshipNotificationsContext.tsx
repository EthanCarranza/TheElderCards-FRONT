import React, { useCallback } from "react";
import { useSocketNotifications } from "../hooks/useSocketNotifications";
import { FriendshipNotificationsContext } from "./FriendshipNotificationsContextDefinition";

interface FriendshipNotificationsProviderProps {
  children: React.ReactNode;
}

export const FriendshipNotificationsProvider: React.FC<
  FriendshipNotificationsProviderProps
> = ({ children }) => {
  const { pendingCount, connected, error, requestInitialCounts } =
    useSocketNotifications();

  const refreshCount = useCallback(() => {
    requestInitialCounts();
  }, [requestInitialCounts]);

  const decrementCount = useCallback(() => {
    console.log("Decremento automático via WebSocket");
  }, []);

  const incrementCount = useCallback(() => {
    console.log("Incremento automático via WebSocket");
  }, []);

  const value = {
    pendingRequestsCount: pendingCount,
    connected,
    error,
    refreshCount,
    decrementCount,
    incrementCount,
    loading: !connected && !error,
  };

  return (
    <FriendshipNotificationsContext.Provider value={value}>
      {children}
    </FriendshipNotificationsContext.Provider>
  );
};

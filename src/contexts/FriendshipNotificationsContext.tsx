import React, { useCallback } from "react";
import { useSocketNotifications } from "../hooks/useSocketNotifications";
import { FriendshipNotificationsContext } from "./FriendshipNotificationsContextDefinition";

interface FriendshipNotificationsProviderProps {
  children: React.ReactNode;
}

export const FriendshipNotificationsProvider: React.FC<
  FriendshipNotificationsProviderProps
> = ({ children }) => {
  const { pendingCount, connected, error, requestInitialCounts } = useSocketNotifications();

  const refreshCount = useCallback(() => {
    // Con WebSockets, las actualizaciones son automáticas
    // Este método se mantiene para compatibilidad, pero solicita un refresh manual
    requestInitialCounts();
  }, [requestInitialCounts]);

  const decrementCount = useCallback(() => {
    // Con WebSockets, los decrementos son automáticos desde el servidor
    // Este método se mantiene para compatibilidad pero no hace nada
    console.log("Decremento automático via WebSocket");
  }, []);

  const incrementCount = useCallback(() => {
    // Con WebSockets, los incrementos son automáticos desde el servidor
    // Este método se mantiene para compatibilidad pero no hace nada
    console.log("Incremento automático via WebSocket");
  }, []);

  const value = {
    pendingRequestsCount: pendingCount,
    connected,
    error,
    refreshCount,
    decrementCount,
    incrementCount,
    loading: !connected && !error, // Loading si no está conectado y no hay error
  };

  return (
    <FriendshipNotificationsContext.Provider value={value}>
      {children}
    </FriendshipNotificationsContext.Provider>
  );
};
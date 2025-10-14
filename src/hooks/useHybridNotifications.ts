import { useEffect, useState } from "react";
import { useSocketNotifications } from "./useSocketNotifications";
import { usePollingNotifications } from "./usePollingNotifications";

export const useHybridNotifications = () => {
  const [usePolling, setUsePolling] = useState(false);
  const socketNotifications = useSocketNotifications();
  const pollingNotifications = usePollingNotifications();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!socketNotifications.connected && socketNotifications.error) {
        console.warn("Socket.IO failed, switching to polling mode");
        setUsePolling(true);
      }
    }, 5000); // Wait 5 seconds before switching

    if (socketNotifications.connected) {
      clearTimeout(timeout);
      setUsePolling(false);
    }

    return () => clearTimeout(timeout);
  }, [socketNotifications.connected, socketNotifications.error]);

  return usePolling ? pollingNotifications : socketNotifications;
};
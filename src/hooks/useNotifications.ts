import { useEffect, useState } from "react";
import { useSocketNotifications } from "./useSocketNotifications";
import { usePollingNotifications } from "./usePollingNotifications";

export const useNotifications = () => {
  const socketNotifications = useSocketNotifications();
  const pollingNotifications = usePollingNotifications();
  const [useSocketIO, setUseSocketIO] = useState(false);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
    setUseSocketIO(isLocal);
  }, []);
  
  return useSocketIO ? socketNotifications : pollingNotifications;
};
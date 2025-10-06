import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch } from "../Components/api";

interface UseFriendshipNotificationsReturn {
  pendingRequestsCount: number;
  loading: boolean;
  error: string;
  refreshCount: () => Promise<void>;
}

export const useFriendshipNotifications = (): UseFriendshipNotificationsReturn => {
  const { user } = useAuth();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPendingCount = useCallback(async () => {
    if (!user) {
      setPendingRequestsCount(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch<{ count: number }>("/friendships/pending", {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setPendingRequestsCount(response.data.count || 0);
    } catch {
      setError("Error al obtener notificaciones");
      setPendingRequestsCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    pendingRequestsCount,
    loading,
    error,
    refreshCount: fetchPendingCount
  };
};
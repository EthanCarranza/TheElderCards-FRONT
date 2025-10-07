import React, { createContext, useCallback, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../Components/api';

interface MessageNotificationsContextType {
  unreadCount: number;
  updateUnreadCount: () => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  loading: boolean;
}

export const MessageNotificationsContext = createContext<MessageNotificationsContextType | undefined>(undefined);

interface MessageNotificationsProviderProps {
  children: React.ReactNode;
}

export const MessageNotificationsProvider: React.FC<MessageNotificationsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch<{ unreadCount: number }>('/messages/unread-count', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error al obtener conteo de mensajes no leídos:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Refrescar cada 10 segundos para detectar nuevos mensajes más rápido
    const interval = setInterval(fetchUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const value = {
    unreadCount,
    updateUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
    loading
  };

  return (
    <MessageNotificationsContext.Provider value={value}>
      {children}
    </MessageNotificationsContext.Provider>
  );
};
import { useContext } from 'react';
import { MessageNotificationsContext } from '../contexts/MessageNotificationsContext';

export const useMessageNotifications = () => {
  const context = useContext(MessageNotificationsContext);
  if (context === undefined) {
    throw new Error('useMessageNotifications must be used within a MessageNotificationsProvider');
  }
  return context;
};
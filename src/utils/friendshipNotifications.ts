import { useFriendshipNotifications } from "../hooks/useFriendshipNotifications";

// Instancia global para actualizar notificaciones desde cualquier componente
let globalFriendshipNotifications: ReturnType<
  typeof useFriendshipNotifications
> | null = null;

export const setGlobalFriendshipNotifications = (
  notifications: ReturnType<typeof useFriendshipNotifications>
) => {
  globalFriendshipNotifications = notifications;
};

export const updateFriendshipNotifications = {
  decrement: () => {
    globalFriendshipNotifications?.decrementCount();
  },
  increment: () => {
    globalFriendshipNotifications?.incrementCount();
  },
  refresh: () => {
    globalFriendshipNotifications?.refreshCount();
  },
};

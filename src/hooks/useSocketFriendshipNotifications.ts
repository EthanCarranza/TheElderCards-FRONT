import { useEffect } from "react";
import { useSocketNotifications } from "./useSocketNotifications";
import { useFriendshipToast } from "./useFriendshipToast";
import { useAuth } from "./useAuth";

interface User {
  _id: string;
  username?: string;
  email?: string;
  image?: string;
}

interface BackendFriendRequest {
  friendshipId: string;
  requester: User;
  message?: string;
  createdAt: string;
}

interface BackendFriendRequestResponse {
  action: "accept" | "decline";
  recipient: User;
  friendship: {
    _id: string;
    requester: User;
    recipient: User;
    status: string;
  };
}

interface BackendFriendshipRemoved {
  friendshipId: string;
  byUserId: string;
  status: string;
}

interface BackendUserBlocked {
  friendshipId: string;
  blockedBy: string;
  blockedByUsername?: string;
  blockedByEmail?: string;
  blockedByImage?: string;
}

export const useSocketFriendshipNotifications = () => {
  const socketNotifications = useSocketNotifications();
  const friendshipToast = useFriendshipToast();
  const { user } = useAuth();
  useEffect(() => {
    console.log(
      "🚀 useSocketFriendshipNotifications: Configurando listeners de eventos de socket"
    );
    console.log("🚀 Socket conectado:", socketNotifications.connected);
    console.log("🚀 FriendshipToast disponible:", !!friendshipToast);
    socketNotifications.onNewFriendRequest((request: unknown) => {
      console.log("🔔 Nueva solicitud de amistad recibida:", request);
      const friendRequest = request as BackendFriendRequest;
      const username = friendRequest.requester?.username;
      const email = friendRequest.requester?.email;
      let displayName = "";
      if (username && email) {
        displayName = `${username} (${email})`;
      } else if (username) {
        displayName = username;
      } else if (email) {
        displayName = email;
      } else {
        displayName = "Un usuario";
      }
      friendshipToast.showNotification({
        type: "new_request",
        username: displayName,
        message: friendRequest.message,
      });
    });

    socketNotifications.onFriendRequestResponse((response: unknown) => {
      console.log("✅❌ Respuesta a solicitud de amistad:", response);
      const friendResponse = response as BackendFriendRequestResponse;
      const recipientName =
        friendResponse.recipient?.username ||
        friendResponse.recipient?.email ||
        "Un usuario";
      if (friendResponse.action === "accept") {
        friendshipToast.showNotification({
          type: "request_accepted",
          username: recipientName,
        });
      } else if (friendResponse.action === "decline") {
        friendshipToast.showNotification({
          type: "request_declined",
          username: recipientName,
        });
      }
    });

    socketNotifications.onFriendshipRemoved((payload: unknown) => {
      console.log("💔 Amistad/solicitud eliminada:", payload);
      const removal = payload as BackendFriendshipRemoved & {
        byUsername?: string;
        byEmail?: string;
        byImage?: string;
      };
      if (!user || user.userId === removal.byUserId) {
        return;
      }
      const name =
        removal.byUsername || removal.byEmail || `ID: ${removal.byUserId}`;
      friendshipToast.showNotification({
        type: "friendship_removed",
        username: `${name} te ha eliminado de su lista de amigos.`,
      });
    });

    socketNotifications.onUserBlocked((payload: unknown) => {
      console.log("🚫 Usuario bloqueado:", payload);
      const blocked = payload as BackendUserBlocked;
      const name = blocked.blockedByUsername || blocked.blockedByEmail || `ID: ${blocked.blockedBy}`;
      friendshipToast.showNotification({
        type: "user_blocked",
        username: `${name} te ha bloqueado.`,
      });
    });
  }, [socketNotifications, friendshipToast, user]);

  return socketNotifications;
};

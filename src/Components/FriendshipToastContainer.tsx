import React from "react";
import { useFriendshipToast } from "../hooks/useFriendshipToast";
import FriendshipToast from "./FriendshipToast";

const FriendshipToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useFriendshipToast();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <FriendshipToast
            notification={notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );
};

export default FriendshipToastContainer;

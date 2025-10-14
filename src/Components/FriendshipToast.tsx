import React, { useCallback, useEffect, useState } from "react";

export interface FriendshipNotification {
  id: string;
  type:
    | "new_request"
    | "request_accepted"
    | "request_declined"
    | "friendship_removed"
    | "user_blocked";
  username: string;
  message?: string;
  timestamp: number;
}

interface FriendshipToastProps {
  notification: FriendshipNotification;
  onClose: (id: string) => void;
  autoClose?: boolean;
  duration?: number;
}

const FriendshipToast: React.FC<FriendshipToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleClose = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  }, [notification.id, onClose]);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, handleClose]);

  const getNotificationContent = () => {
    switch (notification.type) {
      case "new_request":
        return {
          icon: "👋",
          title: "¡Nueva solicitud de amistad!",
          message: `${notification.username} te ha enviado una solicitud de amistad.`,
          bgColor: "bg-blue-600",
          borderColor: "border-blue-500",
        };
      case "request_accepted":
        return {
          icon: "✅",
          title: "¡Solicitud aceptada!",
          message: `${notification.username} ha aceptado tu solicitud de amistad.`,
          bgColor: "bg-green-600",
          borderColor: "border-green-500",
        };
      case "request_declined":
        return {
          icon: "❌",
          title: "Solicitud rechazada",
          message: `${notification.username} ha rechazado tu solicitud de amistad.`,
          bgColor: "bg-red-600",
          borderColor: "border-red-500",
        };
      case "friendship_removed":
        return {
          icon: "💔",
          title: "Amistad eliminada",
          message: notification.username,
          bgColor: "bg-orange-600",
          borderColor: "border-orange-500",
        };
      case "user_blocked":
        return {
          icon: "🚫",
          title: "Usuario bloqueado",
          message: notification.username,
          bgColor: "bg-red-700",
          borderColor: "border-red-600",
        };
      default:
        return {
          icon: "📢",
          title: "Notificación",
          message: notification.message || "",
          bgColor: "bg-gray-600",
          borderColor: "border-gray-500",
        };
    }
  };

  const content = getNotificationContent();

  return (
    <div
      className={`
        relative z-50 w-full max-w-sm
        transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isRemoving
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div
        className={`
          ${content.bgColor} ${content.borderColor}
          border-l-4 rounded-lg shadow-lg p-4 text-white
          hover:shadow-xl transition-shadow duration-200
        `}
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">{content.icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-lg mb-2">{content.title}</h4>
            <p className="text-base text-gray-100 leading-relaxed">
              {content.message}
            </p>
            {notification.message && notification.type === "new_request" && (
              <p className="text-sm text-gray-200 mt-2 italic">
                "{notification.message}"
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white flex-shrink-0 text-xl leading-none p-1"
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>

        {/* Barra de progreso para auto-close */}
        {autoClose && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-[5000ms] ease-linear"
              style={{
                width: isVisible ? "0%" : "100%",
                transition: `width ${duration}ms linear`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendshipToast;

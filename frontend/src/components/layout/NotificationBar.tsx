import { toast, ToastOptions } from 'sonner';
import { useEffect } from 'react';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface NotificationBarProps {
  type: NotificationType;
  message: string;
  duration?: number;
}

const NotificationBar = ({ type, message, duration = 5000 }: NotificationBarProps) => {
  useEffect(() => {
    const toastOptions: ToastOptions = {
      duration: type === 'error' ? Infinity : duration,
      className: `rounded-lg shadow-lg border ${getNotificationStyle(type)}`,
      position: 'top-center',
    };

    toast[type](message, toastOptions);

    // Cleanup toast when component unmounts
    return () => toast.dismiss();
  }, [type, message, duration]);

  const getNotificationStyle = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-700';
    }
  };

  return null; // Sonner handles the rendering
};

export default NotificationBar;
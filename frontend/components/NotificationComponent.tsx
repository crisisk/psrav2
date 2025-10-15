"use client";

import { useState, useEffect } from 'react';

type NotificationType = {
  id: string;
  type: 'security' | 'system' | 'audit';
  message: string;
  read: boolean;
  timestamp: string;
};

export default function NotificationComponent() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const { data } = await response.json();
      setNotifications(data);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });

      if (!response.ok) throw new Error('Failed to update notifications');
      
      fetchNotifications(); // Refresh list after update
    } catch (err) {
      setError('Failed to mark notifications as read');
      console.error(err);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Log Notifications</h1>
      
      {notifications.length === 0 ? (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
          No notifications available
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-sm font-medium ${notification.read ? 'text-gray-500' : 'text-blue-700'}`}>
                  {notification.type.toUpperCase()}
                </span>
                <p className="mt-1 text-gray-900">{notification.message}</p>
                <time className="text-sm text-gray-500 mt-2 block">
                  {new Date(notification.timestamp).toLocaleString()}
                </time>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead([notification.id])}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Mark Read
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

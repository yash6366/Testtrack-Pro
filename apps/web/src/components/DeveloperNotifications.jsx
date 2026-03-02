import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { apiClient } from '@/lib/apiClient';
import { logError } from '@/lib/errorLogger';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  RefreshCw,
} from 'lucide-react';

/**
 * Developer Notifications Panel
 * Displays notifications for assigned bugs, retests, and activity updates
 */
export default function DeveloperNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get('/api/developer/notifications');
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      logError(error, 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/developer/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      logError(error, 'Failed to mark notification as read');
    }
  };

  const dismissNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/api/developer/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      logError(error, 'Failed to dismiss notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BUG_ASSIGNED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'RETEST_COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'BUG_COMMENT':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'RETEST_FAILED':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-indigo-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'BUG_ASSIGNED':
        return 'border-l-red-500 bg-red-500/5';
      case 'RETEST_COMPLETED':
        return 'border-l-emerald-500 bg-emerald-500/5';
      case 'BUG_COMMENT':
        return 'border-l-blue-500 bg-blue-500/5';
      case 'RETEST_FAILED':
        return 'border-l-yellow-500 bg-yellow-500/5';
      default:
        return 'border-l-indigo-500 bg-indigo-500/5';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 max-h-96 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg z-50 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[var(--muted)]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)]">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} transition hover:bg-[var(--bg-elevated)] ${
                      !notification.read ? 'bg-[var(--bg-elevated)]' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-[var(--muted)] mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="flex-shrink-0 text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-[var(--border)] flex gap-2">
              <button
                onClick={loadNotifications}
                className="flex-1 px-3 py-2 text-sm bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] rounded transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

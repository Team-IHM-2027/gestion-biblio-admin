// src/components/common/NotificationBell.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { websocketService, type Notification } from '../../shared/websocket/webSocketService';
import useI18n from '../../hooks/useI18n';

export default function NotificationBell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Ensure socket is connected
    websocketService.connect();

    const listener = (n: Notification) => {
      const notif: Notification = {
        ...n,
        timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        read: !!n.read
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
    };

    websocketService.onNotification(listener);

    // Do NOT call websocketService.cleanup() here because it disconnects the global socket
    // and clears listeners for the whole app. We'll leave the listener registered for
    // the app lifetime (the component is mounted on the header).
    return () => {
      // Intentionally do not disconnect the global socket on component unmount.
      // If you want to support removing the listener, add an `offNotification` method
      // to `webSocketService` and call it here.
    };
  }, []);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(ev.target as Node)) return;
      setOpen(false);
    };
    if (open) window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleItemClick = (n: Notification) => {
    markAsRead(n.id);
    setOpen(false);
    try {
      if (n.data?.reservationId || String(n.type).includes('reservation')) {
        navigate('/reservations');
      } else {
        navigate('/overview');
      }
    } catch {
      // ignore navigation errors
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Notifications"
        className="relative p-2 rounded-md hover:bg-white/10 transition-colors text-white"
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="text-sm font-medium">{t ? t('notifications:title') : 'Notifications'}</div>
            <div className="flex items-center space-x-2">
              <button
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={(e) => { e.stopPropagation(); markAllRead(); }}
              >
                {t ? t('notifications:mark_all_read') : 'Mark all read'}
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="p-4 text-sm text-gray-500">
                {t ? t('notifications:none') : 'No notifications'}
              </div>
            )}

            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={
                  `px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-start gap-3 ` +
                  (n.read ? 'bg-gray-50' : 'bg-white')
                }
              >
                <div className="flex-shrink-0">
                  <div
                    className={
                      'w-8 h-8 rounded-full flex items-center justify-center text-white ' +
                      (n.type === 'new_book_added' ? 'bg-blue-500' :
                        n.type?.toString().includes('approved') ? 'bg-green-500' :
                        n.type?.toString().includes('request') ? 'bg-yellow-500' :
                        n.type?.toString().includes('rejected') || n.type === 'system_alert' ? 'bg-red-500' :
                        'bg-gray-400')
                    }
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{n.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t text-center">
            <button
              className="text-sm text-primary hover:underline"
              onClick={(e) => { e.stopPropagation(); navigate('/notifications'); setOpen(false); }}
            >
              {t ? t('notifications:view_all') : 'View all notifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
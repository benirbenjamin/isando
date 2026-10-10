import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ExternalLink, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function HeaderDashboard({ setMobileOpen }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeReminder, setActiveReminder] = useState(null);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get('/notifications');
        const notifs = res.notifications || [];
        setUnreadCount(res.unreadCount || 0);
        setNotifications(notifs);

        // Check for urgent upcoming event reminder (starting in 10 min)
        const urgentEventReminder = notifs.find(n => !n.isRead && (n.type === 'EVENT_REMINDER' || n.title?.includes('10 Min')));
        if (urgentEventReminder) {
          setActiveReminder(urgentEventReminder);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    setShowNotifications(false);
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n.id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
      } catch (err) {
        console.error(err);
      }
    }

    if (n.type === 'EVENT' || n.entityType === 'event') {
      navigate(n.relatedEntityId ? `/events/${n.relatedEntityId}` : '/events');
    } else if (n.type === 'TASK' || n.entityType === 'task') {
      navigate('/tasks');
    } else if (n.type === 'MESSAGE' || n.entityType === 'conversation') {
      navigate(n.relatedEntityId ? `/messages?conversationId=${n.relatedEntityId}` : '/messages');
    } else if (n.type === 'ANNOUNCEMENT' || n.entityType === 'announcement') {
      navigate('/announcements');
    } else if (n.type === 'INVENTORY_LOW' || n.entityType === 'product') {
      navigate('/inventory');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brand-border shadow-sm">
      {/* ⏰ In-App 10-Minute Pre-Event Urgency Alert Banner */}
      {activeReminder && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm animate-bounce">⏰</span>
            <span className="truncate">{activeReminder.title} &bull; {activeReminder.message}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={() => handleNotificationClick(activeReminder)}
              className="px-2.5 py-1 bg-white text-brand-dark rounded-lg font-black hover:bg-brand-yellow transition text-[11px] shadow-sm"
            >
              Open Command Center &rarr;
            </button>
            <button
              onClick={() => setActiveReminder(null)}
              className="text-white/80 hover:text-white font-bold px-1.5 text-sm"
              title="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-extrabold text-sm text-brand-dark hidden sm:inline-block">
            {user?.role} Portal &bull; Romantic T Solutions Ltd
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-brand-soft text-xs font-bold text-brand-dark hover:bg-brand-yellow transition"
          >
            <span>Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 relative transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-red text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-brand-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-pop">
                <div className="p-3 bg-brand-soft border-b border-brand-border flex items-center justify-between">
                  <b className="text-xs font-black text-brand-dark">Notification Center</b>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-bold text-brand-red hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left p-3.5 text-xs transition flex items-start justify-between gap-2 hover:bg-amber-50/70 ${n.isRead ? 'bg-white' : 'bg-amber-50/50'}`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0" />}
                            <b className="font-bold text-brand-dark">{n.title}</b>
                          </div>
                          <p className="text-gray-600 leading-tight">{n.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1.5 block">
                            {new Date(n.createdAt).toLocaleTimeString()} &bull; {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400 font-bold">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Quick Link */}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <div className="w-7 h-7 rounded-full bg-brand-yellow text-brand-dark font-black flex items-center justify-center text-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

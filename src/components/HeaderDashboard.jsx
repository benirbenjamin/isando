import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function HeaderDashboard({ setMobileOpen }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get('/notifications');
        setUnreadCount(res.unreadCount || 0);
        setNotifications(res.notifications || []);
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

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brand-border px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
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
                      <div key={n.id} className={`p-3 text-xs ${n.isRead ? 'bg-white' : 'bg-amber-50/60'}`}>
                        <b className="block font-bold text-brand-dark mb-0.5">{n.title}</b>
                        <p className="text-gray-600 leading-tight">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString()} &bull; {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
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

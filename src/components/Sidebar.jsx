import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, DollarSign, Package, ShoppingCart, 
  Calendar, CheckSquare, Megaphone, MessageSquare, Users, Shield, 
  Settings, FileText, Activity, LogOut, Tags, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout, hasPermission } = useAuth();
  const [badges, setBadges] = useState({
    events: 0,
    tasks: 0,
    messages: 0,
    inventory: 0,
  });

  useEffect(() => {
    async function loadBadges() {
      try {
        const [evtRes, tskRes, convRes, invRes] = await Promise.all([
          api.get('/events?limit=20').catch(() => ({ events: [] })),
          api.get('/tasks?status=PENDING').catch(() => ({ tasks: [] })),
          api.get('/messages/conversations').catch(() => ({ conversations: [] })),
          api.get('/inventory/status').catch(() => ({ lowStockCount: 0 })),
        ]);
        
        const activeEvts = (evtRes.events || []).filter(e => e.status === 'LIVE' || e.status === 'PLANNING').length;
        const pendingTasks = (tskRes.tasks || []).length;
        const unreadConvs = (convRes.conversations || []).filter(c => c.unreadCount > 0).length;
        const lowStock = (invRes.lowStockCount || 0) + (invRes.outOfStockCount || 0);

        setBadges({
          events: activeEvts,
          tasks: pendingTasks,
          messages: unreadConvs,
          inventory: lowStock,
        });
      } catch (err) {
        console.error('Sidebar badges error:', err);
      }
    }

    loadBadges();
    const interval = setInterval(loadBadges, 20000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, perm: null },
    { label: 'Analytics', path: '/analytics', icon: BarChart3, perm: 'reports.view' },
    { label: 'Finance & Sales Log', path: '/finance', icon: DollarSign, perm: 'finance.view' },
    { label: 'Inventory Stock', path: '/inventory', icon: Package, perm: 'inventory.view', badge: badges.inventory, badgeColor: 'bg-amber-600' },
    { label: 'Record Sale', path: '/sales', icon: ShoppingCart, perm: 'sales.create' },
    { label: 'Events & Command Center', path: '/events', icon: Calendar, perm: 'events.view', badge: badges.events, badgeColor: 'bg-brand-red' },
    { label: 'Tasks & Assignments', path: '/tasks', icon: CheckSquare, perm: 'tasks.view', badge: badges.tasks, badgeColor: 'bg-emerald-600' },
    { label: 'Announcements', path: '/announcements', icon: Megaphone, perm: null },
    { label: 'Internal Messages', path: '/messages', icon: MessageSquare, perm: null, badge: badges.messages, badgeColor: 'bg-blue-600' },
    { label: 'Products Management', path: '/products-management', icon: Package, perm: 'products.view' },
    { label: 'Services Management', path: '/services-management', icon: Layers, perm: 'services.view' },
    { label: 'Divisions & Categories', path: '/categories', icon: Tags, perm: 'products.create' },
    { label: 'Workers & Staff', path: '/workers', icon: Users, perm: 'users.view' },
    { label: 'Roles & Permissions', path: '/roles', icon: Shield, perm: 'users.create' },
    { label: 'Departments', path: '/departments', icon: Layers, perm: 'settings.manage' },
    { label: 'Reports', path: '/reports', icon: FileText, perm: 'reports.view' },
    { label: 'System Audit Log', path: '/audit-log', icon: Activity, perm: 'audit.view' },
    { label: 'Settings & Storage', path: '/settings', icon: Settings, perm: 'settings.manage' },
  ];

  const visibleItems = navItems.filter(item => item.perm === null || hasPermission(item.perm));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#1C1F27] text-gray-300 flex flex-col justify-between border-r-4 border-brand-yellow
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Top Header */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-10 w-auto bg-white p-1 rounded-lg object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://i.postimg.cc/G2zNf3Fq/LOGO.png';
            }}
          />
          <div className="overflow-hidden">
            <h2 className="text-sm font-black text-white truncate">Romantic T Solutions</h2>
            <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider block">Operations</span>
          </div>
        </div>

        {/* Nav Links List with Badges */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const hasBadge = Boolean(item.badge && item.badge > 0);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition group
                  ${isActive ? 'bg-brand-yellow text-brand-dark shadow-md' : 'hover:bg-gray-800 text-gray-300'}
                `}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {hasBadge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm flex-shrink-0 ${item.badgeColor || 'bg-brand-red'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-3 border-t border-gray-800 bg-[#15171e]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-yellow text-brand-dark font-black flex items-center justify-center flex-shrink-0 text-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                <span className="text-[10px] text-gray-400 block truncate">{user?.role}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-brand-red hover:bg-gray-800 rounded-lg transition flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

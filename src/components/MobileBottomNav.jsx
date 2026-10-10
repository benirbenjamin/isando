import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, ShoppingBag, Layers, PhoneCall, LayoutDashboard,
  Calendar, ShoppingCart, MessageSquare, Menu, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav({ onOpenMobileMenu }) {
  const location = useLocation();
  const { isAuthenticated, hasPermission } = useAuth();
  const isDashboardArea = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/events') ||
    location.pathname.startsWith('/sales') ||
    location.pathname.startsWith('/inventory') ||
    location.pathname.startsWith('/messages') ||
    location.pathname.startsWith('/tasks') ||
    location.pathname.startsWith('/analytics') ||
    location.pathname.startsWith('/finance') ||
    location.pathname.startsWith('/products-management') ||
    location.pathname.startsWith('/services-management') ||
    location.pathname.startsWith('/workers') ||
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/settings');

  // Internal Management / Dashboard bottom navigation
  if (isDashboardArea && isAuthenticated) {
    const canViewEvents = hasPermission('events.view');
    const canViewSales = hasPermission('sales.view') || hasPermission('sales.create');

    return (
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#1C1F27]/95 backdrop-blur-md border-t border-gray-800 text-gray-300 md:hidden shadow-2xl">
        <div className="grid grid-cols-5 h-16 items-center">
          {/* Home button in bottom nav: ALWAYS redirects to public homepage */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full transition ${
                isActive ? 'text-brand-yellow font-bold' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Home</span>
          </NavLink>

          {canViewEvents ? (
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full transition ${
                  isActive ? 'text-brand-yellow font-bold' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Events</span>
            </NavLink>
          ) : (
            <NavLink
              to="/messages"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full transition ${
                  isActive ? 'text-brand-yellow font-bold' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <MessageSquare className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Chat</span>
            </NavLink>
          )}

          {canViewSales ? (
            <NavLink
              to="/sales"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full transition ${
                  isActive ? 'text-brand-yellow font-bold' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <ShoppingCart className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Sales</span>
            </NavLink>
          ) : (
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full transition ${
                  isActive ? 'text-brand-yellow font-bold' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Shop</span>
            </NavLink>
          )}

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-full transition ${
                isActive ? 'text-brand-yellow font-bold' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Dashboard</span>
          </NavLink>

          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex flex-col items-center justify-center h-full text-gray-400 hover:text-white transition"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </div>
      </nav>
    );
  }

  // Public customer website bottom nav
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border text-brand-dark md:hidden shadow-2xl">
      <div className="grid grid-cols-5 h-16 items-center">
        {/* 1. Home -> Navigates to Homepage */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition ${
              isActive ? 'text-brand-red font-black' : 'text-gray-500 hover:text-brand-dark'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </NavLink>

        {/* 2. Products */}
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition ${
              isActive ? 'text-brand-red font-black' : 'text-gray-500 hover:text-brand-dark'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Products</span>
        </NavLink>

        {/* 3. Services */}
        <NavLink
          to="/services"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition ${
              isActive ? 'text-brand-red font-black' : 'text-gray-500 hover:text-brand-dark'
            }`
          }
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Services</span>
        </NavLink>

        {/* 4. Contact */}
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition ${
              isActive ? 'text-brand-red font-black' : 'text-gray-500 hover:text-brand-dark'
            }`
          }
        >
          <PhoneCall className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Contact</span>
        </NavLink>

        {/* 5. Profile/Account on the side -> Redirects directly to Dashboard */}
        <NavLink
          to={isAuthenticated ? '/dashboard' : '/login'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full transition ${
              isActive || location.pathname.startsWith('/dashboard')
                ? 'text-brand-red font-black' 
                : 'text-gray-500 hover:text-brand-dark'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Account</span>
        </NavLink>
      </div>
    </nav>
  );
}

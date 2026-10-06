import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, Calendar, AlertTriangle, TrendingUp, 
  Users, CheckCircle2, ArrowRight, MessageSquare, Megaphone, Plus, Clock, MapPin, UserCheck
} from 'lucide-react';
import { api, formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analyticsRes, invRes, eventsRes, convRes] = await Promise.all([
          api.get('/analytics/overview').catch(() => ({ metrics: {} })),
          api.get('/inventory/status').catch(() => ({ lowStockProducts: [], outOfStockProducts: [] })),
          api.get('/events?limit=20').catch(() => ({ events: [] })),
          api.get('/messages/conversations').catch(() => ({ conversations: [] })),
        ]);

        setData({
          metrics: analyticsRes.metrics || {},
          divisionRevenue: analyticsRes.divisionRevenue || {},
          lowStockProducts: invRes.lowStockProducts || [],
          outOfStockProducts: invRes.outOfStockProducts || [],
          events: eventsRes.events || [],
        });
        setConversations(convRes.conversations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading dashboard metrics...</div>;
  }

  const metrics = data?.metrics || {};
  const events = data?.events || [];

  // User's specifically assigned events
  const myAssignedEvents = events.filter(e => 
    e.assignments?.some(a => a.userId === user?.id) || e.managerId === user?.id
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-dark via-gray-900 to-[#1C1F27] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-brand-yellow text-brand-dark text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
            {user?.role} PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Welcome back, {user?.fullName}!</h1>
          <p className="text-xs text-gray-400 mt-1">
            Romantic T Solutions Operations &bull; Department: {user?.department || 'General'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/sales"
            className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Record Sale</span>
          </Link>
          <Link
            to="/events"
            className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </Link>
          <Link
            to="/messages"
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-1.5 transition"
          >
            <MessageSquare className="w-4 h-4 text-brand-yellow" />
            <span>Chat ({conversations.length})</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid - ALL CARDS CLICKABLE */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/analytics"
          className="group bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 block"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span className="group-hover:text-brand-dark transition">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-brand-dark group-hover:text-brand-red transition">
            {formatCurrency(metrics.totalRevenue || 0)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
            <span>{metrics.totalSalesCount || 0} sales recorded</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </Link>

        <Link
          to="/events"
          className="group bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 block"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span className="group-hover:text-brand-dark transition">Active Events</span>
            <Calendar className="w-4 h-4 text-brand-yellow group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-brand-dark group-hover:text-brand-red transition">
            {metrics.activeEvents || 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
            <span>Weddings & Ceremonies</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </Link>

        <Link
          to="/products-management"
          className="group bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 block"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span className="group-hover:text-brand-dark transition">Active Products</span>
            <Package className="w-4 h-4 text-brand-red group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-brand-dark group-hover:text-brand-red transition">
            {metrics.totalProducts || 0}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
            <span>{metrics.totalServices || 0} active services</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </Link>

        <Link
          to="/inventory"
          className="group bg-white border border-brand-border hover:border-brand-yellow rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 block"
        >
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span className="group-hover:text-brand-dark transition">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-brand-red">
            {(metrics.lowStockCount || 0) + (metrics.outOfStockCount || 0)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-600 font-semibold">
            <span>{metrics.outOfStockCount || 0} out of stock</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
          </div>
        </Link>
      </div>

      {/* MY ASSIGNED EVENTS & DIRECT CHAT SECTION */}
      {myAssignedEvents.length > 0 && (
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span>My Assigned Events & Duties</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Events you are scheduled to operate with team chat access
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
              {myAssignedEvents.length} Assigned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssignedEvents.map(evt => {
              const assignment = evt.assignments?.find(a => a.userId === user?.id);
              const isPresent = assignment?.status === 'PRESENT';
              return (
                <div
                  key={evt.id}
                  className="bg-brand-soft border border-brand-border hover:border-brand-yellow rounded-2xl p-4 shadow-sm transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${evt.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-yellow text-brand-dark'}`}>
                        {evt.status}
                      </span>
                      {assignment && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'}`}>
                          {isPresent ? 'Checked In' : 'Pending Check-in'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-sm text-brand-dark line-clamp-1">{evt.name}</h3>

                    {assignment?.roleName && (
                      <div className="text-xs font-bold text-brand-red">
                        Duty Role: {assignment.roleName}
                      </div>
                    )}

                    <div className="text-[11px] text-gray-500 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>{new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-brand-border/60">
                    <Link
                      to={`/events/${evt.id}`}
                      className="flex-1 bg-white hover:bg-gray-100 border border-brand-border text-brand-dark text-xs font-bold py-2 rounded-xl text-center transition shadow-sm"
                    >
                      Command Center
                    </Link>

                    <Link
                      to={`/messages`}
                      className="bg-brand-yellow hover:bg-amber-400 text-brand-dark p-2 rounded-xl shadow-sm transition flex items-center justify-center"
                      title="Open Event Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mid Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Events */}
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-yellow" />
              <span>Upcoming & Active Events</span>
            </h3>
            <Link to="/events" className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1">
              <span>All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {events.length > 0 ? (
              events.slice(0, 5).map(evt => (
                <div key={evt.id} className="p-3.5 bg-brand-soft hover:bg-amber-50/50 border border-brand-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${evt.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-yellow text-brand-dark'}`}>
                        {evt.status}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">{evt.eventType}</span>
                    </div>
                    <h4 className="font-bold text-sm text-brand-dark mt-1">{evt.name}</h4>
                    <p className="text-xs text-gray-500">{evt.venue} &bull; Client: {evt.clientName} ({evt.clientPhone})</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/events/${evt.id}`}
                      className="bg-white hover:bg-gray-100 border border-brand-border text-brand-dark text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
                    >
                      Command Center
                    </Link>
                    <Link
                      to="/messages"
                      className="p-1.5 bg-brand-yellow hover:bg-amber-400 text-brand-dark rounded-xl transition shadow-sm"
                      title="Team Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No active events scheduled</p>
            )}
          </div>
        </div>

        {/* Right: Low Stock Warnings */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-red" />
              <span>Low Stock Alerts</span>
            </h3>
            <Link to="/inventory" className="text-xs font-bold text-brand-red hover:underline">
              Inventory &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {[...data.outOfStockProducts, ...data.lowStockProducts].slice(0, 5).map(prod => (
              <Link
                key={prod.id}
                to="/inventory"
                className="p-3 bg-red-50/50 hover:bg-red-100/60 border border-red-100 rounded-xl flex items-center justify-between text-xs transition block"
              >
                <div>
                  <b className="block font-bold text-brand-dark">{prod.name}</b>
                  <span className="text-gray-500 text-[11px]">{prod.category?.name}</span>
                </div>
                <span className={`font-black ${prod.stockQuantity === 0 ? 'text-brand-red' : 'text-amber-600'}`}>
                  {prod.stockQuantity === 0 ? 'OUT OF STOCK' : `${prod.stockQuantity} left`}
                </span>
              </Link>
            ))}

            {data.lowStockProducts.length === 0 && data.outOfStockProducts.length === 0 && (
              <div className="text-center py-6 text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>All product stock levels healthy</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

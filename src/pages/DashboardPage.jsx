import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, Calendar, AlertTriangle, TrendingUp, 
  Users, CheckCircle2, ArrowRight, MessageSquare, Megaphone, Plus
} from 'lucide-react';
import { api, formatCurrency } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [analyticsRes, invRes, eventsRes] = await Promise.all([
          api.get('/analytics/overview').catch(() => ({ metrics: {} })),
          api.get('/inventory/status').catch(() => ({ lowStockProducts: [] })),
          api.get('/events?limit=5').catch(() => ({ events: [] })),
        ]);

        setData({
          metrics: analyticsRes.metrics || {},
          divisionRevenue: analyticsRes.divisionRevenue || {},
          lowStockProducts: invRes.lowStockProducts || [],
          outOfStockProducts: invRes.outOfStockProducts || [],
          events: eventsRes.events || [],
        });
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

        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-brand-dark">
            {formatCurrency(metrics.totalRevenue || 0)}
          </div>
          <span className="text-[11px] text-gray-400 font-semibold">{metrics.totalSalesCount || 0} sales recorded</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span>Active Events</span>
            <Calendar className="w-4 h-4 text-brand-yellow" />
          </div>
          <div className="text-2xl font-black text-brand-dark">
            {metrics.activeEvents || 0}
          </div>
          <span className="text-[11px] text-gray-400 font-semibold">Weddings & Conferences</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span>Active Products</span>
            <Package className="w-4 h-4 text-brand-red" />
          </div>
          <div className="text-2xl font-black text-brand-dark">
            {metrics.totalProducts || 0}
          </div>
          <span className="text-[11px] text-gray-400 font-semibold">{metrics.totalServices || 0} active services</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-brand-muted text-xs font-bold">
            <span>Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-brand-red">
            {(metrics.lowStockCount || 0) + (metrics.outOfStockCount || 0)}
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">{metrics.outOfStockCount || 0} out of stock</span>
        </div>
      </div>

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
            {data.events.length > 0 ? (
              data.events.map(evt => (
                <div key={evt.id} className="p-3.5 bg-brand-soft border border-brand-border rounded-xl flex items-center justify-between gap-4">
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
                  <Link
                    to={`/events/${evt.id}`}
                    className="bg-white hover:bg-gray-100 border border-brand-border text-brand-dark text-xs font-bold px-3 py-1.5 rounded-xl transition flex-shrink-0"
                  >
                    Command Center
                  </Link>
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
              <div key={prod.id} className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <b className="block font-bold text-brand-dark">{prod.name}</b>
                  <span className="text-gray-500 text-[11px]">{prod.category?.name}</span>
                </div>
                <span className={`font-black ${prod.stockQuantity === 0 ? 'text-brand-red' : 'text-amber-600'}`}>
                  {prod.stockQuantity === 0 ? 'OUT OF STOCK' : `${prod.stockQuantity} left`}
                </span>
              </div>
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

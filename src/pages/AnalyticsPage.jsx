import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Calendar, Users, PieChart } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.get('/analytics/overview');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading analytics metrics...</div>;
  }

  const metrics = data?.metrics || {};
  const divisionRevenue = data?.divisionRevenue || {};
  const paymentMethods = data?.paymentMethods || {};
  const eventStats = data?.eventStatusCount || {};

  const totalRev = metrics.totalRevenue || 1; // avoid divide by zero

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-yellow" />
            <span>Business Analytics & Executive Metrics</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Real-time performance across Food & Beverages, Clothes & Shoes, Wedding Services and Consultancy
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase">Gross Revenue</span>
          <div className="text-2xl font-black text-brand-red">{formatCurrency(metrics.totalRevenue || 0)}</div>
          <span className="text-[10px] text-gray-400 font-semibold">{metrics.totalSalesCount || 0} sales transactions</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Products</span>
          <div className="text-2xl font-black text-brand-dark">{metrics.totalProducts || 0}</div>
          <span className="text-[10px] text-gray-400 font-semibold">{metrics.totalServices || 0} services available</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Events</span>
          <div className="text-2xl font-black text-brand-yellow">{metrics.activeEvents || 0}</div>
          <span className="text-[10px] text-gray-400 font-semibold">Live or Confirmed</span>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-bold text-gray-500 uppercase">Active Workforce</span>
          <div className="text-2xl font-black text-brand-dark">{metrics.totalWorkers || 0}</div>
          <span className="text-[10px] text-gray-400 font-semibold">Staff & Managers</span>
        </div>
      </div>

      {/* Analytics Main Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Division Revenue Distribution */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-lg text-brand-dark flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-yellow" />
            <span>Revenue Breakdown by Business Division</span>
          </h3>

          <div className="space-y-4 pt-2">
            {Object.keys(divisionRevenue).length > 0 ? (
              Object.entries(divisionRevenue).map(([divName, amount]) => {
                const pct = Math.round((amount / totalRev) * 100) || 0;
                return (
                  <div key={divName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-brand-dark">
                      <span>{divName}</span>
                      <span>{formatCurrency(amount)} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-brand-yellow to-brand-red h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No division sales recorded yet</p>
            )}
          </div>
        </div>

        {/* Payment Methods & Event Metrics */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-brand-dark flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>Payment Methods Distribution</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-soft border border-brand-border p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 block">Cash</span>
                <b className="text-lg font-black text-brand-dark">{formatCurrency(paymentMethods.CASH || 0)}</b>
              </div>
              <div className="bg-brand-soft border border-brand-border p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 block">MTN MoMo</span>
                <b className="text-lg font-black text-emerald-600">{formatCurrency(paymentMethods.MOMO || 0)}</b>
              </div>
              <div className="bg-brand-soft border border-brand-border p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 block">Card</span>
                <b className="text-lg font-black text-brand-dark">{formatCurrency(paymentMethods.CARD || 0)}</b>
              </div>
              <div className="bg-brand-soft border border-brand-border p-4 rounded-xl">
                <span className="text-xs font-bold text-gray-500 block">Bank Transfer</span>
                <b className="text-lg font-black text-blue-600">{formatCurrency(paymentMethods.BANK || 0)}</b>
              </div>
            </div>
          </div>

          {/* Event Status Distribution */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-brand-dark flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-red" />
              <span>Events Status Pipeline</span>
            </h3>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                <b className="text-lg font-black text-brand-red block">{eventStats.live || 0}</b>
                <span className="text-gray-600 font-bold">LIVE</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <b className="text-lg font-black text-amber-700 block">{eventStats.confirmed || 0}</b>
                <span className="text-gray-600 font-bold">Confirmed</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
                <b className="text-lg font-black text-gray-700 block">{eventStats.planning || 0}</b>
                <span className="text-gray-600 font-bold">Planning</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <b className="text-lg font-black text-emerald-700 block">{eventStats.completed || 0}</b>
                <span className="text-gray-600 font-bold">Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [aRes, sRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/sales?limit=50'),
        ]);
        setData({
          overview: aRes.metrics || {},
          sales: sRes.sales || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading reports...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <FileText className="w-8 h-8 text-brand-red" />
            <span>Operational & Financial Reports</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Exportable business summaries for Romantic T Solutions Ltd
          </p>
        </div>

        <button onClick={() => window.print()} className="bg-brand-dark hover:bg-black text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition">
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-extrabold text-base text-brand-dark">Executive Summary Report</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-brand-soft border rounded-xl">
            <span className="text-gray-500 block">Total Revenue</span>
            <b className="text-lg font-black text-brand-red">{formatCurrency(data?.overview.totalRevenue || 0)}</b>
          </div>
          <div className="p-3 bg-brand-soft border rounded-xl">
            <span className="text-gray-500 block">Sales Count</span>
            <b className="text-lg font-black text-brand-dark">{data?.overview.totalSalesCount || 0}</b>
          </div>
          <div className="p-3 bg-brand-soft border rounded-xl">
            <span className="text-gray-500 block">Active Products</span>
            <b className="text-lg font-black text-brand-dark">{data?.overview.totalProducts || 0}</b>
          </div>
          <div className="p-3 bg-brand-soft border rounded-xl">
            <span className="text-gray-500 block">Active Events</span>
            <b className="text-lg font-black text-brand-yellow">{data?.overview.activeEvents || 0}</b>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-extrabold text-sm text-brand-dark mb-3">Recent Transactions Log</h4>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="p-2">Sale #</th>
                <th className="p-2">Date</th>
                <th className="p-2">Method</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.sales.map(s => (
                <tr key={s.id}>
                  <td className="p-2 font-mono font-bold">{s.saleNumber}</td>
                  <td className="p-2 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">{s.paymentMethod}</td>
                  <td className="p-2 text-right font-bold text-brand-red">{formatCurrency(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, TrendingUp, Package, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const [aRes, sRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/sales?limit=100'),
        ]);
        setData({
          overview: aRes.metrics || {},
          divisionRevenue: aRes.divisionRevenue || {},
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

  const exportToCSV = () => {
    if (!data?.sales || data.sales.length === 0) return alert('No sales data to export');
    const headers = ['Sale Number', 'Date', 'Seller', 'Customer', 'Customer Phone', 'Payment Method', 'Amount (Frw)'];
    const rows = data.sales.map(s => [
      `"${s.saleNumber}"`,
      `"${new Date(s.createdAt).toLocaleString()}"`,
      `"${s.seller?.fullName || ''}"`,
      `"${s.customerName || 'Walk-in'}"`,
      `"${s.customerPhone || ''}"`,
      `"${s.paymentMethod}"`,
      s.totalAmount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `romantic_t_solutions_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading operational reports...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <FileText className="w-8 h-8 text-brand-red" />
            <span>Operational & Financial Reports</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Official business records, audit trails & exportable summaries for Romantic T Solutions Ltd
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-brand-dark hover:bg-black text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase text-brand-red tracking-wider">Official Executive Summary</span>
          <h2 className="font-black text-xl text-brand-dark mt-1">Quarterly Financial & Operational Metrics</h2>
          <p className="text-xs text-gray-400">Generated on {new Date().toLocaleString()}</p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-brand-soft border border-brand-border rounded-2xl">
            <span className="text-gray-500 font-bold block mb-1">Gross Sales Revenue</span>
            <b className="text-xl font-black text-brand-red">{formatCurrency(data?.overview.totalRevenue || 0)}</b>
          </div>
          <div className="p-4 bg-brand-soft border border-brand-border rounded-2xl">
            <span className="text-gray-500 font-bold block mb-1">Completed Sales</span>
            <b className="text-xl font-black text-brand-dark">{data?.overview.totalSalesCount || 0}</b>
          </div>
          <div className="p-4 bg-brand-soft border border-brand-border rounded-2xl">
            <span className="text-gray-500 font-bold block mb-1">Active Products</span>
            <b className="text-xl font-black text-brand-dark">{data?.overview.totalProducts || 0}</b>
          </div>
          <div className="p-4 bg-brand-soft border border-brand-border rounded-2xl">
            <span className="text-gray-500 font-bold block mb-1">Active Events</span>
            <b className="text-xl font-black text-brand-yellow">{data?.overview.activeEvents || 0}</b>
          </div>
        </div>

        {/* Division Breakdown */}
        {data?.divisionRevenue && Object.keys(data.divisionRevenue).length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="font-extrabold text-sm text-brand-dark">Revenue by Division</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(data.divisionRevenue).map(([divName, val]) => (
                <div key={divName} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-500 block truncate">{divName}</span>
                  <b className="text-sm font-extrabold text-brand-dark">{formatCurrency(val)}</b>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions Table */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-brand-dark">Recent Verified Transactions (Last {data?.sales.length || 0})</h4>
            <span className="text-xs text-gray-400">All prices in Rwandan Francs (Frw)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-brand-soft text-brand-dark border-b font-extrabold">
                  <th className="p-3">Sale #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.sales.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-brand-dark">{s.saleNumber}</td>
                    <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-semibold text-brand-dark">{s.customerName || 'Walk-in Customer'}</td>
                    <td className="p-3 text-gray-600">{s.seller?.fullName}</td>
                    <td className="p-3 font-bold text-emerald-600">{s.paymentMethod}</td>
                    <td className="p-3 text-right font-black text-brand-red text-sm">{formatCurrency(s.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

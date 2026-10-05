import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await api.get('/audit-log?limit=100');
      setLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading audit log...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Activity className="w-8 h-8 text-brand-yellow" />
            <span>System Audit Trail Log</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Super Admin audit log recording user actions, stock changes, sales, and setting updates
          </p>
        </div>

        <button onClick={loadLogs} className="bg-brand-soft border border-brand-border text-brand-dark hover:bg-brand-yellow font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow transition flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-brand-soft text-brand-dark font-extrabold">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="p-3 text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-bold text-brand-dark">{log.user?.fullName || 'System / Guest'}</td>
                  <td className="p-3">
                    <span className="bg-brand-yellow/20 border border-brand-yellow text-brand-dark font-black px-2 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-gray-700">{log.entity}</td>
                  <td className="p-3 font-mono text-gray-400 text-[10px]">{log.metadata || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

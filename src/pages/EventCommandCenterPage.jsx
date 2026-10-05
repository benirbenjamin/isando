import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Users, CheckSquare, Clock, MapPin, Phone, ShieldCheck, CheckCircle2, UserCheck, Play, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EventCommandCenterPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  async function loadCommandCenter() {
    try {
      const res = await api.get(`/events/${id}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommandCenter();
    const interval = setInterval(loadCommandCenter, 10000); // Live poll every 10s
    return () => clearInterval(interval);
  }, [id]);

  const handleCheckIn = async (action) => {
    setCheckingIn(true);
    try {
      await api.post(`/events/${id}/check-in`, { action });
      loadCommandCenter();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleUpdateEventStatus = async (status) => {
    try {
      await api.put(`/events/${id}`, { status });
      loadCommandCenter();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading Event Command Center...</div>;

  const event = data?.event;
  const cc = data?.commandCenter || {};
  const teamRoleStats = cc.teamRoleStats || {};
  const attendance = cc.attendance || {};
  const taskStats = cc.taskStats || {};

  const myAssignment = event?.assignments?.find(a => a.userId === user?.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link to="/events" className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-brand-red">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>

        {/* Manager Live Status Control */}
        <div className="flex gap-2">
          {event?.status !== 'LIVE' ? (
            <button
              onClick={() => handleUpdateEventStatus('LIVE')}
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5 animate-pulse"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START LIVE EVENT</span>
            </button>
          ) : (
            <button
              onClick={() => handleUpdateEventStatus('COMPLETED')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow"
            >
              <span>MARK EVENT COMPLETED</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Event Command Header Card */}
      <div className="bg-gradient-to-r from-brand-dark via-gray-900 to-[#1C1F27] text-white rounded-3xl p-6 shadow-xl border-l-8 border-brand-yellow space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-black px-3 py-1 rounded-full ${event?.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-yellow text-brand-dark'}`}>
                STATUS: {event?.status}
              </span>
              <span className="text-xs text-gray-300 font-bold">{event?.eventType}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">{event?.name}</h1>
            <p className="text-xs text-gray-400 mt-1">
              Venue: {event?.venue} &bull; Client: {event?.clientName} ({event?.clientPhone})
            </p>
          </div>

          {/* Quick Check-In Action for Logged-In Worker */}
          {myAssignment && (
            <div className="bg-white/10 p-3.5 rounded-2xl border border-white/20 text-center flex-shrink-0 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-brand-yellow block mb-1">Your Assigned Duty: {myAssignment.roleName}</span>
              {myAssignment.status === 'PRESENT' ? (
                <button
                  onClick={() => handleCheckIn('CHECK_OUT')}
                  disabled={checkingIn}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-black text-xs px-4 py-2 rounded-xl w-full"
                >
                  {checkingIn ? 'Updating...' : `Checked In (${new Date(myAssignment.checkInTime).toLocaleTimeString()}) - Check Out`}
                </button>
              ) : (
                <button
                  onClick={() => handleCheckIn('CHECK_IN')}
                  disabled={checkingIn}
                  className="bg-[#25D366] hover:bg-[#1faa52] text-white font-black text-xs px-5 py-2.5 rounded-xl shadow w-full animate-bounce"
                >
                  {checkingIn ? 'Checking in...' : 'CHECK IN NOW'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* COMMAND CENTER METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Team Active Status by Role */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-brand-dark flex items-center gap-2 border-b pb-2">
            <Users className="w-5 h-5 text-brand-yellow" />
            <span>TEAM ACTIVE STATUS</span>
          </h3>

          <div className="space-y-3 text-xs">
            {Object.keys(teamRoleStats).length > 0 ? (
              Object.entries(teamRoleStats).map(([roleName, stats]) => (
                <div key={roleName} className="p-3 bg-brand-soft border border-brand-border rounded-xl">
                  <div className="flex justify-between items-center mb-1 font-bold">
                    <span className="text-brand-dark">{roleName}s</span>
                    <span className={stats.active === stats.total ? 'text-emerald-600 font-extrabold' : 'text-brand-red'}>
                      {stats.active}/{stats.total} Active
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Workers: {stats.workers.map(w => w.user?.fullName).join(', ')}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No team workers assigned</p>
            )}
          </div>
        </div>

        {/* 2. Tasks Progress */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-brand-dark flex items-center gap-2 border-b pb-2">
            <CheckSquare className="w-5 h-5 text-brand-red" />
            <span>TASK STATUS</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <b className="text-lg font-black text-emerald-700 block">{taskStats.completed || 0}</b>
              <span className="text-gray-600 font-bold">Completed</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <b className="text-lg font-black text-amber-700 block">{taskStats.inProgress || 0}</b>
              <span className="text-gray-600 font-bold">In Progress</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl">
              <b className="text-lg font-black text-gray-700 block">{taskStats.pending || 0}</b>
              <span className="text-gray-600 font-bold">Pending</span>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
              <b className="text-lg font-black text-brand-red block">{taskStats.blocked || 0}</b>
              <span className="text-gray-600 font-bold">Blocked</span>
            </div>
          </div>
        </div>

        {/* 3. Overall Attendance Breakdown */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-brand-dark flex items-center gap-2 border-b pb-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>ATTENDANCE CHECK-IN</span>
          </h3>

          <div className="text-center py-2">
            <div className="text-3xl font-black text-brand-dark">{attendance.totalCheckedIn}/{attendance.totalAssigned}</div>
            <span className="text-xs text-gray-500 font-bold">Present On-Site ({attendance.percentage}%)</span>
          </div>

          <div className="space-y-2 text-xs max-h-48 overflow-y-auto no-scrollbar">
            {event?.assignments?.map(a => (
              <div key={a.id} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                <span className="font-bold text-brand-dark">{a.user?.fullName} ({a.roleName})</span>
                <span className={`font-extrabold text-[10px] ${a.status === 'PRESENT' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {a.status === 'PRESENT' ? `Present ${new Date(a.checkInTime).toLocaleTimeString()}` : 'Not checked in'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

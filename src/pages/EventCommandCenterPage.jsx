import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, CheckSquare, Clock, MapPin, Phone, ShieldCheck, 
  CheckCircle2, UserCheck, Play, ArrowLeft, MessageSquare, Edit3, 
  Trash2, Send, Check, AlertTriangle, Plus, Sparkles, MessageCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatTimeDisplay, normalizeTimeTo24h, computeDynamicStatus } from './EventsPage';

export default function EventCommandCenterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission('events.manage') || user?.isAdmin;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  // Edit & Delete modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    clientName: '',
    clientPhone: '',
    eventType: 'Wedding',
    venue: '',
    date: '',
    startTime: '08:00',
    endTime: '20:00',
    status: 'PLANNING',
    description: '',
  });

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef(null);

  // Task creation state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [submittingTask, setSubmittingTask] = useState(false);

  async function loadCommandCenter() {
    try {
      const res = await api.get(`/events/${id}`);
      setData(res);
      if (res.commandCenter?.messages || res.event?.messages) {
        setChatMessages(res.commandCenter?.messages || res.event?.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommandCenter();
    const interval = setInterval(loadCommandCenter, 6000); // Live poll every 6s for realtime chat/checkin
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleCheckIn = async (action, targetUserId = null) => {
    setCheckingIn(true);
    try {
      await api.post(`/events/${id}/check-in`, { 
        action,
        userId: targetUserId || user?.id
      });
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

  const handleOpenEdit = () => {
    if (!event) return;
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
    setEditForm({
      name: event.name || '',
      clientName: event.clientName || '',
      clientPhone: event.clientPhone || '',
      eventType: event.eventType || 'Wedding',
      venue: event.venue || '',
      date: eventDate,
      startTime: normalizeTimeTo24h(event.startTime),
      endTime: normalizeTimeTo24h(event.endTime),
      status: event.status || 'PLANNING',
      description: event.description || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${id}`, {
        ...editForm,
        startTime: normalizeTimeTo24h(editForm.startTime),
        endTime: normalizeTimeTo24h(editForm.endTime),
      });
      setShowEditModal(false);
      loadCommandCenter();
    } catch (err) {
      alert(err.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await api.delete(`/events/${id}`);
      setShowDeleteModal(false);
      navigate('/events');
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    const convId = conversationId;
    if (!text || !convId) return;

    setSendingChat(true);
    try {
      await api.post(`/messages/conversations/${convId}/messages`, { text });
      setChatInput('');
      loadCommandCenter();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSubmittingTask(true);
    try {
      await api.post('/tasks', {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        eventId: id,
      });
      setNewTaskTitle('');
      loadCommandCenter();
    } catch (err) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/tasks/${taskId}/status`, { status: nextStatus });
      loadCommandCenter();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  if (loading) return <div className="text-center py-24 text-xs font-bold text-gray-400">Loading Event Command Center...</div>;

  const event = data?.event;
  const cc = data?.commandCenter || {};
  const teamRoleStats = cc.teamRoleStats || {};
  const attendance = cc.attendance || {};
  const taskStats = cc.taskStats || {};
  const conversationId = event?.conversationId || cc?.conversationId;
  const myAssignment = event?.assignments?.find(a => a.userId === user?.id);
  const tasks = event?.tasks || [];
  const dynamicStatus = computeDynamicStatus(event);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-black text-gray-600 hover:text-brand-red transition">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={handleOpenEdit}
                className="bg-gray-100 hover:bg-gray-200 text-brand-dark font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Event</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-50 hover:bg-red-100 text-brand-red font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
            </>
          )}

          {event?.status !== 'LIVE' ? (
            <button
              onClick={() => handleUpdateEventStatus('LIVE')}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5 animate-pulse"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>START LIVE EVENT</span>
            </button>
          ) : (
            <button
              onClick={() => handleUpdateEventStatus('COMPLETED')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow"
            >
              <span>MARK EVENT COMPLETED</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Event Command Header Card */}
      <div className="bg-gradient-to-r from-brand-dark via-gray-900 to-[#1C1F27] text-white rounded-3xl p-6 sm:p-7 shadow-xl border-l-8 border-brand-yellow space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 ${
                dynamicStatus === 'LIVE' 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : dynamicStatus === 'COMPLETED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-yellow text-brand-dark'
              }`}>
                {dynamicStatus === 'LIVE' && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                <span>STATUS: {dynamicStatus}</span>
              </span>
              <span className="text-xs text-gray-300 font-bold bg-white/10 px-2.5 py-0.5 rounded-full">{event?.eventType}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">{event?.name}</h1>
            <p className="text-xs text-gray-300 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-red" />
                <span>{event?.venue}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{event?.clientName} ({event?.clientPhone})</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-yellow" />
                <span>
                  {event?.date ? new Date(event.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                  {' • '}
                  {formatTimeDisplay(event?.startTime)} - {formatTimeDisplay(event?.endTime)}
                </span>
              </span>
            </p>
          </div>

          {/* Quick Check-In Action for Logged-In Worker */}
          {myAssignment && (
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 text-center flex-shrink-0 w-full md:w-auto">
              <span className="text-[11px] font-bold text-brand-yellow block mb-1.5">
                Your Assigned Duty: {myAssignment.roleName}
              </span>
              {myAssignment.status === 'PRESENT' || myAssignment.checkInTime ? (
                <button
                  onClick={() => handleCheckIn('CHECK_OUT')}
                  disabled={checkingIn}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-black text-xs px-4 py-2.5 rounded-xl w-full transition"
                >
                  {checkingIn ? 'Updating...' : `Checked In (${new Date(myAssignment.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) - Check Out`}
                </button>
              ) : (
                <button
                  onClick={() => handleCheckIn('CHECK_IN')}
                  disabled={checkingIn}
                  className="bg-[#25D366] hover:bg-[#1faa52] text-white font-black text-xs px-5 py-2.5 rounded-xl shadow w-full animate-bounce transition"
                >
                  {checkingIn ? 'Checking in...' : 'CHECK IN NOW ON-SITE'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Specifications / What Made banner */}
        {event?.description && (
          <div className="pt-3 border-t border-white/10 text-xs text-gray-300">
            <span className="font-extrabold text-brand-yellow uppercase text-[10px] block mb-0.5">What was prepared / Specifications:</span>
            <p className="italic">{event.description}</p>
          </div>
        )}
      </div>

      {/* METRICS & OVERVIEW GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Team Active Status by Role */}
        <div className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2 border-b pb-2">
            <Users className="w-4 h-4 text-brand-yellow" />
            <span>TEAM ACTIVE STATUS BY ROLE</span>
          </h3>

          <div className="space-y-3 text-xs">
            {Object.keys(teamRoleStats).length > 0 ? (
              Object.entries(teamRoleStats).map(([roleName, stats]) => (
                <div key={roleName} className="p-3 bg-brand-soft border border-brand-border rounded-xl">
                  <div className="flex justify-between items-center mb-1 font-bold">
                    <span className="text-brand-dark">{roleName}s</span>
                    <span className={stats.active === stats.total ? 'text-emerald-600 font-extrabold' : 'text-brand-red font-black'}>
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
          <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2 border-b pb-2">
            <CheckSquare className="w-4 h-4 text-brand-red" />
            <span>TASK STATUS & PROGRESS</span>
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
          <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2 border-b pb-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>WORKER CHECK-IN TIMESTAMPS</span>
          </h3>

          <div className="text-center py-1">
            <div className="text-3xl font-black text-brand-dark">{attendance.totalCheckedIn}/{attendance.totalAssigned}</div>
            <span className="text-xs text-gray-500 font-bold">Present On-Site ({attendance.percentage}%)</span>
          </div>

          <div className="space-y-2 text-xs max-h-56 overflow-y-auto no-scrollbar">
            {event?.assignments?.map(a => {
              const isPresent = a.status === 'PRESENT' || a.checkInTime;
              return (
                <div key={a.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-brand-dark block text-xs">{a.user?.fullName}</span>
                    <span className="text-[10px] text-amber-900 font-bold">{a.roleName}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-black text-[10px] block ${isPresent ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {isPresent ? 'PRESENT' : 'NOT CHECKED IN'}
                    </span>
                    {a.checkInTime && (
                      <span className="text-[9px] text-gray-500 font-semibold block">
                        {new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(a.checkInTime).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOWER SECTION: LIVE TEAM CHAT & TASK MILESTONES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INLINE LIVE TEAM CHAT */}
        <div className="bg-white border border-brand-border rounded-3xl p-5 shadow-sm flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b pb-3 mb-3 flex-shrink-0">
            <h3 className="font-black text-base text-brand-dark flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-yellow" />
              <span>LIVE TEAM DISCUSSION CHAT</span>
            </h3>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
              Live Room
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-brand-soft rounded-2xl mb-3 no-scrollbar">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <span>No messages yet. Send an update to the team!</span>
              </div>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-gray-500 font-bold">
                      <span>{isMe ? 'You' : msg.sender?.fullName || 'Crew'}</span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm ${
                      isMe ? 'bg-brand-yellow text-brand-dark rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 flex-shrink-0">
            <input
              type="text"
              placeholder="Send message to crew on-site..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 p-3 bg-brand-soft border border-brand-border rounded-xl text-xs font-bold outline-none focus:border-brand-yellow"
            />
            <button
              type="submit"
              disabled={sendingChat || !chatInput.trim()}
              className="bg-brand-red hover:bg-brand-redDark text-white p-3 rounded-xl font-bold transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* TASK MILESTONES & WHAT HAPPENED */}
        <div className="bg-white border border-brand-border rounded-3xl p-5 shadow-sm flex flex-col h-[480px]">
          <div className="border-b pb-3 mb-3 flex-shrink-0">
            <h3 className="font-black text-base text-brand-dark flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-red" />
              <span>WHAT HAPPENED & EVENT MILESTONES</span>
            </h3>
          </div>

          {canManage && (
            <form onSubmit={handleCreateTask} className="flex gap-2 mb-3 flex-shrink-0 text-xs">
              <input
                type="text"
                placeholder="Log event milestone / task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
              />
              <button
                type="submit"
                disabled={submittingTask || !newTaskTitle.trim()}
                className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-4 py-2.5 rounded-xl font-black transition"
              >
                + Add
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 italic">
                No milestone tasks recorded for this event yet.
              </div>
            ) : (
              tasks.map(task => {
                const isDone = task.status === 'COMPLETED';
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.status)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                      isDone ? 'bg-emerald-50/70 border-emerald-200 text-gray-500' : 'bg-white border-gray-200 hover:border-brand-yellow'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-xs font-bold ${isDone ? 'line-through text-gray-400' : 'text-brand-dark'}`}>
                        {task.title}
                      </span>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                      task.priority === 'URGENT' ? 'bg-red-100 text-red-700' : task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-red" />
                <span>Edit Event Details</span>
              </h3>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.clientName}
                    onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Client Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.clientPhone}
                    onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Venue Location *</label>
                  <input
                    type="text"
                    required
                    value={editForm.venue}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Start Time (Picker) *</label>
                  <input
                    type="time"
                    required
                    value={editForm.startTime}
                    onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">End Time (Picker) *</label>
                  <input
                    type="time"
                    required
                    value={editForm.endTime}
                    onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Status Override</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="PLANNING">PLANNING</option>
                  <option value="LIVE">LIVE</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Description & Requirements</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black shadow-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-pop">
            <div className="w-14 h-14 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-brand-dark">Delete Event?</h3>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently delete this event, worker assignments, check-in history, and team chats.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                className="flex-1 bg-brand-red hover:bg-brand-redDark text-white py-2.5 rounded-xl font-black text-xs shadow-md transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

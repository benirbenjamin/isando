import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Plus, Users, ArrowRight, UserPlus, Phone, MapPin, 
  Sparkles, MessageSquare, Edit3, Trash2, Clock, CheckCircle2, 
  XCircle, AlertCircle, Send, CheckSquare, ChevronRight, Eye,
  Play, Check, Loader2, ShieldCheck, UserCheck, MessageCircle,
  FileText, Activity, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';

/**
 * Normalizes any time string (like '08:00 AM', '2:30 PM', '14:30') into standard 24h 'HH:mm'
 * for native HTML5 <input type="time">
 */
export function normalizeTimeTo24h(str) {
  if (!str) return '08:00';
  const match = str.toString().trim().match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return '08:00';
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats a time string into friendly 12h display (e.g. '08:00 AM')
 */
export function formatTimeDisplay(str) {
  if (!str) return '';
  const match = str.toString().trim().match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return str;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Computes event status dynamically based on current time:
 * PLANNING -> LIVE (when now >= start && now <= end)
 * LIVE -> COMPLETED (when now > end)
 */
export function computeDynamicStatus(evt, now = new Date()) {
  if (!evt) return 'PLANNING';
  if (evt.status === 'CANCELLED') return 'CANCELLED';
  if (!evt.date) return evt.status || 'PLANNING';

  try {
    const eventDate = new Date(evt.date);
    const parseTimeToMinutes = (tStr) => {
      if (!tStr) return null;
      const match = tStr.toString().trim().match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const startMins = parseTimeToMinutes(evt.startTime);
    const endMins = parseTimeToMinutes(evt.endTime);

    const year = eventDate.getFullYear();
    const month = eventDate.getMonth();
    const day = eventDate.getDate();

    const startDateTime = new Date(year, month, day, startMins !== null ? Math.floor(startMins / 60) : 0, startMins !== null ? (startMins % 60) : 0, 0);
    const endDateTime = new Date(year, month, day, endMins !== null ? Math.floor(endMins / 60) : 23, endMins !== null ? (endMins % 60) : 59, 59);

    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    if (now >= startDateTime && now <= endDateTime) {
      return 'LIVE';
    } else if (now > endDateTime) {
      return 'COMPLETED';
    } else {
      return 'PLANNING';
    }
  } catch (e) {
    return evt.status || 'PLANNING';
  }
}

export default function EventsPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('events.create');
  const canManage = hasPermission('events.manage') || user?.isAdmin;

  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nowClock, setNowClock] = useState(new Date());

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected event references
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState('overview'); // 'overview' | 'attendance' | 'chat' | 'activity'

  // Dynamic Event Types with LocalStorage persistence
  const [eventTypes, setEventTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('isando_event_types');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Wedding', 'Conference', 'Party', 'Corporate Event', 'Birthday', 'Anniversary', 'Gusaba & Kuva Ku Muriro', 'Gukwa', 'Concert'];
  });

  // Dynamic Duty Roles with LocalStorage persistence
  const [dutyRoles, setDutyRoles] = useState(() => {
    try {
      const saved = localStorage.getItem('isando_duty_roles');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Photographer', 'Videographer', 'Kitchen Chef', 'Waiter', 'Driver', 'MC', 'Decorator', 'Event Manager', 'Sound Engineer', 'Lighting Specialist', 'Security Officer'];
  });

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    clientName: '',
    clientPhone: '',
    eventType: 'Wedding',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '20:00',
    description: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
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

  const [assignForm, setAssignForm] = useState({
    userId: '',
    roleName: 'Photographer',
  });

  // Details Modal Chat & Task states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [submittingTask, setSubmittingTask] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatBottomRef = useRef(null);

  // Live timer tick every 20 seconds so status badges update dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      setNowClock(new Date());
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  async function loadEventsData() {
    setLoading(true);
    try {
      const [eRes, wRes] = await Promise.all([
        api.get('/events'),
        api.get('/users'),
      ]);
      setEvents(eRes.events || []);
      setWorkers(wRes.users || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEventsData();
  }, []);

  // Poll details modal chat if open and on 'chat' tab
  useEffect(() => {
    if (!showDetailsModal || !selectedEventId) return;

    let pollInterval = null;
    const fetchEventDetails = async (isBackground = false) => {
      if (!isBackground) setDetailsLoading(true);
      try {
        const res = await api.get(`/events/${selectedEventId}`);
        setSelectedEventDetails(res);
        if (res.commandCenter?.messages || res.event?.messages) {
          setChatMessages(res.commandCenter?.messages || res.event?.messages || []);
        }
      } catch (err) {
        console.error('Failed to fetch event details:', err);
      } finally {
        if (!isBackground) setDetailsLoading(false);
      }
    };

    fetchEventDetails(false);

    // Poll every 6 seconds for live chat and check-in updates
    pollInterval = setInterval(() => {
      fetchEventDetails(true);
    }, 6000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [showDetailsModal, selectedEventId]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (detailsTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, detailsTab]);

  const handleAddNewEventType = (newType) => {
    const trimmed = newType.trim();
    if (!trimmed) return;
    if (!eventTypes.includes(trimmed)) {
      const updated = [...eventTypes, trimmed];
      setEventTypes(updated);
      try { localStorage.setItem('isando_event_types', JSON.stringify(updated)); } catch {}
    }
    if (showCreateModal) setCreateForm(prev => ({ ...prev, eventType: trimmed }));
    if (showEditModal) setEditForm(prev => ({ ...prev, eventType: trimmed }));
  };

  const handleAddNewDutyRole = (newRole) => {
    const trimmed = newRole.trim();
    if (!trimmed) return;
    if (!dutyRoles.includes(trimmed)) {
      const updated = [...dutyRoles, trimmed];
      setDutyRoles(updated);
      try { localStorage.setItem('isando_duty_roles', JSON.stringify(updated)); } catch {}
    }
    setAssignForm(prev => ({ ...prev, roleName: trimmed }));
  };

  // Open Details Modal
  const handleOpenDetails = (eventId, defaultTab = 'overview') => {
    setSelectedEventId(eventId);
    setDetailsTab(defaultTab);
    setShowDetailsModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (evt, e) => {
    if (e) e.stopPropagation();
    const eventDate = evt.date ? new Date(evt.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    setEditForm({
      id: evt.id,
      name: evt.name || '',
      clientName: evt.clientName || '',
      clientPhone: evt.clientPhone || '',
      eventType: evt.eventType || 'Wedding',
      venue: evt.venue || '',
      date: eventDate,
      startTime: normalizeTimeTo24h(evt.startTime),
      endTime: normalizeTimeTo24h(evt.endTime),
      status: evt.status || 'PLANNING',
      description: evt.description || '',
    });
    setError('');
    setShowEditModal(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (eventId, e) => {
    if (e) e.stopPropagation();
    setSelectedEventId(eventId);
    setShowDeleteModal(true);
  };

  // Open Assign Modal
  const handleOpenAssign = (eventId, e) => {
    if (e) e.stopPropagation();
    setSelectedEventId(eventId);
    setAssignForm({
      userId: workers[0]?.id || '',
      roleName: dutyRoles[0] || 'Photographer',
    });
    setShowAssignModal(true);
  };

  // Submit Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...createForm,
        startTime: normalizeTimeTo24h(createForm.startTime),
        endTime: normalizeTimeTo24h(createForm.endTime),
      };
      await api.post('/events', payload);
      setShowCreateModal(false);
      await loadEventsData();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name: editForm.name,
        clientName: editForm.clientName,
        clientPhone: editForm.clientPhone,
        eventType: editForm.eventType,
        venue: editForm.venue,
        date: editForm.date,
        startTime: normalizeTimeTo24h(editForm.startTime),
        endTime: normalizeTimeTo24h(editForm.endTime),
        status: editForm.status,
        description: editForm.description,
      };

      await api.put(`/events/${editForm.id}`, payload);
      setShowEditModal(false);
      await loadEventsData();
      if (showDetailsModal && selectedEventId === editForm.id) {
        const refreshed = await api.get(`/events/${editForm.id}`);
        setSelectedEventDetails(refreshed);
      }
    } catch (err) {
      setError(err.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Event
  const handleDeleteEvent = async () => {
    if (!selectedEventId) return;
    setSubmitting(true);
    try {
      await api.delete(`/events/${selectedEventId}`);
      setShowDeleteModal(false);
      if (showDetailsModal) setShowDetailsModal(false);
      await loadEventsData();
    } catch (err) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Worker Assignment
  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !assignForm.userId) return;
    setSubmitting(true);

    try {
      await api.post(`/events/${selectedEventId}/assign`, assignForm);
      setShowAssignModal(false);
      await loadEventsData();
      if (showDetailsModal && selectedEventId) {
        const refreshed = await api.get(`/events/${selectedEventId}`);
        setSelectedEventDetails(refreshed);
      }
    } catch (err) {
      alert(err.message || 'Failed to assign worker');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Worker Check-In / Check-Out from Details Modal
  const handleWorkerCheckIn = async (targetUserId, action = 'CHECK_IN') => {
    if (!selectedEventId) return;
    try {
      await api.post(`/events/${selectedEventId}/check-in`, {
        action,
        userId: targetUserId,
      });
      // Refresh details
      const refreshed = await api.get(`/events/${selectedEventId}`);
      setSelectedEventDetails(refreshed);
      if (refreshed.commandCenter?.messages) {
        setChatMessages(refreshed.commandCenter.messages);
      }
      await loadEventsData();
    } catch (err) {
      alert(err.message || 'Failed to update check-in status');
    }
  };

  // Send Chat Message inside Event Details Modal
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    const convId = selectedEventDetails?.event?.conversationId || selectedEventDetails?.commandCenter?.conversationId;
    if (!text || !convId) return;

    setSendingChat(true);
    try {
      await api.post(`/messages/conversations/${convId}/messages`, { text });
      setChatInput('');
      const refreshed = await api.get(`/events/${selectedEventId}`);
      setSelectedEventDetails(refreshed);
      if (refreshed.commandCenter?.messages) {
        setChatMessages(refreshed.commandCenter.messages);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  // Add Task to Event from Details Modal
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedEventId) return;
    setSubmittingTask(true);
    try {
      await api.post('/tasks', {
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        eventId: selectedEventId,
      });
      setNewTaskTitle('');
      const refreshed = await api.get(`/events/${selectedEventId}`);
      setSelectedEventDetails(refreshed);
      await loadEventsData();
    } catch (err) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmittingTask(false);
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.put(`/tasks/${taskId}/status`, { status: nextStatus });
      const refreshed = await api.get(`/events/${selectedEventId}`);
      setSelectedEventDetails(refreshed);
      await loadEventsData();
    } catch (err) {
      alert(err.message || 'Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading events operations...</span>
      </div>
    );
  }

  const workerOptions = workers.map(w => ({
    value: w.id,
    label: w.fullName,
    subtitle: `${w.role?.name || 'Staff'} • ${w.phone || w.email || 'No contact'}`
  }));

  const activeEvent = selectedEventDetails?.event;
  const cc = selectedEventDetails?.commandCenter || {};
  const activeAssignments = activeEvent?.assignments || [];
  const activeTasks = activeEvent?.tasks || [];
  const totalCheckedIn = activeAssignments.filter(a => a.status === 'PRESENT' || a.checkInTime).length;
  const totalAssigned = activeAssignments.length;
  const attendanceRate = totalAssigned > 0 ? Math.round((totalCheckedIn / totalAssigned) * 100) : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-yellow" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">
                Event Operations Management
              </h1>
              <p className="text-xs text-brand-muted mt-0.5">
                Dynamic live scheduling, worker check-in timestamps, team chat & command control
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setError('');
              setShowCreateModal(true);
            }}
            className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* Events List Grid */}
      {events.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-brand-yellow">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-brand-dark">No Events Scheduled</h3>
            <p className="text-xs text-gray-500 mt-1">
              Create an event to organize team workers, track on-site check-in times, and coordinate live chats.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-black text-xs px-6 py-2.5 rounded-xl shadow transition"
            >
              + Create First Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(evt => {
            const dynamicStatus = computeDynamicStatus(evt, nowClock);
            const isLive = dynamicStatus === 'LIVE';
            const isCompleted = dynamicStatus === 'COMPLETED';
            const checkedInCount = evt.assignments?.filter(a => a.status === 'PRESENT' || a.checkInTime).length || 0;
            const assignCount = evt.assignments?.length || 0;

            return (
              <div 
                key={evt.id} 
                onClick={() => handleOpenDetails(evt.id, 'overview')}
                className={`group bg-white border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isLive 
                    ? 'border-red-400 ring-2 ring-red-400/20 shadow-red-50' 
                    : 'border-brand-border hover:border-brand-yellow'
                }`}
              >
                {/* Top Status & Event Type Row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                        isLive 
                          ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                          : isCompleted 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-brand-yellow text-brand-dark'
                      }`}>
                        {isLive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                        <span>{dynamicStatus}</span>
                      </span>

                      <span className="text-[11px] font-bold text-gray-600 bg-brand-soft px-2.5 py-0.5 rounded-full border border-brand-border">
                        {evt.eventType}
                      </span>
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {canManage && (
                        <>
                          <button
                            title="Edit Event"
                            onClick={(e) => handleOpenEdit(evt, e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete Event"
                            onClick={(e) => handleOpenDelete(evt.id, e)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-brand-dark group-hover:text-brand-red transition line-clamp-1">
                    {evt.name}
                  </h3>

                  {/* Event Details snippet */}
                  <div className="space-y-2 mt-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-red flex-shrink-0" />
                      <span className="truncate">Venue: <strong className="text-brand-dark">{evt.venue}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">Client: <strong className="text-brand-dark">{evt.clientName}</strong> ({evt.clientPhone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span>
                        {new Date(evt.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' • '}
                        <span className="font-bold text-brand-dark">
                          {formatTimeDisplay(evt.startTime) || '08:00 AM'} - {formatTimeDisplay(evt.endTime) || '08:00 PM'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Worker Attendance Bar snippet */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100">
                    <div className="flex justify-between items-center text-[11px] mb-1.5">
                      <span className="font-extrabold text-brand-dark flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-brand-yellow" />
                        <span>Crew Check-in:</span>
                      </span>
                      <span className={`font-black ${checkedInCount === assignCount && assignCount > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {checkedInCount} / {assignCount} Present ({assignCount > 0 ? Math.round((checkedInCount / assignCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${checkedInCount === assignCount && assignCount > 0 ? 'bg-emerald-500' : 'bg-brand-yellow'}`}
                        style={{ width: `${assignCount > 0 ? (checkedInCount / assignCount) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Assigned Worker Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {evt.assignments && evt.assignments.length > 0 ? (
                        evt.assignments.slice(0, 4).map(a => (
                          <span 
                            key={a.id} 
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              a.status === 'PRESENT' || a.checkInTime 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-brand-soft text-brand-dark border-brand-border'
                            }`}
                          >
                            <span>{a.user?.fullName}</span>
                            <span className="opacity-70 font-semibold">({a.roleName})</span>
                            {(a.status === 'PRESENT' || a.checkInTime) && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No workers assigned yet</span>
                      )}
                      {evt.assignments?.length > 4 && (
                        <span className="text-[10px] font-bold text-gray-400 px-1 py-0.5">
                          +{evt.assignments.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenDetails(evt.id, 'overview')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-brand-dark py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-dark" />
                    <span>Details</span>
                  </button>

                  {canManage && (
                    <button
                      onClick={(e) => handleOpenAssign(evt.id, e)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                      <span>Assign</span>
                    </button>
                  )}

                  <Link
                    to={`/events/${evt.id}`}
                    className="flex-1 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-2 px-3 rounded-xl font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow transition"
                  >
                    <span>Command</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. COMPREHENSIVE EVENT DETAILS MODAL (Card Click / Details Button) */}
      {/* ========================================================================= */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl animate-pop max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-4 flex-shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 ${
                    computeDynamicStatus(activeEvent, nowClock) === 'LIVE'
                      ? 'bg-red-500 text-white animate-pulse'
                      : computeDynamicStatus(activeEvent, nowClock) === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-yellow text-brand-dark'
                  }`}>
                    {computeDynamicStatus(activeEvent, nowClock) === 'LIVE' && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                    <span>{computeDynamicStatus(activeEvent, nowClock)}</span>
                  </span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {activeEvent?.eventType || 'Event'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-brand-dark leading-tight">
                  {activeEvent?.name || 'Loading Event Details...'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {canManage && activeEvent && (
                  <>
                    <button
                      onClick={(e) => handleOpenEdit(activeEvent, e)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-brand-dark font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(activeEvent.id, e)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-brand-red font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-100 gap-1 pt-2 flex-shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setDetailsTab('overview')}
                className={`px-4 py-2.5 font-black text-xs rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  detailsTab === 'overview'
                    ? 'border-brand-red text-brand-red bg-red-50/50'
                    : 'border-transparent text-gray-500 hover:text-brand-dark'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Overview & What Made</span>
              </button>

              <button
                onClick={() => setDetailsTab('attendance')}
                className={`px-4 py-2.5 font-black text-xs rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  detailsTab === 'attendance'
                    ? 'border-brand-red text-brand-red bg-red-50/50'
                    : 'border-transparent text-gray-500 hover:text-brand-dark'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Worker Check-Ins ({totalCheckedIn}/{totalAssigned})</span>
              </button>

              <button
                onClick={() => setDetailsTab('chat')}
                className={`px-4 py-2.5 font-black text-xs rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  detailsTab === 'chat'
                    ? 'border-brand-red text-brand-red bg-red-50/50'
                    : 'border-transparent text-gray-500 hover:text-brand-dark'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Team Live Chat</span>
              </button>

              <button
                onClick={() => setDetailsTab('activity')}
                className={`px-4 py-2.5 font-black text-xs rounded-t-xl transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
                  detailsTab === 'activity'
                    ? 'border-brand-red text-brand-red bg-red-50/50'
                    : 'border-transparent text-gray-500 hover:text-brand-dark'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>What Happened & Tasks</span>
              </button>
            </div>

            {/* Modal Tab Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {detailsLoading && !activeEvent ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mx-auto mb-2" />
                  <span className="text-xs font-bold text-gray-500">Loading details...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & WHAT MADE */}
                  {detailsTab === 'overview' && (
                    <div className="space-y-5">
                      {/* Event Key Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-3.5 bg-brand-soft border border-brand-border rounded-2xl space-y-1">
                          <span className="text-[11px] font-bold text-gray-400 block uppercase">Venue & Location</span>
                          <div className="flex items-center gap-2 text-xs font-black text-brand-dark">
                            <MapPin className="w-4 h-4 text-brand-red flex-shrink-0" />
                            <span>{activeEvent?.venue}</span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-brand-soft border border-brand-border rounded-2xl space-y-1">
                          <span className="text-[11px] font-bold text-gray-400 block uppercase">Date & Running Hours</span>
                          <div className="flex items-center gap-2 text-xs font-black text-brand-dark">
                            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span>
                              {activeEvent?.date ? new Date(activeEvent.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                              {' • '}
                              {formatTimeDisplay(activeEvent?.startTime)} - {formatTimeDisplay(activeEvent?.endTime)}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-brand-soft border border-brand-border rounded-2xl space-y-1">
                          <span className="text-[11px] font-bold text-gray-400 block uppercase">Client Contact</span>
                          <div className="flex items-center justify-between gap-2 text-xs font-black text-brand-dark">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>{activeEvent?.clientName} ({activeEvent?.clientPhone})</span>
                            </div>
                            {activeEvent?.clientPhone && (
                              <a
                                href={`tel:${activeEvent.clientPhone}`}
                                className="text-[11px] text-emerald-600 hover:underline font-bold"
                              >
                                Call
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 bg-brand-soft border border-brand-border rounded-2xl space-y-1">
                          <span className="text-[11px] font-bold text-gray-400 block uppercase">Assigned Event Manager</span>
                          <div className="flex items-center gap-2 text-xs font-black text-brand-dark">
                            <ShieldCheck className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                            <span>{activeEvent?.manager?.fullName || 'Event Operations Lead'}</span>
                          </div>
                        </div>
                      </div>

                      {/* What Made / Specifications & Description */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                        <h4 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Event Description & What Was Prepared (Specifications)</span>
                        </h4>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {activeEvent?.description || 'No detailed specifications recorded for this event yet.'}
                        </p>
                      </div>

                      {/* Quick Snapshot Metrics */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <span className="text-xl font-black text-brand-dark block">{totalAssigned}</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Assigned Staff</span>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <span className="text-xl font-black text-emerald-700 block">{totalCheckedIn}</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Checked In</span>
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <span className="text-xl font-black text-blue-700 block">{activeTasks.length}</span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Total Tasks</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Link
                          to={`/events/${activeEvent?.id}`}
                          className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-black text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow transition"
                        >
                          <span>Open Full Command Center</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: WORKER CHECK-INS & ATTENDANCE */}
                  {detailsTab === 'attendance' && (
                    <div className="space-y-4">
                      {/* Attendance Progress summary */}
                      <div className="p-4 bg-brand-soft border border-brand-border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="text-base font-black text-brand-dark">
                            {totalCheckedIn} of {totalAssigned} Workers Present on Site ({attendanceRate}%)
                          </div>
                          <p className="text-xs text-gray-500">
                            Real-time timestamps recorded automatically upon worker arrival and duty start.
                          </p>
                        </div>

                        {canManage && (
                          <button
                            onClick={(e) => handleOpenAssign(activeEvent.id, e)}
                            className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>+ Assign Another Worker</span>
                          </button>
                        )}
                      </div>

                      {/* Workers Check-in List */}
                      <div className="space-y-2.5">
                        {activeAssignments.length === 0 ? (
                          <div className="text-center py-8 text-xs text-gray-400 italic">
                            No team members assigned to this event yet.
                          </div>
                        ) : (
                          activeAssignments.map(assign => {
                            const isPresent = assign.status === 'PRESENT' || assign.checkInTime;
                            const isCheckedOut = !!assign.checkOutTime;

                            return (
                              <div
                                key={assign.id}
                                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                  isPresent
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                                    isPresent ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {assign.user?.fullName?.charAt(0) || 'W'}
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-black text-xs text-brand-dark">{assign.user?.fullName}</h5>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                        {assign.roleName}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-0.5">
                                      Contact: {assign.user?.phone || assign.user?.email || 'N/A'}
                                    </div>
                                  </div>
                                </div>

                                {/* Check-In Timestamps & Controls */}
                                <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                                  {isPresent ? (
                                    <div className="text-right">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Present</span>
                                      </span>
                                      <div className="text-[10px] text-gray-500 font-bold mt-0.5">
                                        Checked in: {new Date(assign.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(assign.checkInTime).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                                      </div>
                                      {isCheckedOut && (
                                        <div className="text-[10px] text-gray-400">
                                          Checked out: {new Date(assign.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                      Not Checked In Yet
                                    </span>
                                  )}

                                  {/* Quick Manager Check In / Check Out Button */}
                                  {(canManage || user?.id === assign.userId) && (
                                    <div>
                                      {!isPresent ? (
                                        <button
                                          onClick={() => handleWorkerCheckIn(assign.userId, 'CHECK_IN')}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3 py-1.5 rounded-xl shadow-sm transition"
                                        >
                                          Mark Checked In
                                        </button>
                                      ) : !isCheckedOut ? (
                                        <button
                                          onClick={() => handleWorkerCheckIn(assign.userId, 'CHECK_OUT')}
                                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[11px] px-3 py-1.5 rounded-xl transition"
                                        >
                                          Check Out
                                        </button>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TEAM LIVE CHAT */}
                  {detailsTab === 'chat' && (
                    <div className="flex flex-col h-[400px] border border-brand-border rounded-2xl overflow-hidden bg-brand-soft">
                      {/* Chat Messages Log */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 ? (
                          <div className="py-12 text-center text-xs text-gray-400">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <span>No messages yet in this event discussion thread. Say hello!</span>
                          </div>
                        ) : (
                          chatMessages.map(msg => {
                            const isMe = msg.senderId === user?.id;
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                              >
                                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-gray-500 font-bold">
                                  <span>{isMe ? 'You' : msg.sender?.fullName || 'Crew Member'}</span>
                                  <span>&bull;</span>
                                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div
                                  className={`p-3 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed shadow-sm ${
                                    isMe
                                      ? 'bg-brand-yellow text-brand-dark rounded-tr-none'
                                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Chat Input Bar */}
                      <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-brand-border flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type an update or duty report for the team..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-1 p-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs font-bold outline-none focus:border-brand-yellow"
                        />
                        <button
                          type="submit"
                          disabled={sendingChat || !chatInput.trim()}
                          className="bg-brand-red hover:bg-brand-redDark disabled:opacity-50 text-white p-2.5 rounded-xl font-bold transition shadow"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 4: WHAT HAPPENED & TASKS */}
                  {detailsTab === 'activity' && (
                    <div className="space-y-5">
                      {/* Add Task / Incident Form */}
                      {canManage && (
                        <form onSubmit={handleCreateTask} className="p-3.5 bg-brand-soft border border-brand-border rounded-2xl space-y-2.5 text-xs">
                          <span className="font-black text-brand-dark block uppercase text-[11px]">
                            + Record Event Duty / Task Milestone
                          </span>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Stage decor completed, Catering course 1 served..."
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              className="flex-1 p-2.5 bg-white border border-brand-border rounded-xl font-bold"
                            />
                            <select
                              value={newTaskPriority}
                              onChange={(e) => setNewTaskPriority(e.target.value)}
                              className="p-2.5 bg-white border border-brand-border rounded-xl font-bold text-xs"
                            >
                              <option value="LOW">Low Priority</option>
                              <option value="MEDIUM">Medium Priority</option>
                              <option value="HIGH">High Priority</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                            <button
                              type="submit"
                              disabled={submittingTask}
                              className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark px-4 py-2.5 rounded-xl font-black transition"
                            >
                              {submittingTask ? 'Adding...' : 'Add Task'}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Tasks Checklist */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-brand-red" />
                          <span>Event Milestone Tasks ({activeTasks.filter(t => t.status === 'COMPLETED').length}/{activeTasks.length} Completed)</span>
                        </h4>

                        {activeTasks.length === 0 ? (
                          <div className="text-center py-6 text-xs text-gray-400 italic">
                            No milestone tasks recorded for this event yet.
                          </div>
                        ) : (
                          activeTasks.map(task => {
                            const isDone = task.status === 'COMPLETED';
                            return (
                              <div
                                key={task.id}
                                onClick={() => handleToggleTask(task.id, task.status)}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                                  isDone
                                    ? 'bg-emerald-50/70 border-emerald-200 text-gray-500'
                                    : 'bg-white border-gray-200 hover:border-brand-yellow'
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
                                  task.priority === 'URGENT'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority === 'HIGH'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="border-t pt-3 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-gray-400 font-bold">
                Status automatically updates dynamically to LIVE and COMPLETED based on schedule.
              </span>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-brand-dark font-extrabold text-xs px-5 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE EVENT MODAL (With Native Time Picker & HH:mm Format) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-yellow" />
                <span>Create New Event</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding of John & Alice"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={createForm.clientName}
                    onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Client Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0788123456"
                    value={createForm.clientPhone}
                    onChange={(e) => setCreateForm({ ...createForm, clientPhone: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Event Type *</label>
                  <SearchableSelect
                    options={eventTypes}
                    value={createForm.eventType}
                    onChange={(val) => setCreateForm({ ...createForm, eventType: val })}
                    placeholder="-- Select Event Type --"
                    allowAddNew={true}
                    addNewLabel="+ Add New Event Type"
                    onAddNew={handleAddNewEventType}
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Venue Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kigali Convention Center"
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-brand-dark block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={createForm.date}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                      onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                      className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-brand-dark block mb-1">Start Time (Picker) *</label>
                    <div className="relative">
                      <input
                        type="time"
                        required
                        value={createForm.startTime}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          let newEnd = createForm.endTime;
                          if (newStart) {
                            const [sh, sm] = newStart.split(':').map(Number);
                            const eh = (sh + 4) % 24;
                            newEnd = `${String(eh).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')}`;
                          }
                          setCreateForm({ ...createForm, startTime: newStart, endTime: newEnd });
                        }}
                        className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-xs cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-brand-dark block mb-1">End Time (Picker) *</label>
                    <div className="relative">
                      <input
                        type="time"
                        required
                        value={createForm.endTime}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                        onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                        className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-xs cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 bg-amber-50/70 border border-amber-200/60 rounded-xl p-2 text-[11px]">
                  <div className="flex items-center gap-1 text-amber-900 font-bold">
                    <span>⏰</span>
                    <span>Clicking time opens native time picker</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 font-semibold mr-1">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const hh = String(now.getHours()).padStart(2, '0');
                        const mm = String(now.getMinutes()).padStart(2, '0');
                        const endH = String((now.getHours() + 4) % 24).padStart(2, '0');
                        setCreateForm(prev => ({ ...prev, startTime: `${hh}:${mm}`, endTime: `${endH}:${mm}` }));
                      }}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:bg-brand-yellow rounded-lg font-bold transition text-[10px]"
                    >
                      Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm(prev => ({ ...prev, startTime: '09:00', endTime: '17:00' }))}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:bg-brand-yellow rounded-lg font-bold transition text-[10px]"
                    >
                      09:00 - 17:00
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm(prev => ({ ...prev, startTime: '14:00', endTime: '22:00' }))}
                      className="px-2 py-0.5 bg-white border border-gray-200 hover:bg-brand-yellow rounded-lg font-bold transition text-[10px]"
                    >
                      14:00 - 22:00
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Description & Requirements (What was prepared)</label>
                <textarea
                  rows={2}
                  placeholder="Equipment required, guest count, schedule details..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shine-effect transition"
              >
                {submitting ? 'Creating Event...' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT EVENT MODAL */}
      {/* ========================================================================= */}
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

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleUpdateEvent} className="space-y-4 text-xs">
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
                  <label className="font-bold text-brand-dark block mb-1">Event Type *</label>
                  <SearchableSelect
                    options={eventTypes}
                    value={editForm.eventType}
                    onChange={(val) => setEditForm({ ...editForm, eventType: val })}
                    placeholder="-- Select Event Type --"
                    allowAddNew={true}
                    addNewLabel="+ Add New Event Type"
                    onAddNew={handleAddNewEventType}
                  />
                </div>

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
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-brand-dark block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={editForm.date}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-brand-dark block mb-1">Start Time (Picker) *</label>
                    <input
                      type="time"
                      required
                      value={editForm.startTime}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-xs cursor-pointer"
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
                      className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-xs cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Status Override */}
              <div>
                <label className="font-bold text-brand-dark block mb-1">Status Override</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="PLANNING">PLANNING (Auto transitions to LIVE on start time)</option>
                  <option value="LIVE">LIVE (Currently Running)</option>
                  <option value="COMPLETED">COMPLETED (Event Finished)</option>
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
                  disabled={submitting}
                  className="flex-1 bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black shadow-lg transition"
                >
                  {submitting ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE EVENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-pop">
            <div className="w-14 h-14 bg-red-100 text-brand-red rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-brand-dark">Delete Event?</h3>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently delete this event, worker assignments, check-in history, and team chats. This cannot be undone.
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
                disabled={submitting}
                onClick={handleDeleteEvent}
                className="flex-1 bg-brand-red hover:bg-brand-redDark text-white py-2.5 rounded-xl font-black text-xs shadow-md transition"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ASSIGN WORKER MODAL */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-yellow" />
                <span>Assign Worker to Event</span>
              </h3>
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignWorker} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Select Worker Staff *</label>
                <SearchableSelect
                  options={workerOptions}
                  value={assignForm.userId}
                  onChange={(val) => setAssignForm({ ...assignForm, userId: val })}
                  placeholder="-- Search or Choose Staff --"
                  allowAddNew={false}
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Duty Role *</label>
                <SearchableSelect
                  options={dutyRoles}
                  value={assignForm.roleName}
                  onChange={(val) => setAssignForm({ ...assignForm, roleName: val })}
                  placeholder="-- Select Duty Role --"
                  allowAddNew={true}
                  addNewLabel="+ Add Custom Role / Duty"
                  onAddNew={handleAddNewDutyRole}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3.5 rounded-2xl font-black text-sm shadow-md transition"
              >
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

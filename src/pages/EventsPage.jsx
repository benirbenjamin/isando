import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Users, ArrowRight, UserPlus, Phone, MapPin } from 'lucide-react';
import { api } from '../services/api';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [eventForm, setEventForm] = useState({
    name: '',
    clientName: '',
    clientPhone: '',
    eventType: 'Wedding',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00 AM',
    endTime: '08:00 PM',
    description: '',
  });

  const [assignForm, setAssignForm] = useState({
    userId: '',
    roleName: 'Photographer',
  });

  const [error, setError] = useState('');

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEventsData();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/events', eventForm);
      setShowEventModal(false);
      loadEventsData();
    } catch (err) {
      setError(err.message || 'Failed to create event');
    }
  };

  const handleAssignWorker = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !assignForm.userId) return;

    try {
      await api.post(`/events/${selectedEventId}/assign`, assignForm);
      setShowAssignModal(false);
      loadEventsData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading events data...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Calendar className="w-8 h-8 text-brand-yellow" />
            <span>Event Operations Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Weddings, Conferences, Parties & Live Command Centers
          </p>
        </div>

        <button
          onClick={() => setShowEventModal(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(evt => (
          <div key={evt.id} className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${evt.status === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-yellow text-brand-dark'}`}>
                  {evt.status}
                </span>
                <span className="text-xs font-bold text-gray-400">{evt.eventType}</span>
              </div>

              <h3 className="text-xl font-black text-brand-dark">{evt.name}</h3>

              <div className="space-y-1 mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-red" />
                  <span>Venue: <strong>{evt.venue}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Client: {evt.clientName} ({evt.clientPhone})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Date: {new Date(evt.date).toLocaleDateString()} ({evt.startTime} - {evt.endTime})</span>
                </div>
              </div>

              {/* Assigned Team Summary */}
              <div className="mt-4 pt-3 border-t">
                <span className="text-[11px] font-extrabold text-brand-dark block mb-2">Assigned Execution Team ({evt.assignments?.length || 0}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {evt.assignments && evt.assignments.length > 0 ? (
                    evt.assignments.map(a => (
                      <span key={a.id} className="bg-brand-soft border border-brand-border text-[10px] font-bold px-2 py-0.5 rounded-md text-brand-dark">
                        {a.user?.fullName} ({a.roleName})
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-400">No workers assigned yet</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex gap-2">
              <button
                onClick={() => { setSelectedEventId(evt.id); setShowAssignModal(true); }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-brand-dark py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign Worker</span>
              </button>

              <Link
                to={`/events/${evt.id}`}
                className="flex-1 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-2 px-3 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1.5 shadow transition"
              >
                <span>Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Create New Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Wedding of John & Alice"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
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
                    value={eventForm.clientName}
                    onChange={(e) => setEventForm({ ...eventForm, clientName: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Client Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0788123456"
                    value={eventForm.clientPhone}
                    onChange={(e) => setEventForm({ ...eventForm, clientPhone: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Event Type</label>
                  <select
                    value={eventForm.eventType}
                    onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Conference">Conference</option>
                    <option value="Party">Party</option>
                    <option value="Corporate">Corporate Event</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Venue Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kigali Convention Center"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full p-2 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full p-2 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">End Time</label>
                  <input
                    type="text"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full p-2 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black text-sm shadow transition"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Assign Worker to Event</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleAssignWorker} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Select Worker Staff *</label>
                <select
                  required
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="">-- Choose Worker --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.fullName} ({w.role?.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Event Duty Role *</label>
                <select
                  value={assignForm.roleName}
                  onChange={(e) => setAssignForm({ ...assignForm, roleName: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="Photographer">Photographer</option>
                  <option value="Videographer">Videographer</option>
                  <option value="Kitchen Chef">Kitchen Chef</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Driver">Driver</option>
                  <option value="MC">MC</option>
                  <option value="Decorator">Decorator</option>
                  <option value="Event Manager">Event Manager</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition"
              >
                Confirm Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

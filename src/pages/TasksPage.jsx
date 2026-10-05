import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [events, setEvents] = useState([]);
  const [myTasksOnly, setMyTasksOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedUserId: '',
    eventId: '',
    priority: 'MEDIUM',
    dueTime: '',
  });

  const [error, setError] = useState('');

  async function loadTasks() {
    setLoading(true);
    try {
      const [tRes, wRes, eRes] = await Promise.all([
        api.get(`/tasks?myTasksOnly=${myTasksOnly}`),
        api.get('/users'),
        api.get('/events'),
      ]);
      setTasks(tRes.tasks || []);
      setWorkers(wRes.users || []);
      setEvents(eRes.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [myTasksOnly]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/tasks', form);
      setShowModal(false);
      setForm({ title: '', description: '', assignedUserId: '', eventId: '', priority: 'MEDIUM', dueTime: '' });
      loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading tasks...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-brand-red" />
            <span>Task Management & Assignments</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Assign duties to staff, track progress, and update status
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs border transition ${myTasksOnly ? 'bg-brand-yellow border-brand-yellow text-brand-dark shadow' : 'bg-white border-brand-border hover:bg-gray-50'}`}
          >
            {myTasksOnly ? 'My Tasks' : 'All Team Tasks'}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map(t => (
          <div key={t.id} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${t.priority === 'URGENT' ? 'bg-red-500 text-white animate-pulse' : (t.priority === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-brand-dark')}`}>
                  {t.priority} PRIORITY
                </span>
                <span className="text-[11px] font-bold text-gray-400">Status: {t.status}</span>
              </div>

              <h3 className="font-bold text-base text-brand-dark">{t.title}</h3>
              {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}

              <div className="mt-3 text-[11px] text-gray-500 space-y-1">
                <div>Assigned to: <strong>{t.assignedUser?.fullName || 'Role Duty'}</strong></div>
                {t.event && <div>Event: <strong>{t.event.name}</strong></div>}
              </div>
            </div>

            {/* Quick Status Buttons */}
            <div className="pt-3 border-t flex gap-1 text-[11px]">
              <button
                onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                className={`flex-1 py-1.5 rounded-xl font-bold border transition ${t.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white border-amber-500' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                className={`flex-1 py-1.5 rounded-xl font-bold border transition ${t.status === 'COMPLETED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                Completed
              </button>
              <button
                onClick={() => handleUpdateStatus(t.id, 'BLOCKED')}
                className={`flex-1 py-1.5 rounded-xl font-bold border transition ${t.status === 'BLOCKED' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                Blocked
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Create New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare photography gear"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Assign Worker</label>
                <select
                  value={form.assignedUserId}
                  onChange={(e) => setForm({ ...form, assignedUserId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- Unassigned / Any --</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.fullName} ({w.role?.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Link to Event (Optional)</label>
                <select
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- General Task --</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black text-sm shadow transition"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

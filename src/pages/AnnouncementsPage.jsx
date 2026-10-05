import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Plus, MessageSquare, Users, Shield, Layers } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AnnouncementsPage() {
  const { hasPermission } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetAudience: 'EVERYONE',
    targetId: '',
    priority: 'NORMAL',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const [aRes, dRes, rRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/departments'),
        api.get('/roles'),
      ]);
      setAnnouncements(aRes.announcements || []);
      setDepartments(dRes.departments || []);
      setRoles(rRes.roles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/announcements', form);
      setShowModal(false);
      setForm({ title: '', message: '', targetAudience: 'EVERYONE', targetId: '', priority: 'NORMAL' });
      loadAnnouncements();
      if (res.conversationId) {
        navigate(`/messages?conversationId=${res.conversationId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading announcements...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-brand-yellow" />
            <span>Announcements & Thread Communications</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Broadcast targeted instructions to departments, roles, or event teams
          </p>
        </div>

        {hasPermission('announcements.create') && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(ann => (
          <div key={ann.id} className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${ann.priority === 'URGENT' ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-yellow text-brand-dark'}`}>
                  {ann.priority}
                </span>
                <span className="text-xs font-bold text-gray-500">Audience: {ann.targetAudience}</span>
              </div>
              <span className="text-[11px] text-gray-400">{new Date(ann.createdAt).toLocaleString()}</span>
            </div>

            <h3 className="font-extrabold text-lg text-brand-dark">{ann.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{ann.message}</p>

            <div className="pt-3 border-t flex items-center justify-between">
              <span className="text-xs text-gray-500">By: <strong>{ann.createdBy?.fullName}</strong></span>

              {ann.conversationId && (
                <button
                  onClick={() => navigate(`/messages?conversationId=${ann.conversationId}`)}
                  className="bg-brand-soft hover:bg-brand-yellow border border-brand-border text-brand-dark font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-brand-red" />
                  <span>Open Reply Thread</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Publish Announcement</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="WEDDING EVENT — IMPORTANT INSTRUCTIONS"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Target Audience *</label>
                <select
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value, targetId: '' })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="EVERYONE">Everyone (Company-wide)</option>
                  <option value="DEPARTMENT">Specific Department</option>
                  <option value="ROLE">Specific Role</option>
                </select>
              </div>

              {form.targetAudience === 'DEPARTMENT' && (
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Select Department</label>
                  <select
                    value={form.targetId}
                    onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.targetAudience === 'ROLE' && (
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Select Role</label>
                  <select
                    value={form.targetId}
                    onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  >
                    <option value="">-- Choose Role --</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-brand-dark block mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Announcement Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="All photographers must report to venue by 8:00 AM..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition"
              >
                {submitting ? 'Publishing...' : 'Publish Announcement & Thread'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

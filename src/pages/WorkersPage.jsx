import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, KeyRound, CheckCircle2, XCircle, Edit3, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WorkersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleId: '',
    departmentId: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    departmentId: '',
    status: 'ACTIVE',
  });

  const [error, setError] = useState('');

  async function loadUsersData() {
    setLoading(true);
    try {
      const [uRes, rRes, dRes] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/departments'),
      ]);
      setUsers(uRes.users || []);
      setRoles(rRes.roles || []);
      setDepartments(dRes.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsersData();
  }, []);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/users', form);
      setShowModal(false);
      setForm({ email: '', fullName: '', phone: '', password: '', roleId: '', departmentId: '' });
      // Auto-refresh without app reload
      await loadUsersData();
    } catch (err) {
      setError(err.message || 'Failed to create worker');
    }
  };

  const openEditModal = (u) => {
    setEditForm({
      id: u.id,
      fullName: u.fullName || '',
      email: u.email || '',
      phone: u.phone || '',
      roleId: u.roleId || u.role?.id || '',
      departmentId: u.departmentId || u.department?.id || '',
      status: u.status || 'ACTIVE',
    });
    setError('');
    setShowEditModal(true);
  };

  const handleUpdateWorker = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.put(`/users/${editForm.id}`, {
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone,
        roleId: editForm.roleId,
        departmentId: editForm.departmentId || null,
        status: editForm.status,
      });
      setShowEditModal(false);
      // Auto-refresh without app reload
      await loadUsersData();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentUser?.id) {
      return alert('You cannot delete your own account.');
    }
    if (!window.confirm(`Are you sure you want to delete user ${u.fullName} (${u.email})?`)) {
      return;
    }

    try {
      await api.delete(`/users/${u.id}`);
      // Auto-refresh without app reload
      await loadUsersData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUserId}/reset-password`, { newPassword });
      setShowResetModal(false);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (userObj) => {
    const newStatus = userObj.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/users/${userObj.id}`, { status: newStatus });
      await loadUsersData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading workers data...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Users className="w-8 h-8 text-brand-red" />
            <span>Workers & Workforce Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Super Admin & Admin control over staff accounts, roles, departments and permissions
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Worker</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-brand-soft text-brand-dark font-extrabold">
                <th className="p-3">Worker Staff</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-bold text-brand-dark">
                    <div>{u.fullName}</div>
                    <span className="text-[10px] text-gray-400 font-mono">{u.email} &bull; {u.phone || 'No phone'}</span>
                  </td>
                  <td className="p-3">
                    <span className="bg-brand-yellow/30 border border-brand-yellow text-brand-dark font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {u.role?.name || 'Staff'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{u.department?.name || 'General'}</td>
                  <td className="p-3 text-center">
                    <span className={`font-black px-2 py-0.5 rounded text-[10px] ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 text-gray-600 hover:text-brand-dark hover:bg-amber-100 rounded-lg transition"
                      title="Edit User"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedUserId(u.id); setShowResetModal(true); }}
                      className="p-1.5 text-gray-500 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition"
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className="p-1.5 text-gray-500 hover:text-brand-red hover:bg-gray-100 rounded-lg transition"
                      title="Toggle Status"
                    >
                      {u.status === 'ACTIVE' ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Add New Worker Account</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleCreateWorker} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Jean Paul"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jean@romantictsolutions.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="0788123456"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Assign Role *</label>
                <select
                  required
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="">-- Choose Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- General Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shine-effect transition"
              >
                Create Worker Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Edit User Profile & Role</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleUpdateWorker} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">User Role *</label>
                <select
                  required
                  value={editForm.roleId}
                  onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="">-- Choose Role --</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Department</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- General Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3.5 rounded-2xl font-black text-sm shadow-md transition"
              >
                Save User Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">Reset Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 py-2 bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-brand-yellow text-brand-dark font-bold rounded-xl shadow">Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

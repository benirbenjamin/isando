import React, { useState, useEffect } from 'react';
import { Shield, Plus, Check, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RolesPermissionsPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canManage = isAdmin || hasPermission('users.create') || hasPermission('users.edit');

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activePerms, setActivePerms] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadRolesData() {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions'),
      ]);
      const rList = rRes.roles || [];
      setRoles(rList);
      setAllPermissions(pRes.permissions || []);
      if (!selectedRole && rList.length > 0) {
        setSelectedRole(rList[0]);
        setActivePerms(rList[0].permissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRolesData();
  }, []);

  const selectRole = (role) => {
    setSelectedRole(role);
    setActivePerms(role.permissions || []);
  };

  const togglePermission = (code) => {
    if (activePerms.includes(code)) {
      setActivePerms(activePerms.filter(c => c !== code));
    } else {
      setActivePerms([...activePerms, code]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      await api.put(`/roles/${selectedRole.id}`, { permissionCodes: activePerms });
      alert('Permissions saved successfully!');
      loadRolesData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/roles', { name: newRoleName, description: newRoleDesc, permissionCodes: [] });
      setShowRoleModal(false);
      setNewRoleName('');
      setNewRoleDesc('');
      loadRolesData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!canManage) {
    return (
      <div className="text-center py-16 bg-white border border-brand-border rounded-3xl p-8 max-w-md mx-auto space-y-3 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-brand-red mx-auto" />
        <h2 className="text-lg font-black text-brand-dark">Access Restricted</h2>
        <p className="text-xs text-gray-500">Only Super Administrators and Administrators can manage system roles & permissions.</p>
      </div>
    );
  }

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading roles & permissions...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Shield className="w-8 h-8 text-brand-yellow" />
            <span>Dynamic Roles & Permission Matrix</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Super Admin capability: Create custom roles and assign fine-grained API & UI permissions
          </p>
        </div>

        <button
          onClick={() => setShowRoleModal(true)}
          className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {/* Main Roles Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="font-extrabold text-sm text-brand-dark border-b pb-2">System & Custom Roles</h3>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => selectRole(r)}
                className={`w-full p-3 rounded-xl text-left transition flex justify-between items-center ${selectedRole?.id === r.id ? 'bg-brand-dark text-white shadow' : 'hover:bg-gray-100 text-brand-dark'}`}
              >
                <div>
                  <b className="text-xs block">{r.name}</b>
                  <span className="text-[10px] opacity-70 block">{r.usersCount} users assigned</span>
                </div>
                {r.isSystem && (
                  <span className="text-[9px] bg-brand-yellow text-brand-dark font-black px-1.5 py-0.5 rounded">SYSTEM</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Checkbox Matrix */}
        <div className="md:col-span-2 bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-black text-lg text-brand-dark">Permissions for: {selectedRole?.name}</h3>
              <p className="text-xs text-gray-500">{selectedRole?.description || 'Custom role permissions'}</p>
            </div>

            <button
              onClick={handleSavePermissions}
              className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Permissions Matrix</span>
            </button>
          </div>

          {/* Permissions Grouped */}
          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2 no-scrollbar">
            {Object.entries(
              allPermissions.reduce((acc, p) => {
                acc[p.category] = acc[p.category] || [];
                acc[p.category].push(p);
                return acc;
              }, {})
            ).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-black uppercase text-brand-muted border-b border-gray-100 pb-1">{category}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {perms.map(p => {
                    const checked = activePerms.includes(p.code);
                    return (
                      <label key={p.code} className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${checked ? 'bg-brand-soft border-brand-yellow font-bold text-brand-dark' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(p.code)}
                          disabled={selectedRole?.name === 'Super Administrator'}
                        />
                        <div>
                          <b className="block text-[11px] font-mono">{p.code}</b>
                          <span className="text-[10px] text-gray-400 font-normal">{p.description}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Creation Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">Create Custom Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Decorator"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Manages decoration team"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-yellow text-brand-dark font-bold rounded-xl shadow">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

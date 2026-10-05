import React, { useState } from 'react';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile/me', { fullName, phone });
      alert('Profile updated successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
          <User className="w-8 h-8 text-brand-yellow" />
          <span>My Profile Settings</span>
        </h1>
        <p className="text-xs text-brand-muted mt-1">View assigned role, department, and edit personal contact details</p>
      </div>

      <div className="bg-white border border-brand-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="w-16 h-16 rounded-full bg-brand-yellow text-brand-dark font-black text-2xl flex items-center justify-center shadow">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-dark">{user?.fullName}</h2>
            <span className="bg-brand-red text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-brand-dark block mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full p-2.5 bg-gray-100 border rounded-xl text-gray-500 font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-bold text-brand-dark block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-brand-dark block mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-brand-soft border rounded-xl">
              <span className="text-[10px] text-gray-400 block font-bold uppercase">Role</span>
              <b className="text-sm font-black text-brand-dark">{user?.role}</b>
            </div>
            <div className="p-3 bg-brand-soft border rounded-xl">
              <span className="text-[10px] text-gray-400 block font-bold uppercase">Department</span>
              <b className="text-sm font-black text-brand-dark">{user?.department || 'General'}</b>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Update Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Layers, Plus } from 'lucide-react';
import { api } from '../services/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', { name, description });
      setShowModal(false);
      setName('');
      setDescription('');
      loadDepartments();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading departments...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Layers className="w-8 h-8 text-brand-red" />
            <span>Departments Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">Organize workers into functional departments</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {departments.map(d => (
          <div key={d.id} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-2">
            <h3 className="font-extrabold text-lg text-brand-dark">{d.name}</h3>
            <p className="text-xs text-gray-500">{d.description || 'Company Department'}</p>
            <div className="text-xs font-bold text-brand-red pt-2 border-t">
              {d._count?.users || 0} Staff Members Assigned
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">Add Department</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Media & Photography"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Handles event photo & video"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-red text-white font-bold rounded-xl shadow">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

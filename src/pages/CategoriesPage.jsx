import React, { useState, useEffect } from 'react';
import { Tags, Plus } from 'lucide-react';
import { api } from '../services/api';

export default function CategoriesPage() {
  const [divisions, setDivisions] = useState([]);
  const [showDivModal, setShowDivModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [selectedDivId, setSelectedDivId] = useState(null);

  const [divName, setDivName] = useState('');
  const [divDesc, setDivDesc] = useState('');
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('PRODUCT');
  const [loading, setLoading] = useState(true);

  async function loadDivisions() {
    setLoading(true);
    try {
      const res = await api.get('/divisions');
      setDivisions(res.divisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDivisions();
  }, []);

  const handleCreateDivision = async (e) => {
    e.preventDefault();
    try {
      await api.post('/divisions', { name: divName, description: divDesc });
      setShowDivModal(false);
      setDivName('');
      setDivDesc('');
      loadDivisions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!selectedDivId) return;
    try {
      await api.post(`/divisions/${selectedDivId}/categories`, { name: catName, type: catType });
      setShowCatModal(false);
      setCatName('');
      loadDivisions();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading divisions & categories...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Tags className="w-8 h-8 text-brand-yellow" />
            <span>Business Divisions & Dynamic Categories</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Create new divisions & categories without source code modification
          </p>
        </div>

        <button
          onClick={() => setShowDivModal(true)}
          className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Division</span>
        </button>
      </div>

      {/* Divisions Grid */}
      <div className="space-y-6">
        {divisions.map(div => (
          <div key={div.id} className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-black text-brand-dark">{div.name}</h3>
                <p className="text-xs text-gray-500">{div.description || 'Business Division'}</p>
              </div>
              <button
                onClick={() => { setSelectedDivId(div.id); setShowCatModal(true); }}
                className="bg-brand-soft border border-brand-border hover:bg-brand-yellow text-brand-dark font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Categories list */}
            <div className="flex flex-wrap gap-2">
              {div.categories && div.categories.length > 0 ? (
                div.categories.map(cat => (
                  <span key={cat.id} className="bg-gray-100 border border-gray-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand-dark flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cat.type === 'SERVICE' ? 'bg-brand-yellow' : 'bg-brand-red'}`} />
                    <span>{cat.name}</span>
                    <span className="text-[9px] text-gray-400 font-mono">({cat.type})</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No categories created yet in this division</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Division Modal */}
      {showDivModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">New Business Division</h3>
            <form onSubmit={handleCreateDivision} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Division Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Logistics & Transport"
                  value={divName}
                  onChange={(e) => setDivName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Vehicle rental & transport"
                  value={divDesc}
                  onChange={(e) => setDivDesc(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDivModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-yellow text-brand-dark font-bold rounded-xl shadow">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <h3 className="text-base font-black text-brand-dark border-b pb-2">Add Category to Division</h3>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drone Shots"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Category Type</label>
                <select
                  value={catType}
                  onChange={(e) => setCatType(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                >
                  <option value="PRODUCT">PRODUCT (Physical goods)</option>
                  <option value="SERVICE">SERVICE (Professional services)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-yellow text-brand-dark font-bold rounded-xl shadow">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

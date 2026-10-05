import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, MapPin } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function ServicesManagementPage() {
  const [services, setServices] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    businessDivisionId: '',
    categoryId: '',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70'],
    location: 'Kigali & nationwide',
    startingPrice: '',
    features: ['Full coverage', 'Edited media album'],
    icon: '💼',
    isFeatured: true,
  });

  const [error, setError] = useState('');

  async function loadServices() {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        api.get('/services?limit=100'),
        api.get('/divisions'),
      ]);
      setServices(sRes.services || []);
      setDivisions(dRes.divisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    const defaultDiv = divisions.find(d => d.name.includes('Wedding')) || divisions[0];
    setForm({
      name: '',
      description: '',
      businessDivisionId: defaultDiv?.id || '',
      categoryId: defaultDiv?.categories[0]?.id || '',
      images: ['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70'],
      location: 'Kigali & nationwide',
      startingPrice: '',
      features: ['Full coverage', 'Edited photos/videos'],
      icon: '💼',
      isFeatured: true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/services', form);
      setShowModal(false);
      loadServices();
    } catch (err) {
      setError(err.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      loadServices();
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedDiv = divisions.find(d => d.id === form.businessDivisionId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Layers className="w-8 h-8 text-brand-yellow" />
            <span>Services Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Manage Wedding Services (Photo, Video, Catering) and Consultancy Services
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s => (
          <div key={s.id} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm space-y-3 relative flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-brand-soft border border-brand-border px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-brand-dark uppercase">
                  {s.businessDivision?.name}
                </span>
                <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-brand-red p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-lg text-brand-dark">{s.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{s.description}</p>
            </div>

            <div className="pt-3 border-t">
              <div className="text-xs font-black text-brand-red mb-1">
                {s.startingPrice ? `From ${formatCurrency(s.startingPrice)}` : 'Pricing Negotiable'}
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-red" />
                <span>{s.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Create New Service</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Videography"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Business Division *</label>
                  <select
                    required
                    value={form.businessDivisionId}
                    onChange={(e) => setForm({ ...form, businessDivisionId: e.target.value, categoryId: '' })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                  >
                    {divisions.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                  >
                    <option value="">-- Select Category --</option>
                    {selectedDiv?.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Starting Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="150000"
                    value={form.startingPrice}
                    onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-brand-red"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Coverage Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                  />
                </div>
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
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition"
              >
                Publish Service
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

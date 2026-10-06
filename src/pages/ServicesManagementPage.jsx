import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit3, MapPin, Sparkles } from 'lucide-react';
import { api, formatCurrency } from '../services/api';
import ImageGalleryManager from '../components/ImageGalleryManager';

export default function ServicesManagementPage() {
  const [services, setServices] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    businessDivisionId: '',
    categoryId: '',
    featuredImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70',
    gallery: [],
    location: 'Kigali & nationwide',
    startingPrice: '',
    featuresText: 'Full coverage\nEdited media album\nDedicated coordinator',
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
    setEditingId(null);
    const defaultDiv = divisions.find(d => d.name.includes('Wedding')) || divisions[0];
    setForm({
      name: '',
      description: '',
      businessDivisionId: defaultDiv?.id || '',
      categoryId: defaultDiv?.categories[0]?.id || '',
      featuredImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70',
      gallery: [],
      location: 'Kigali & nationwide',
      startingPrice: '',
      featuresText: 'Full 4K coverage\nHigh-resolution edited gallery\nDrone aerial cinematography',
      icon: '💼',
      isFeatured: true,
    });
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    let rawImages = [];
    if (Array.isArray(service.images)) rawImages = service.images;
    else if (typeof service.images === 'string') {
      try { rawImages = JSON.parse(service.images); } catch { rawImages = [service.images]; }
    }

    const parsed = rawImages.map(img => typeof img === 'string' ? { url: img, caption: '' } : img).filter(x => Boolean(x?.url));
    const featImg = parsed[0]?.url || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70';
    const gal = parsed.slice(1);

    let feats = [];
    if (Array.isArray(service.features)) feats = service.features;
    else if (typeof service.features === 'string') {
      try { feats = JSON.parse(service.features); } catch { feats = [service.features]; }
    }

    setForm({
      name: service.name || '',
      description: service.description || '',
      businessDivisionId: service.businessDivisionId || '',
      categoryId: service.categoryId || '',
      featuredImage: featImg,
      gallery: gal,
      location: service.location || 'Kigali & nationwide',
      startingPrice: service.startingPrice !== null ? service.startingPrice : '',
      featuresText: feats.join('\n'),
      icon: service.icon || '💼',
      isFeatured: Boolean(service.isFeatured),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const allImages = [
        { url: form.featuredImage, caption: 'Featured Cover' },
        ...form.gallery.filter(g => Boolean(g.url))
      ];

      const featuresArr = form.featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        description: form.description,
        businessDivisionId: form.businessDivisionId,
        categoryId: form.categoryId,
        images: allImages,
        location: form.location,
        startingPrice: form.startingPrice ? parseFloat(form.startingPrice) : null,
        features: featuresArr,
        icon: form.icon,
        isFeatured: form.isFeatured,
      };

      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
      } else {
        await api.post('/services', payload);
      }

      setShowModal(false);
      loadServices(); // Immediately refresh without reload
    } catch (err) {
      setError(err.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
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
            Admin CRUD control: Photography, Videography, Car Rentals, Wedding Services & Consultancy
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
      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-gray-400">Loading services...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => {
            let imgList = [];
            if (Array.isArray(s.images)) imgList = s.images;
            else if (typeof s.images === 'string') {
              try { imgList = JSON.parse(s.images); } catch { imgList = [s.images]; }
            }
            const cover = (imgList[0]?.url || imgList[0]) || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=70';

            return (
              <div key={s.id} className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm space-y-3 relative flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-brand-soft mb-3">
                    <img
                      src={cover}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=70'; }}
                    />
                    <span className="absolute top-2 left-2 bg-brand-dark/80 backdrop-blur-sm text-brand-yellow px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                      {s.businessDivision?.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-start mb-1">
                    <span className="bg-brand-soft border border-brand-border px-2 py-0.5 rounded text-[10px] font-extrabold text-brand-dark">
                      {s.category?.name || 'Service'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 text-gray-500 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition"
                        title="Edit Service"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-lg transition"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-brand-dark line-clamp-1">{s.name}</h3>
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
            );
          })}
        </div>
      )}

      {/* Service Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-pop my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black text-brand-dark">
                {editingId ? 'Edit Service Details' : 'Create New Service'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Cinematic Videography & Drones"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Image Gallery & Featured Image Manager */}
              <ImageGalleryManager
                featuredImage={form.featuredImage}
                onFeaturedChange={(url) => setForm({ ...form, featuredImage: url })}
                gallery={form.gallery}
                onGalleryChange={(gal) => setForm({ ...form, gallery: gal })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Starting Price (Frw, Optional)</label>
                  <input
                    type="number"
                    placeholder="250000"
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
                  placeholder="Comprehensive service description..."
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Service Bullet Highlights (1 per line)</label>
                <textarea
                  rows={3}
                  value={form.featuresText}
                  onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-mono text-[11px]"
                  placeholder="4K Multi-camera coverage&#10;Drone aerial cinematography&#10;Full Master Album"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredService"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="featuredService" className="font-bold text-brand-dark cursor-pointer">
                  Featured on Homepage Spotlight
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition"
              >
                {editingId ? 'Update Service' : 'Publish Service'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

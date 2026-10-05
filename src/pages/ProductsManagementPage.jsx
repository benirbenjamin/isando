import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, Tag, Upload, Check } from 'lucide-react';
import { api, formatCurrency, calcDiscountPct } from '../services/api';

export default function ProductsManagementPage() {
  const [products, setProducts] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    businessDivisionId: '',
    categoryId: '',
    images: [''],
    regularPrice: '',
    salePrice: '',
    stockQuantity: 0,
    lowStockThreshold: 5,
    isFeatured: false,
    isNewArrival: false,
    isOnSale: false,
    variants: [],
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/divisions'),
      ]);
      setProducts(pRes.products || []);
      setDivisions(dRes.divisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      sku: '',
      description: '',
      businessDivisionId: divisions[0]?.id || '',
      categoryId: divisions[0]?.categories[0]?.id || '',
      images: [''],
      regularPrice: '',
      salePrice: '',
      stockQuantity: 10,
      lowStockThreshold: 5,
      isFeatured: false,
      isNewArrival: true,
      isOnSale: false,
      variants: [],
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData);
      setForm(prev => ({ ...prev, images: [res.url] }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, form);
      } else {
        await api.post('/products', form);
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const selectedDiv = divisions.find(d => d.id === form.businessDivisionId);
  const discount = calcDiscountPct(parseFloat(form.regularPrice), parseFloat(form.salePrice));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Package className="w-8 h-8 text-brand-red" />
            <span>Products Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Manage physical inventory products, prices, discounts & variants
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-brand-soft text-brand-dark font-extrabold">
                <th className="p-3">Product</th>
                <th className="p-3">Division / Category</th>
                <th className="p-3">Regular Price</th>
                <th className="p-3">Sale Price</th>
                <th className="p-3 text-center">Discount</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => {
                const disc = calcDiscountPct(p.regularPrice, p.salePrice);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-brand-dark flex items-center gap-3">
                      <img
                        src={p.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=70'}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                      />
                      <div>
                        <b className="block">{p.name}</b>
                        <span className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600">
                      <div>{p.businessDivision?.name}</div>
                      <span className="text-[10px] text-gray-400">{p.category?.name}</span>
                    </td>
                    <td className="p-3 font-semibold text-gray-400 line-through">{formatCurrency(p.regularPrice)}</td>
                    <td className="p-3 font-black text-brand-red">{formatCurrency(p.salePrice)}</td>
                    <td className="p-3 text-center">
                      {disc > 0 ? (
                        <span className="bg-brand-red text-white text-[10px] font-black px-2 py-0.5 rounded">
                          {disc}% OFF
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold">
                      <span className={p.stockQuantity === 0 ? 'text-brand-red' : (p.stockQuantity <= p.lowStockThreshold ? 'text-amber-600' : 'text-emerald-600')}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-gray-400 hover:text-brand-red hover:bg-gray-100 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-pop max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">
                {editingId ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Sneakers"
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

              {/* Pricing Section with Auto Discount Preview */}
              <div className="grid grid-cols-3 gap-3 bg-brand-soft p-3 rounded-2xl border border-brand-border">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Regular Price (Frw)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={form.regularPrice}
                    onChange={(e) => setForm({ ...form, regularPrice: e.target.value })}
                    className="w-full p-2 bg-white border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Sale Price (Frw)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="w-full p-2 bg-white border rounded-xl font-bold text-brand-red"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Auto Discount</label>
                  <div className="p-2 bg-brand-red text-white font-black text-center rounded-xl text-sm">
                    {discount > 0 ? `${discount}% OFF` : '0%'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-1 bg-brand-soft border rounded-xl text-xs"
                  />
                  {uploading && <span className="text-[10px] text-brand-red font-bold">Uploading...</span>}
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

              {/* Toggles */}
              <div className="flex gap-4 font-bold text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <span>Featured on Homepage</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                  />
                  <span>New Arrival Badge</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black text-sm shadow transition"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

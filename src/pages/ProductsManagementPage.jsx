import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, Tag, Check, Sparkles } from 'lucide-react';
import { api, formatCurrency, calcDiscountPct, getImageUrl } from '../services/api';
import ImageGalleryManager from '../components/ImageGalleryManager';

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
    featuredImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70',
    gallery: [],
    regularPrice: '',
    salePrice: '',
    stockQuantity: 10,
    lowStockThreshold: 5,
    isFeatured: false,
    isNewArrival: true,
    isOnSale: false,
    variants: [],
  });

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
    const defaultDiv = divisions.find(d => !d.name.includes('Wedding') && !d.name.includes('Consultancy')) || divisions[0];
    setForm({
      name: '',
      sku: '',
      description: '',
      businessDivisionId: defaultDiv?.id || '',
      categoryId: defaultDiv?.categories[0]?.id || '',
      featuredImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70',
      gallery: [],
      regularPrice: '',
      salePrice: '',
      stockQuantity: 10,
      lowStockThreshold: 5,
      isFeatured: false,
      isNewArrival: true,
      isOnSale: false,
      variants: [],
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);

    let rawImages = [];
    if (Array.isArray(p.images)) rawImages = p.images;
    else if (typeof p.images === 'string') {
      try { rawImages = JSON.parse(p.images); } catch { rawImages = [p.images]; }
    }

    const parsed = rawImages.map(img => (typeof img === 'string' ? { url: img, caption: '' } : img)).filter(x => Boolean(x?.url));
    const featImg = parsed[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70';
    const gal = parsed.slice(1);

    setForm({
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      businessDivisionId: p.businessDivisionId || '',
      categoryId: p.categoryId || '',
      featuredImage: featImg,
      gallery: gal,
      regularPrice: p.regularPrice !== null && p.regularPrice !== undefined ? p.regularPrice : '',
      salePrice: p.salePrice !== null && p.salePrice !== undefined ? p.salePrice : '',
      stockQuantity: p.stockQuantity ?? 0,
      lowStockThreshold: p.lowStockThreshold ?? 5,
      isFeatured: Boolean(p.isFeatured),
      isNewArrival: Boolean(p.isNewArrival),
      isOnSale: Boolean(p.isOnSale),
      variants: p.variants || [],
    });
    setError('');
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

      const regP = parseFloat(form.regularPrice || 0);
      const saleP = parseFloat(form.salePrice || regP);

      const payload = {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description,
        businessDivisionId: form.businessDivisionId,
        categoryId: form.categoryId,
        images: allImages,
        regularPrice: regP,
        salePrice: saleP,
        stockQuantity: parseInt(form.stockQuantity || 0, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold || 5, 10),
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        isOnSale: form.isOnSale,
        variants: form.variants,
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setShowModal(false);
      // Auto-load without reloading the app
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      // Auto-load without reloading the app
      await loadProducts();
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
            Manage physical inventory products, featured images, galleries with captions, prices & stock
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
        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500 text-sm">
            Loading products catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-bold text-brand-dark text-sm">No products found</p>
            <button
              onClick={openCreateModal}
              className="text-xs font-black text-brand-red hover:underline"
            >
              + Create the first product
            </button>
          </div>
        ) : (
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
                  const firstImg = getImageUrl(
                    Array.isArray(p.images) ? p.images[0] : (typeof p.images === 'string' ? JSON.parse(p.images || '[]')[0] : null),
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=70'
                  );
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-bold text-brand-dark flex items-center gap-3">
                        <img
                          src={firstImg}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-brand-border flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=70';
                          }}
                        />
                        <div>
                          <b className="block text-sm font-extrabold text-brand-dark">{p.name}</b>
                          <span className="text-[10px] text-gray-400 font-mono">SKU: {p.sku}</span>
                          {p.isFeatured && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              <Sparkles className="w-2.5 h-2.5" /> Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">
                        <div className="font-bold text-brand-dark">{p.businessDivision?.name}</div>
                        <span className="text-[11px] text-gray-400">{p.category?.name}</span>
                      </td>
                      <td className="p-3 font-semibold text-gray-400 line-through">{formatCurrency(p.regularPrice)}</td>
                      <td className="p-3 font-black text-brand-red text-sm">{formatCurrency(p.salePrice)}</td>
                      <td className="p-3 text-center">
                        {disc > 0 ? (
                          <span className="bg-brand-red text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                            {disc}% OFF
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={p.stockQuantity === 0 ? 'text-brand-red font-black' : (p.stockQuantity <= p.lowStockThreshold ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold')}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 text-gray-600 hover:text-brand-red hover:bg-amber-50 rounded-xl transition"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition"
                          title="Delete Product"
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
        )}
      </div>

      {/* Product Form Modal (Create & Edit) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xl font-black text-brand-dark">
                  {editingId ? 'Edit Product' : 'Create New Product'}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Set featured cover image and multi-image gallery with captions
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Bridal Stilettos or Basmati Rice 25kg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 bg-brand-soft border border-brand-border rounded-xl font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Business Division *</label>
                  <select
                    required
                    value={form.businessDivisionId}
                    onChange={(e) => {
                      const divId = e.target.value;
                      const divObj = divisions.find(d => d.id === divId);
                      setForm({
                        ...form,
                        businessDivisionId: divId,
                        categoryId: divObj?.categories[0]?.id || ''
                      });
                    }}
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
              <div className="grid grid-cols-3 gap-3 bg-brand-soft p-3.5 rounded-2xl border border-brand-border">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Regular Price (Frw)</label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={form.regularPrice}
                    onChange={(e) => setForm({ ...form, regularPrice: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Sale Price (Frw)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-brand-red"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Auto Discount</label>
                  <div className="p-2.5 bg-brand-red text-white font-black text-center rounded-xl text-xs flex items-center justify-center">
                    {discount > 0 ? `${discount}% OFF` : 'No Discount'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Detail specifications, quality, warranty and package contents..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              {/* Rich Image Gallery Manager (Cover + Multiple with Captions) */}
              <div className="pt-2 border-t">
                <ImageGalleryManager
                  featuredImage={form.featuredImage}
                  onChangeFeatured={(url) => setForm(prev => ({ ...prev, featuredImage: url }))}
                  gallery={form.gallery}
                  onChangeGallery={(gallery) => setForm(prev => ({ ...prev, gallery }))}
                />
              </div>

              {/* Badges / Visibility Toggles */}
              <div className="flex flex-wrap gap-4 font-bold text-xs pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="accent-brand-red rounded"
                  />
                  <span>Feature on Homepage Spotlight</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                    className="accent-brand-red rounded"
                  />
                  <span>Mark as New Arrival</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isOnSale}
                    onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })}
                    className="accent-brand-red rounded"
                  />
                  <span>On Sale Promotion</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shine-effect transition"
                >
                  {editingId ? 'Update Product Details' : 'Save & Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

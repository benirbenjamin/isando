import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, RefreshCw, DollarSign } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    productId: '',
    variantId: '',
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'CASH',
    customerName: '',
    customerPhone: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadSalesData() {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        api.get('/sales?limit=50'),
        api.get('/products?limit=100'),
      ]);
      setSales(sRes.sales || []);
      setProducts(pRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSalesData();
  }, []);

  const handleProductSelect = (prodId) => {
    const p = products.find(x => x.id === prodId);
    setForm({
      ...form,
      productId: prodId,
      variantId: '',
      unitPrice: p ? (p.salePrice || p.regularPrice) : 0,
    });
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!form.productId) return setError('Please select a product');
    setSubmitting(true);
    setError('');

    try {
      await api.post('/sales', {
        items: [
          {
            productId: form.productId,
            variantId: form.variantId || null,
            quantity: parseInt(form.quantity, 10),
            unitPrice: parseFloat(form.unitPrice),
          }
        ],
        paymentMethod: form.paymentMethod,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        notes: form.notes,
      });

      setShowModal(false);
      setForm({ productId: '', variantId: '', quantity: 1, unitPrice: 0, paymentMethod: 'CASH', customerName: '', customerPhone: '', notes: '' });
      loadSalesData();
    } catch (err) {
      setError(err.message || 'Sale creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading sales data...</div>;

  const selectedProduct = products.find(p => p.id === form.productId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-brand-red" />
            <span>Record & Process Sales</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Point of sale terminal: Auto stock reduction & inventory transaction creation
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-black text-lg text-brand-dark">Completed Sales Transactions</h3>
          <button onClick={loadSalesData} className="text-xs text-brand-red font-bold flex items-center gap-1 hover:underline">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-brand-soft text-brand-dark font-extrabold">
                <th className="p-3">Sale #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-brand-dark">{s.saleNumber}</td>
                  <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-semibold">{s.seller?.fullName}</td>
                  <td className="p-3 text-gray-500">{s.customerName || 'Walk-in Customer'}</td>
                  <td className="p-3 font-bold text-emerald-600">{s.paymentMethod}</td>
                  <td className="p-3 text-right font-black text-brand-red">{formatCurrency(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Record New Sale</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Select Product *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity}) - {formatCurrency(p.salePrice || p.regularPrice)}</option>
                  ))}
                </select>
              </div>

              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Select Variant</label>
                  <select
                    value={form.variantId}
                    onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                  >
                    <option value="">-- Product Main Stock --</option>
                    {selectedProduct.variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.size ? `Size: ${v.size} ` : ''}{v.color ? `Color: ${v.color} ` : ''}(Stock: {v.stockQuantity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Selling Price (Frw) *</label>
                  <input
                    type="number"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold text-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border rounded-xl font-bold"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOMO">MTN MoMo</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black text-sm shadow transition"
              >
                {submitting ? 'Processing Sale...' : 'Record Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

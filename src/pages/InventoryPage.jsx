import React, { useState, useEffect } from 'react';
import { Package, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, Plus, History } from 'lucide-react';
import { api } from '../services/api';

export default function InventoryPage() {
  const [statusData, setStatusData] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showTransModal, setShowTransModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    productId: '',
    variantId: '',
    type: 'STOCK_IN',
    quantity: 1,
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadInventory() {
    setLoading(true);
    try {
      const [stRes, prodRes, txRes] = await Promise.all([
        api.get('/inventory/status'),
        api.get('/products?limit=100'),
        api.get('/inventory/transactions?limit=50'),
      ]);
      setStatusData(stRes);
      setProducts(prodRes.products || []);
      setTransactions(txRes.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const handleTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/inventory/transaction', {
        ...form,
        quantity: parseInt(form.quantity, 10),
      });

      setShowTransModal(false);
      setForm({ productId: '', variantId: '', type: 'STOCK_IN', quantity: 1, note: '' });
      loadInventory();
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading inventory data...</div>;

  const selectedProduct = products.find(p => p.id === form.productId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <Package className="w-8 h-8 text-brand-yellow" />
            <span>Inventory & Stock Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Stock In, Stock Out, Adjustments & Audit Trail History
          </p>
        </div>

        <button
          onClick={() => setShowTransModal(true)}
          className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Action</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-gray-400 block uppercase">Total Products</span>
          <b className="text-2xl font-black text-brand-dark">{statusData?.totalProducts || 0}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-gray-400 block uppercase">Total Stock Quantity</span>
          <b className="text-2xl font-black text-brand-dark">{statusData?.totalStockItems || 0}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-gray-400 block uppercase">Low Stock Alert</span>
          <b className="text-2xl font-black text-amber-600">{statusData?.lowStockCount || 0}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-bold text-gray-400 block uppercase">Out of Stock</span>
          <b className="text-2xl font-black text-brand-red">{statusData?.outOfStockCount || 0}</b>
        </div>
      </div>

      {/* Stock History Audit Table */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-black text-lg text-brand-dark flex items-center gap-2">
            <History className="w-5 h-5 text-brand-yellow" />
            <span>Stock Transaction Audit History</span>
          </h3>
          <button onClick={loadInventory} className="text-xs text-brand-red font-bold flex items-center gap-1 hover:underline">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-brand-soft text-brand-dark font-extrabold">
                <th className="p-3">Date</th>
                <th className="p-3">Product</th>
                <th className="p-3">Variant</th>
                <th className="p-3">Action Type</th>
                <th className="p-3 text-center">Change Qty</th>
                <th className="p-3 text-center">Prev &rarr; New</th>
                <th className="p-3">User</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-bold text-brand-dark">{t.product?.name}</td>
                    <td className="p-3 text-gray-500">
                      {t.variant ? `${t.variant.size || ''} ${t.variant.color || ''}` : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`font-black px-2 py-0.5 rounded text-[10px] ${t.type === 'STOCK_IN' || t.type === 'RETURN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-black">{t.quantity}</td>
                    <td className="p-3 text-center text-gray-500 font-mono">{t.previousQty} &rarr; <strong>{t.newQty}</strong></td>
                    <td className="p-3 font-semibold">{t.user?.fullName}</td>
                    <td className="p-3 text-gray-400">{t.note || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">No inventory transactions recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transaction Modal */}
      {showTransModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Stock In / Stock Out Action</h3>
              <button onClick={() => setShowTransModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleTransaction} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Select Product *</label>
                <select
                  required
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value, variantId: '' })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>
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

              <div>
                <label className="font-bold text-brand-dark block mb-1">Transaction Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="STOCK_IN">STOCK_IN (Restock (+))</option>
                  <option value="STOCK_OUT">STOCK_OUT (Dispatch (-))</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Set Absolute Qty (=))</option>
                  <option value="RETURN">RETURN (Customer Return (+))</option>
                  <option value="DAMAGE">DAMAGE (Damaged Goods (-))</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Quantity *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Audit Note</label>
                <input
                  type="text"
                  placeholder="Reason / Invoice number"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3 rounded-2xl font-black text-sm shadow transition"
              >
                {submitting ? 'Recording Action...' : 'Save Stock Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Package, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, Plus, History, RotateCcw, User } from 'lucide-react';
import { api, formatCurrency } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';

export default function InventoryPage() {
  const [statusData, setStatusData] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showTransModal, setShowTransModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    productId: '',
    variantId: '',
    type: 'STOCK_IN',
    quantity: 1,
    customerId: '',
    customerName: '',
    refundAmount: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadInventory() {
    setLoading(true);
    try {
      const [stRes, prodRes, txRes, custRes] = await Promise.all([
        api.get('/inventory/status'),
        api.get('/products?limit=100'),
        api.get('/inventory/transactions?limit=50'),
        api.get('/customers').catch(() => ({ customers: [] })),
      ]);
      setStatusData(stRes);
      setProducts(prodRes.products || []);
      setTransactions(txRes.transactions || []);
      setCustomers(custRes.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const handleProductSelect = (prodId) => {
    const p = products.find(x => x.id === prodId);
    setForm(prev => ({
      ...prev,
      productId: prodId,
      variantId: '',
      refundAmount: p ? ((p.salePrice || p.regularPrice) * prev.quantity).toString() : '',
    }));
  };

  const handleCustomerSelect = (custId) => {
    const c = customers.find(x => x.id === custId);
    if (c) {
      setForm(prev => ({
        ...prev,
        customerId: c.id,
        customerName: c.name,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        customerId: '',
        customerName: custId,
      }));
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/inventory/transaction', {
        ...form,
        quantity: parseInt(form.quantity, 10),
        refundAmount: form.refundAmount ? parseFloat(form.refundAmount) : undefined,
      });

      setShowTransModal(false);
      setForm({
        productId: '',
        variantId: '',
        type: 'STOCK_IN',
        quantity: 1,
        customerId: '',
        customerName: '',
        refundAmount: '',
        note: '',
      });
      // Immediately reload without reloading the app
      await loadInventory();
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading inventory data...</div>;

  const selectedProduct = products.find(p => p.id === form.productId);

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} (Stock: ${p.stockQuantity})`,
    subtitle: `Price: ${formatCurrency(p.salePrice || p.regularPrice)} • SKU: ${p.sku}`
  }));

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: [c.phone, c.email].filter(Boolean).join(' • ')
  }));

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
            Stock In, Stock Out, Customer Returns with Finance Sync & Audit Trail History
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowTransModal(true);
          }}
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
                  <tr key={t.id} className="hover:bg-gray-50 transition">
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Stock In / Stock Out / Return Action</h3>
              <button 
                onClick={() => setShowTransModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleTransaction} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Select Product *</label>
                <SearchableSelect
                  options={productOptions}
                  value={form.productId}
                  onChange={handleProductSelect}
                  placeholder="-- Search or Choose Product --"
                  allowAddNew={false}
                />
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
                  <option value="RETURN">RETURN (Customer Return (+) - Updates Overall Finance)</option>
                  <option value="DAMAGE">DAMAGE (Damaged Goods (-))</option>
                </select>
              </div>

              {/* Special Customer Return Section with Search and Finance Sync */}
              {form.type === 'RETURN' && (
                <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                    <RotateCcw className="w-4 h-4 text-brand-red" />
                    <span>Customer Return & Overall Finance Refund</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Restocks item and posts a refund ledger to update overall finance automatically.
                  </p>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Select Returning Customer *</label>
                    <SearchableSelect
                      options={customerOptions}
                      value={form.customerId}
                      onChange={handleCustomerSelect}
                      placeholder="-- Search Customer or Click Add New --"
                      allowAddNew={true}
                      addNewLabel="+ Add New Customer Name"
                      onAddNew={(newName) => {
                        setForm(prev => ({ ...prev, customerId: '', customerName: newName }));
                      }}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Refund Amount (Frw) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={form.refundAmount}
                      onChange={(e) => setForm({ ...form, refundAmount: e.target.value })}
                      className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-brand-red"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-brand-dark block mb-1">Quantity *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.quantity}
                  onChange={(e) => {
                    const q = parseInt(e.target.value, 10) || 1;
                    setForm(prev => ({
                      ...prev,
                      quantity: q,
                      refundAmount: selectedProduct ? ((selectedProduct.salePrice || selectedProduct.regularPrice) * q).toString() : prev.refundAmount
                    }));
                  }}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Audit Note</label>
                <input
                  type="text"
                  placeholder="Reason / Invoice number / Customer notes"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark py-3.5 rounded-2xl font-black text-sm shadow-md transition"
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

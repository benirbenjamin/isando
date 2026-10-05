import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, ShoppingCart, CreditCard, User, Calendar, RefreshCw } from 'lucide-react';
import { api, formatCurrency } from '../services/api';

export default function FinancePage() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Sale Form state
  const [saleForm, setSaleForm] = useState({
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

  async function loadFinanceData() {
    setLoading(true);
    try {
      const [finRes, prodRes] = await Promise.all([
        api.get('/finance/summary'),
        api.get('/products?limit=100'),
      ]);
      setData(finRes);
      setProducts(prodRes.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleProductSelect = (prodId) => {
    const p = products.find(x => x.id === prodId);
    setSaleForm({
      ...saleForm,
      productId: prodId,
      variantId: '',
      unitPrice: p ? (p.salePrice || p.regularPrice) : 0,
    });
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    if (!saleForm.productId) {
      setError('Please select a product');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post('/sales', {
        items: [
          {
            productId: saleForm.productId,
            variantId: saleForm.variantId || null,
            quantity: parseInt(saleForm.quantity, 10),
            unitPrice: parseFloat(saleForm.unitPrice),
          }
        ],
        paymentMethod: saleForm.paymentMethod,
        customerName: saleForm.customerName,
        customerPhone: saleForm.customerPhone,
        notes: saleForm.notes,
      });

      setShowSaleModal(false);
      setSaleForm({ productId: '', variantId: '', quantity: 1, unitPrice: 0, paymentMethod: 'CASH', customerName: '', customerPhone: '', notes: '' });
      loadFinanceData();
    } catch (err) {
      setError(err.message || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading financial data...</div>;
  }

  const byMethod = data?.byMethod || {};
  const transactions = data?.recentTransactions || [];
  const selectedProduct = products.find(p => p.id === saleForm.productId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            <span>Finance & Sales Management</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Track gross income, record sales, and monitor transactions
          </p>
        </div>

        <button
          onClick={() => setShowSaleModal(true)}
          className="bg-brand-red hover:bg-brand-redDark text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Income Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 block uppercase">Total Income</span>
          <b className="text-xl font-black text-brand-red">{formatCurrency(data?.totalIncome || 0)}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 block uppercase">Cash</span>
          <b className="text-lg font-black text-brand-dark">{formatCurrency(byMethod.CASH || 0)}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 block uppercase">MTN MoMo</span>
          <b className="text-lg font-black text-emerald-600">{formatCurrency(byMethod.MOMO || 0)}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 block uppercase">Card</span>
          <b className="text-lg font-black text-brand-dark">{formatCurrency(byMethod.CARD || 0)}</b>
        </div>
        <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 block uppercase">Bank</span>
          <b className="text-lg font-black text-blue-600">{formatCurrency(byMethod.BANK || 0)}</b>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-black text-lg text-brand-dark">Recent Sales & Financial Logs</h3>
          <button onClick={loadFinanceData} className="text-xs text-brand-red font-bold flex items-center gap-1 hover:underline">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
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
                <th className="p-3">Payment</th>
                <th className="p-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? (
                transactions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-brand-dark">{s.saleNumber}</td>
                    <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-semibold">{s.seller?.fullName || 'Staff'}</td>
                    <td className="p-3 text-gray-500">{s.customerName || 'Walk-in'} {s.customerPhone ? `(${s.customerPhone})` : ''}</td>
                    <td className="p-3">
                      <span className="bg-gray-100 text-brand-dark font-black px-2.5 py-1 rounded-md text-[10px]">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-brand-red">{formatCurrency(s.totalAmount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">No sales transactions recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-pop max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Record New Sale</h3>
              <button onClick={() => setShowSaleModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {error && (
              <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-brand-dark block mb-1">Select Product *</label>
                <select
                  required
                  value={saleForm.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stockQuantity}) - {formatCurrency(p.salePrice || p.regularPrice)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Select Variant (Size/Color)</label>
                  <select
                    value={saleForm.variantId}
                    onChange={(e) => setSaleForm({ ...saleForm, variantId: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-semibold"
                  >
                    <option value="">-- Main Product Stock --</option>
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
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Unit Price (Frw) *</label>
                  <input
                    type="number"
                    required
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-brand-red"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Payment Method *</label>
                <select
                  value={saleForm.paymentMethod}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOMO">MTN Mobile Money (MoMo)</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">Customer Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="0788123456"
                    value={saleForm.customerPhone}
                    onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-brand-soft border border-brand-border p-3 rounded-xl flex justify-between items-center text-sm font-black">
                <span>Total Amount:</span>
                <span className="text-brand-red">{formatCurrency((parseFloat(saleForm.unitPrice) || 0) * (parseInt(saleForm.quantity, 10) || 0))}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3 rounded-2xl font-black text-sm shadow transition"
              >
                {submitting ? 'Processing Sale & Updating Stock...' : 'Confirm & Complete Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, RefreshCw, DollarSign, User, Phone, Mail, MapPin } from 'lucide-react';
import { api, formatCurrency } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    productId: '',
    variantId: '',
    quantity: 1,
    unitPrice: 0,
    paymentMethod: 'CASH',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadSalesData() {
    setLoading(true);
    try {
      const [sRes, pRes, cRes] = await Promise.all([
        api.get('/sales?limit=50'),
        api.get('/products?limit=100'),
        api.get('/customers').catch(() => ({ customers: [] })),
      ]);
      setSales(sRes.sales || []);
      setProducts(pRes.products || []);
      setCustomers(cRes.customers || []);
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
    setForm(prev => ({
      ...prev,
      productId: prodId,
      variantId: '',
      unitPrice: p ? (p.salePrice || p.regularPrice) : 0,
    }));
  };

  const handleCustomerSelect = (custId) => {
    const c = customers.find(x => x.id === custId);
    if (c) {
      setForm(prev => ({
        ...prev,
        customerId: c.id,
        customerName: c.name || '',
        customerPhone: c.phone || '',
        customerEmail: c.email || '',
        customerAddress: c.address || '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        customerId: '',
        customerName: custId,
      }));
    }
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
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        notes: form.notes,
      });

      setShowModal(false);
      setForm({
        productId: '',
        variantId: '',
        quantity: 1,
        unitPrice: 0,
        paymentMethod: 'CASH',
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        notes: '',
      });
      // Automatically reload without full app refresh
      await loadSalesData();
    } catch (err) {
      setError(err.message || 'Sale creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading sales data...</div>;

  const selectedProduct = products.find(p => p.id === form.productId);

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} (Stock: ${p.stockQuantity}) - ${formatCurrency(p.salePrice || p.regularPrice)}`,
    subtitle: `SKU: ${p.sku} • Category: ${p.category?.name || 'General'}`
  }));

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: [c.phone, c.email, c.address].filter(Boolean).join(' • ')
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-brand-dark flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-brand-red" />
            <span>Record & Process Sales</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Point of sale terminal: Auto stock reduction, customer saving & instant finance updating
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowModal(true);
          }}
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
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-mono font-bold text-brand-dark">{s.saleNumber}</td>
                  <td className="p-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-semibold">{s.seller?.fullName}</td>
                  <td className="p-3 text-brand-dark font-medium">
                    <div>{s.customerName || 'Walk-in Customer'}</div>
                    {s.customerPhone && <span className="text-[10px] text-gray-400 font-mono">{s.customerPhone}</span>}
                  </td>
                  <td className="p-3 font-bold text-emerald-600">{s.paymentMethod}</td>
                  <td className="p-3 text-right font-black text-brand-red text-sm">{formatCurrency(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-pop max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-brand-dark">Record New Sale</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition"
              >
                &times;
              </button>
            </div>

            {error && <div className="bg-red-50 text-brand-red p-3 rounded-xl text-xs font-semibold">{error}</div>}

            <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="font-bold text-brand-dark block mb-1">Selling Price (Frw) *</label>
                  <input
                    type="number"
                    required
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold text-brand-red"
                  />
                </div>
              </div>

              {/* Saved Customer Auto-Select & Creation */}
              <div className="bg-brand-soft p-3.5 rounded-2xl border border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-dark flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-red" />
                    <span>Customer Details (Saved for Next Time)</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Optional</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-500 block mb-1">Existing Customer (Search or Pick)</label>
                  <SearchableSelect
                    options={customerOptions}
                    value={form.customerId}
                    onChange={handleCustomerSelect}
                    placeholder="-- Search Customer or Click Add New --"
                    allowAddNew={true}
                    addNewLabel="+ Add New Customer Name"
                    onAddNew={(newName) => {
                      setForm(prev => ({
                        ...prev,
                        customerId: '',
                        customerName: newName,
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-0.5">Customer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Marie Claire"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 0788123456"
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-0.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. customer@gmail.com"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 block mb-0.5">Delivery Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Kigali, Nyarutarama"
                      value={form.customerAddress}
                      onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-brand-dark block mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full p-2.5 bg-brand-soft border border-brand-border rounded-xl font-bold"
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
                className="w-full bg-brand-red hover:bg-brand-redDark text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shine-effect transition"
              >
                {submitting ? 'Processing Sale...' : 'Complete & Record Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

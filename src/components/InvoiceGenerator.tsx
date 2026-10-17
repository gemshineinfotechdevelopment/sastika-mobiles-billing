import React, { useState } from 'react';
import { Plus, Trash2, ShoppingCart, User, Smartphone, CreditCard, Sparkles } from 'lucide-react';
import type { Bill, BillItem, Customer, Product } from '../types';
import { api } from '../services/api';

interface InvoiceGeneratorProps {
  products: Product[];
  onInvoiceCreated: (bill: Bill) => void;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  products,
  onInvoiceCreated,
}) => {
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: '',
    address: '',
    gstin: '',
  });

  const [items, setItems] = useState<BillItem[]>([
    {
      productId: '',
      name: '',
      model: '',
      imei: '',
      quantity: 1,
      unitPrice: 0,
      gstRate: 18,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      total: 0,
    },
  ]);

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('Thanks for shopping at Sastika Mobiles!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recalculate item financials
  const updateItem = (index: number, updates: Partial<BillItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], ...updates };

      const qty = Number(updated.quantity) || 1;
      const price = Number(updated.unitPrice) || 0;
      const total = qty * price;
      const gstRate = Number(updated.gstRate) || 18;

      // Reverse GST calculation
      const taxable = total / (1 + gstRate / 100);
      const tax = total - taxable;

      updated.taxableAmount = Number(taxable.toFixed(2));
      updated.cgst = Number((tax / 2).toFixed(2));
      updated.sgst = Number((tax / 2).toFixed(2));
      updated.total = total;

      copy[index] = updated;
      return copy;
    });
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selected = products.find((p) => p.id === productId);
    if (selected) {
      updateItem(index, {
        productId: selected.id,
        name: selected.name,
        model: selected.model,
        unitPrice: selected.price,
        gstRate: selected.gstRate,
        imei: selected.imeiNumbers?.[0] || '',
      });
    } else {
      updateItem(index, { productId: '' });
    }
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        name: '',
        model: '',
        imei: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        total: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Summary totals
  const subTotal = items.reduce((acc, it) => acc + (it.taxableAmount || 0), 0);
  const cgstTotal = items.reduce((acc, it) => acc + (it.cgst || 0), 0);
  const sgstTotal = items.reduce((acc, it) => acc + (it.sgst || 0), 0);
  const grandTotal = items.reduce((acc, it) => acc + (it.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer.name.trim()) {
      setError('Please provide customer name');
      return;
    }

    const validItems = items.filter((it) => it.name.trim() && it.total > 0);
    if (validItems.length === 0) {
      setError('Please add at least one product with a valid name and price');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createBill({
        customer,
        items: validItems,
        paymentMode,
        notes,
      });

      if (res.success && res.bill) {
        onInvoiceCreated(res.bill);
        // Reset form
        setCustomer({ name: '', phone: '', address: '', gstin: '' });
        setItems([
          {
            productId: '',
            name: '',
            model: '',
            imei: '',
            quantity: 1,
            unitPrice: 0,
            gstRate: 18,
            taxableAmount: 0,
            cgst: 0,
            sgst: 0,
            total: 0,
          },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate bill';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Customer Information Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-semibold">
          <User className="w-5 h-5 text-indigo-600" />
          <h2>Customer Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Muthu Kumar"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">City / Address</label>
            <input
              type="text"
              placeholder="e.g. Madurai, Tamil Nadu"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Customer GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 33AAAAA0000A1Z5"
              value={customer.gstin}
              onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <h2>Invoice Items & Handsets</h2>
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Another Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 items-center"
            >
              {/* Select from Inventory */}
              <div className="col-span-12 sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Choose from Stock
                </label>
                <select
                  value={item.productId || ''}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-600"
                >
                  <option value="">-- Custom / Pick Stock --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Name */}
              <div className="col-span-12 sm:col-span-3">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Redmi Note 13 Pro"
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-600"
                />
              </div>

              {/* IMEI / Serial */}
              <div className="col-span-12 sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  IMEI / Serial No.
                </label>
                <input
                  type="text"
                  placeholder="15-digit IMEI"
                  value={item.imei}
                  onChange={(e) => updateItem(index, { imei: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-indigo-600"
                />
              </div>

              {/* Qty */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1.5 text-xs text-center bg-white border border-slate-200 rounded-lg focus:outline-indigo-600"
                />
              </div>

              {/* Unit Price (Inc. Tax) */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice || ''}
                  onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-xs text-right bg-white border border-slate-200 rounded-lg focus:outline-indigo-600"
                />
              </div>

              {/* Total */}
              <div className="col-span-3 sm:col-span-1 text-right">
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Total</label>
                <div className="text-xs font-bold text-slate-800 font-mono py-1.5">
                  ₹{(item.total ?? 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Delete button */}
              <div className="col-span-1 flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  disabled={items.length === 1}
                  className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Payment Options */}
        <div className="md:col-span-6 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2>Payment & Notes</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {['UPI', 'Cash', 'Card', 'Credit'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Financial Summary */}
        <div className="md:col-span-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60 mb-4">
              <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                Bill Breakdown (GST 18%)
              </span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Value:</span>
                <span className="font-mono">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>CGST (9%):</span>
                <span className="font-mono">₹{cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>SGST (9%):</span>
                <span className="font-mono">₹{sgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white border-t border-indigo-800/60 pt-3">
                <span>Net Payable:</span>
                <span className="font-mono text-xl text-emerald-400">
                  ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart className="w-5 h-5" />
            {loading ? 'Generating Invoice...' : 'Generate & Print Invoice'}
          </button>
        </div>
      </div>
    </form>
  );
};

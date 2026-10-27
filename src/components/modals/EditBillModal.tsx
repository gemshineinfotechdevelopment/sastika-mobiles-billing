import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, User, CreditCard, Package, AlertCircle } from 'lucide-react';
import type { Bill, BillItem } from '../../types';
import { api } from '../../services/api';

interface EditBillModalProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onBillUpdated: (updatedBill: Bill) => void;
}

export const EditBillModal: React.FC<EditBillModalProps> = ({
  isOpen,
  bill,
  onClose,
  onBillUpdated,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setCustomerName(bill.customer?.name || '');
      setCustomerPhone(bill.customer?.phone || '');
      setCustomerAddress(bill.customer?.address || '');
      setCustomerGstin(bill.customer?.gstin || '');
      setPaymentMode(bill.paymentMode || bill.tenderMode || 'Cash');
      setPaidAmount(bill.paidAmount !== undefined ? bill.paidAmount : bill.grandTotal);
      setBalanceDue(bill.balanceDue !== undefined ? bill.balanceDue : 0);
      setNotes(bill.notes || '');
      setItems(Array.isArray(bill.items) ? JSON.parse(JSON.stringify(bill.items)) : []);
      setError(null);
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  // Calculate live totals based on items
  const subTotal = items.reduce((sum, item) => sum + (Number(item.taxableAmount) || (Number(item.unitPrice) * Number(item.quantity)) / 1.18), 0);
  const totalTax = items.reduce((sum, item) => sum + ((Number(item.cgst) || 0) + (Number(item.sgst) || 0)), 0);
  const grandTotal = items.length > 0
    ? items.reduce((sum, item) => sum + (Number(item.total) || Number(item.unitPrice) * Number(item.quantity)), 0)
    : bill.grandTotal;

  // Auto-update balance due when paid amount or grandTotal changes
  const handlePaidAmountChange = (val: number) => {
    const validPaid = Math.max(0, val);
    setPaidAmount(validPaid);
    setBalanceDue(Math.max(0, Number((grandTotal - validPaid).toFixed(2))));
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    const updated = [...items];
    const item = { ...updated[index] };
    const qty = item.quantity || 1;
    const price = Math.max(0, newPrice);
    const total = price * qty;
    const gstRate = item.gstRate || 18;
    const taxable = total / (1 + gstRate / 100);
    const tax = total - taxable;

    item.unitPrice = price;
    item.total = total;
    item.taxableAmount = Number(taxable.toFixed(2));
    item.cgst = Number((tax / 2).toFixed(2));
    item.sgst = Number((tax / 2).toFixed(2));

    updated[index] = item;
    setItems(updated);

    const newGrand = updated.reduce((sum, it) => sum + it.total, 0);
    setBalanceDue(Math.max(0, Number((newGrand - paidAmount).toFixed(2))));
  };

  const handleItemQtyChange = (index: number, newQty: number) => {
    const updated = [...items];
    const item = { ...updated[index] };
    const qty = Math.max(1, newQty);
    const price = item.unitPrice || 0;
    const total = price * qty;
    const gstRate = item.gstRate || 18;
    const taxable = total / (1 + gstRate / 100);
    const tax = total - taxable;

    item.quantity = qty;
    item.total = total;
    item.taxableAmount = Number(taxable.toFixed(2));
    item.cgst = Number((tax / 2).toFixed(2));
    item.sgst = Number((tax / 2).toFixed(2));

    updated[index] = item;
    setItems(updated);

    const newGrand = updated.reduce((sum, it) => sum + it.total, 0);
    setBalanceDue(Math.max(0, Number((newGrand - paidAmount).toFixed(2))));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const updatePayload: Partial<Bill> = {
        customer: {
          name: customerName.trim() || 'Walk-in Customer',
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          gstin: customerGstin.trim(),
        },
        paymentMode,
        tenderMode: paymentMode,
        paidAmount: Number(paidAmount),
        balanceDue: Number(balanceDue),
        status: balanceDue > 0 ? 'PARTIAL' : (bill.status === 'CANCELLED' ? 'CANCELLED' : 'PAID'),
        notes: notes.trim(),
        items,
        subTotal: Number(subTotal.toFixed(2)),
        cgstTotal: Number((totalTax / 2).toFixed(2)),
        sgstTotal: Number((totalTax / 2).toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
      };

      const res = await api.updateBill(bill.id || bill.invoiceNumber, updatePayload);
      if (res && res.success) {
        onBillUpdated(res.bill);
        onClose();
      } else {
        setError(res?.message || 'Failed to update invoice');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while saving invoice changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Edit Invoice</h3>
                <span className="font-mono font-bold text-xs bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded-md">
                  {bill.invoiceNumber}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Dated: {bill.date ? new Date(bill.date).toLocaleDateString('en-IN') : 'Today'} • Direct Database Update
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs pb-1 border-b border-slate-200/60">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9840123456 (10 digits)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Town / City, State"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="33AAAAA0000A1Z5"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items in Invoice */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Invoice Items ({items.length})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Rate & Qty can be adjusted</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 border-b border-slate-200">
                    <th className="py-1.5 px-2">Item Name</th>
                    <th className="py-1.5 px-2 w-16 text-center">Qty</th>
                    <th className="py-1.5 px-2 w-24 text-right">Rate (₹)</th>
                    <th className="py-1.5 px-2 w-24 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-white/60">
                      <td className="py-1.5 px-2">
                        <div className="font-semibold text-slate-900">{it.name}</div>
                        {it.imei && <div className="text-[10px] text-slate-400 font-mono">IMEI: {it.imei}</div>}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemQtyChange(idx, parseInt(e.target.value) || 1)}
                          className="w-12 text-center py-1 px-1 border border-slate-300 rounded font-mono font-bold text-xs bg-white text-slate-900"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.unitPrice}
                          onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 text-right py-1 px-1 border border-slate-300 rounded font-mono font-bold text-xs bg-white text-slate-900"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                        ₹{(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Payment & Accounting */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs pb-1 border-b border-slate-200/60">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Payment Details & Settlement</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="Cash">Cash in Drawer</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking / NEFT</option>
                  <option value="Credit">Khata / Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Paid Amount (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={paidAmount}
                  onChange={(e) => handlePaidAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Balance Due (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={balanceDue}
                  onChange={(e) => setBalanceDue(parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white font-mono font-bold focus:outline-none ${
                    balanceDue > 0 ? 'border-amber-300 text-amber-900 bg-amber-50/30' : 'border-slate-300 text-slate-700'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Bill Notes / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes, discounts, or terms"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Totals Summary Banner */}
          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Updated Bill Grand Total
              </span>
              <span className="text-lg font-black font-mono">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                Payment Status
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  balanceDue > 0 ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                }`}
              >
                {balanceDue > 0 ? `DUE: ₹${balanceDue.toLocaleString('en-IN')}` : 'FULLY PAID'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

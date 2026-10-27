import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, ShieldCheck, Smartphone } from 'lucide-react';
import type { PurchaseBill, Supplier } from '../../types';

interface NewPurchaseBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseAdded: (bill: PurchaseBill) => void;
  suppliers?: Supplier[];
}

interface NewItemRow {
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  gstRate: number | string;
  imeis: string[];
}

export const NewPurchaseBillModal: React.FC<NewPurchaseBillModalProps> = ({
  isOpen,
  onClose,
  onPurchaseAdded,
  suppliers = [],
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || 'SUP-01'
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>('SUP-INV-' + Math.floor(1000 + Math.random() * 9000));
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('Bank Transfer (NEFT/RTGS)');
  const [success, setSuccess] = useState(false);

  // Item rows
  const [items, setItems] = useState<NewItemRow[]>([
    {
      name: 'Vivo V29 5G (8GB / 128GB)',
      category: 'Smartphones',
      quantity: 5,
      unitCost: 28000,
      gstRate: 18,
      imeis: ['863456789012351', '863456789012352', '863456789012353', '863456789012354', '863456789012355'],
    },
    {
      name: 'Super D 9H Matte Tempered Glass',
      category: 'Screen Protectors',
      quantity: 50,
      unitCost: 45,
      gstRate: 18,
      imeis: [],
    },
  ]);

  if (!isOpen) return null;

  const fallbackSupplier: Supplier = {
    id: 'SUP-01',
    name: 'Supreme Tele Distribution',
    address: 'Ritchie St, Chennai',
    phone: '+91 94441 55221',
    gstin: '33AABCS1234F1Z1',
  };

  const currentSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) ||
    suppliers[0] ||
    fallbackSupplier;

  const calculateSubtotal = () =>
    items.reduce((acc, it) => acc + (it.quantity * it.unitCost), 0);

  const calculateTax = () =>
    items.reduce((acc, it) => acc + (it.quantity * it.unitCost * ((Number(it.gstRate) || 0) / 100)), 0);

  const totalAmount = calculateSubtotal() + calculateTax();
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        category: 'Accessories',
        quantity: 10,
        unitCost: 150,
        gstRate: 18,
        imeis: [],
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);
    const totalImeis = items.reduce((acc, it) => acc + it.imeis.length, 0);

    const itemsSummary = items
      .map((it) => `${it.name || 'Stock item'} x ${it.quantity}`)
      .join(', ');

    const newBill: PurchaseBill = {
      id: `PUR-2024-0${Math.floor(93 + Math.random() * 10)}`,
      supplierInvoiceNumber: invoiceNumber,
      date: new Date(billDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      supplier: {
        name: currentSupplier.name,
        address: currentSupplier.address,
        phone: currentSupplier.phone,
        gstin: currentSupplier.gstin,
      },
      itemsSummary,
      unitsCount: totalUnits,
      imeiLoggedCount: totalImeis > 0 ? totalImeis : undefined,
      isBarcoded: totalImeis === 0,
      totalAmount,
      paidAmount,
      balanceDue,
      dueNotice: balanceDue > 0 ? `Pay by ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : 'Settled',
      paymentStatus: balanceDue === 0 ? 'PAID FULL' : paidAmount > 0 ? 'PARTIAL DUE' : 'UNPAID',
      stockSyncStatus: 'Verified',
      taxAuditStatus: 'GSTR-2B Matched',
      items: items.map((it) => ({
        name: it.name,
        category: it.category,
        quantity: it.quantity,
        unitCost: it.unitCost,
        gstRate: it.gstRate === '' || isNaN(Number(it.gstRate)) ? 0 : Number(it.gstRate),
        taxableAmount: it.quantity * it.unitCost,
        totalAmount: it.quantity * it.unitCost * (1 + (it.gstRate === '' || isNaN(Number(it.gstRate)) ? 0 : Number(it.gstRate)) / 100),
        imeiNumbers: it.imeis,
      })),
    };

    setSuccess(true);
    setTimeout(() => {
      onPurchaseAdded(newBill);
      setSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">New Purchase Bill &amp; Stock Inward</h3>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                  F3
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Inward stock addition, IMEI logging, and supplier bill recording
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Stock inward confirmed and added to inventory!
            </div>
          )}

          {/* Supplier & Bill Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Authorized Supplier *
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              >
                {(suppliers.length ? suppliers : [fallbackSupplier]).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                GSTIN: {currentSupplier.gstin}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Supplier Invoice Ref *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. SUP-INV-8412"
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Tax Invoice issued by distributor</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Bill / Inward Date *
              </label>
              <input
                type="date"
                required
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Cycle: October 2024</p>
            </div>
          </div>

          {/* Items Inward Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>Items Received for Stock Inward</span>
                <span className="text-slate-400 font-normal">({items.length} items)</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-3">Item Name</th>
                    <th className="py-2 px-2 w-24">Category</th>
                    <th className="py-2 px-2 w-16 text-center">Qty</th>
                    <th className="py-2 px-2 w-24 text-right">Cost (₹)</th>
                    <th className="py-2 px-2 w-16 text-center">GST %</th>
                    <th className="py-2 px-3 w-28 text-right">Total (₹)</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const lineTotal = item.quantity * item.unitCost * (1 + (Number(item.gstRate) || 0) / 100);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                              );
                            }}
                            placeholder="e.g. Redmi Note 13 5G"
                            className="w-full text-xs font-semibold px-2 py-1 border border-slate-200 rounded-md focus:outline-blue-600"
                          />
                          {item.category === 'Smartphones' && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-600">
                              <Smartphone className="w-3 h-3" />
                              <span className="font-medium">
                                {item.imeis.length} IMEIs tracked
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, category: val } : it))
                              );
                            }}
                            className="w-full text-[11px] px-1.5 py-1 border border-slate-200 rounded-md bg-white"
                          >
                            <option value="Smartphones">Smartphones</option>
                            <option value="Fast Chargers">Fast Chargers</option>
                            <option value="TWS Earbuds & Neckbands">TWS Audio</option>
                            <option value="Smartwatches">Smartwatches</option>
                            <option value="Screen Protectors">Screen Guard</option>
                            <option value="Accessories">Accessories</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                              );
                            }}
                            className="w-14 text-center text-xs font-bold px-1.5 py-1 border border-slate-200 rounded-md"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitCost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, unitCost: val } : it))
                              );
                            }}
                            className="w-20 text-right text-xs font-mono font-bold px-1.5 py-1 border border-slate-200 rounded-md"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.gstRate}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              setItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, gstRate: val } : it))
                              );
                            }}
                            placeholder="0"
                            className="w-16 text-center px-1.5 py-1 text-xs font-mono font-bold border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Terms & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Recorded (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Settlement Method
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe)</option>
                  <option value="Cheque / PDC">Cheque / PDC</option>
                  <option value="Cash Handed">Cash Handed</option>
                </select>
              </div>
            </div>

            {/* Cost Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value:</span>
                <span className="font-mono font-bold">
                  ₹{calculateSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Input GST (CGST + SGST):</span>
                <span className="font-mono font-bold">
                  ₹{calculateTax().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Grand Inward Total:</span>
                <span className="font-mono text-base text-blue-700">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200/80">
                <span className="text-slate-500">Vendor Payable Due:</span>
                <span
                  className={`font-mono font-bold ${
                    balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {balanceDue > 0
                    ? `₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                    : '✓ Zero Due / Settled'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Automatic GSTR-2B ITC Match &amp; Stock Sync</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer active:scale-98"
              >
                Confirm Stock Inward
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

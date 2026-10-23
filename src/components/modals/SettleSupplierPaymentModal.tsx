import React, { useState } from 'react';
import { X, CheckCircle2, IndianRupee, ShieldCheck } from 'lucide-react';
import type { PurchaseBill } from '../../types';

interface SettleSupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
  onPaymentSettled: (billId: string, amount: number) => void;
}

export const SettleSupplierPaymentModal: React.FC<SettleSupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  bill,
  onPaymentSettled,
}) => {
  if (!isOpen || !bill) return null;

  const currentDue = bill.balanceDue;
  const [payAmount, setPayAmount] = useState<string>(currentDue.toString());
  const [paymentMode, setPaymentMode] = useState<string>('NEFT / RTGS Bank Transfer');
  const [reference, setReference] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      onPaymentSettled(bill.id, num);
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pay Supplier Due</h3>
              <p className="text-slate-500 text-xs">Record vendor payment settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSuccess && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Payment of ₹{parseFloat(payAmount).toLocaleString('en-IN')} recorded &amp; Balance updated!
            </div>
          )}

          {/* Supplier Info */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">{bill.supplier.name}</span>
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                {bill.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Invoice: {bill.supplierInvoiceNumber}</p>
            <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Outstanding Balance Due:</span>
              <span className="text-base font-extrabold text-rose-700 font-mono">
                ₹{currentDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Settlement Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-blue-600"
              />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setPayAmount(currentDue.toString())}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Clear Full Balance (₹{currentDue.toLocaleString('en-IN')})
              </button>
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-blue-600"
            >
              <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
              <option value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cheque / Post-Dated Cheque (PDC)">Cheque / Post-Dated Cheque (PDC)</option>
              <option value="Cash Payment">Cash Payment</option>
            </select>
          </div>

          {/* UTR / Ref */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Ref / UTR / Cheque # (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UTR-HDFC-99384728"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant ledger balance match</span>
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
                Confirm Payment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

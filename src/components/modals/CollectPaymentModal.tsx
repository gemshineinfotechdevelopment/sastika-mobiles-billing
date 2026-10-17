import React, { useState } from 'react';
import { X, CheckCircle2, IndianRupee, ShieldCheck } from 'lucide-react';
import type { Customer } from '../../types';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onPaymentSettled: (customerId: string, amountPaid: number) => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onPaymentSettled,
}) => {
  if (!isOpen || !customer) return null;

  const currentDue = customer.khataBalance || 0;
  const [amount, setAmount] = useState<string>(currentDue > 0 ? currentDue.toString() : '0');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('UPI');
  const [reference, setReference] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      alert('Please enter a valid amount to collect.');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      onPaymentSettled(customer.id || '', payNum);
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Collect Khata Due</h3>
              <p className="text-slate-500 text-xs">Record ledger credit settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSuccess && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment of ₹
              {parseFloat(amount).toLocaleString('en-IN')} received & Khata updated!
            </div>
          )}

          {/* Customer Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{customer.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                  {customer.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Outstanding Due</p>
              <p className="text-base font-extrabold text-rose-700 font-mono">
                ₹{currentDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Amount to Collect */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Amount to Collect (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-sm font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(currentDue.toString())}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Pay Full Due (₹{currentDue.toLocaleString('en-IN')})
              </button>
              {currentDue > 1000 && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(currentDue / 2).toString())}
                    className="text-[11px] font-semibold text-slate-600 hover:underline cursor-pointer"
                  >
                    Pay 50%
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Payment Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-1 ring-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Reference / Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              UTR / Reference / Notes (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI Ref #9384729103 or Cash handed over"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-blue-600 focus:bg-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant ledger reconciliation</span>
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
                className="px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, IndianRupee, ShieldCheck, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import type { Customer } from '../../types';
import { api } from '../../services/api';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onPaymentSettled: (customerId: string, amountPaid: number, updatedCustomer?: Customer) => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onPaymentSettled,
}) => {
  if (!isOpen || !customer) return null;

  const currentDue = Number(customer.khataBalance) || 0;
  const [amount, setAmount] = useState<string>(currentDue > 0 ? currentDue.toString() : '');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card' | 'Bank Transfer'>('UPI');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; newBalance: number; receiptNumber?: string } | null>(null);

  // Sync state whenever customer or modal opens
  useEffect(() => {
    if (customer) {
      const due = Number(customer.khataBalance) || 0;
      setAmount(due > 0 ? due.toString() : '');
      setPaymentMode('UPI');
      setReference('');
      setErrorMessage(null);
      setIsSuccess(false);
      setSuccessInfo(null);
      setIsSubmitting(false);
    }
  }, [customer, isOpen]);

  const parsedAmount = parseFloat(amount) || 0;
  const balanceAfter = Math.max(0, currentDue - parsedAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than 0.');
      return;
    }

    const custId = customer.id || (customer as any)._id;
    if (!custId) {
      setErrorMessage('Customer identification missing. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.collectCustomerPayment(custId, {
        amount: payNum,
        paymentMode,
        notes: reference.trim() || `Credit payment collection (${paymentMode})`,
      });

      if (res && res.success) {
        setIsSuccess(true);
        setSuccessInfo({
          amount: payNum,
          newBalance: res.newBalance ?? balanceAfter,
          receiptNumber: res.receiptNumber,
        });

        setTimeout(() => {
          onPaymentSettled(custId, payNum, res.customer);
          setIsSubmitting(false);
          setIsSuccess(false);
          onClose();
        }, 1200);
      } else {
        throw new Error(res?.message || 'Payment recording failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record customer payment on server');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Collect Customer Payment</h3>
              <p className="text-slate-500 text-xs">Record ledger credit & settle pending bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Banner */}
          {isSuccess && successInfo && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-900">
                  ₹{successInfo.amount.toLocaleString('en-IN')} Received & Saved!
                </p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Receipt: <strong>{successInfo.receiptNumber}</strong> • New Due Balance: <strong>₹{successInfo.newBalance.toLocaleString('en-IN')}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Customer Summary Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{customer.name}</span>
                {customer.tier && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                    {customer.tier}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{customer.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Outstanding Due</p>
              <p className="text-base font-black text-rose-600 font-sans">
                ₹{currentDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Amount to Collect */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Amount to Collect (₹) *
              </label>
              {parsedAmount > 0 && (
                <span className="text-[11px] font-semibold text-slate-500">
                  Balance After: <strong className={balanceAfter === 0 ? 'text-emerald-600' : 'text-amber-600'}>₹{balanceAfter.toLocaleString('en-IN')}</strong>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                disabled={isSubmitting || isSuccess}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-base font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              />
            </div>

            {/* Quick Presets */}
            {currentDue > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  disabled={isSubmitting || isSuccess}
                  onClick={() => setAmount(currentDue.toString())}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  Pay Full (₹{currentDue.toLocaleString('en-IN')})
                </button>
                {currentDue > 500 && (
                  <button
                    type="button"
                    disabled={isSubmitting || isSuccess}
                    onClick={() => setAmount(Math.round(currentDue / 2).toString())}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    50% (₹{Math.round(currentDue / 2).toLocaleString('en-IN')})
                  </button>
                )}
                {currentDue > 1000 && (
                  <button
                    type="button"
                    disabled={isSubmitting || isSuccess}
                    onClick={() => setAmount('1000')}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    ₹1,000
                  </button>
                )}
              </div>
            )}
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
                  disabled={isSubmitting || isSuccess}
                  onClick={() => setPaymentMode(mode)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMode === mode
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-600 shadow-2xs'
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
              Payment Reference / Notes (Optional)
            </label>
            <input
              type="text"
              disabled={isSubmitting || isSuccess}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. GPay UPI #9384729103 or Cash handed over"
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-blue-600 focus:bg-white disabled:bg-slate-50"
            />
          </div>

          {/* Live Reconciliation Preview */}
          {parsedAmount > 0 && (
            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/70 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-600">
                <span>Current Ledger Due:</span>
                <span className="font-mono font-semibold">₹{currentDue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>Credit Payment:</span>
                <span className="font-mono">- ₹{parsedAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex items-center justify-between font-bold text-slate-900">
                <span>Remaining Due:</span>
                <span className={`font-mono ${balanceAfter === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ₹{balanceAfter.toLocaleString('en-IN')} {balanceAfter === 0 ? '(Fully Cleared 🎉)' : ''}
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Database & ledger synced</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isSuccess || parsedAmount <= 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

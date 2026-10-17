import React, { useState } from 'react';
import { X, Ban, AlertTriangle } from 'lucide-react';
import type { Bill } from '../../types';

interface VoidBillModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onBillVoided: (billId: string, reason: string) => void;
}

export const VoidBillModal: React.FC<VoidBillModalProps> = ({
  bill,
  isOpen,
  onClose,
  onBillVoided,
}) => {
  const [reason, setReason] = useState('Wrong Model Billed');
  const [restoreStock, setRestoreStock] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onBillVoided(bill.id, reason);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Void / Cancel Invoice</h3>
              <p className="text-slate-500 text-xs font-mono">{bill.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Caution: Irreversible Transaction Action</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Voiding will mark this invoice as cancelled in the daily register and restore item quantities to active stock.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Cancellation Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs focus:outline-rose-600"
            >
              <option value="Wrong Model Billed">Wrong Model Billed</option>
              <option value="Customer Changed Mind">Customer Changed Mind / Refused Payment</option>
              <option value="Duplicate Punch Entry">Duplicate Punch Entry</option>
              <option value="Wrong Price / Discount Applied">Wrong Price / Discount Applied</option>
              <option value="Defective Device Out of Box">Defective Device Out of Box</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreStock}
                onChange={(e) => setRestoreStock(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Restore Items to Stock</span>
                <span className="text-[11px] text-slate-500">
                  Automatically return {bill.items.length} item(s) to inventory counts and release registered IMEIs.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              {submitting ? 'Voiding...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

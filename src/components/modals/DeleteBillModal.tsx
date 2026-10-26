import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import type { Bill } from '../../types';
import { api } from '../../services/api';

interface DeleteBillModalProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onBillDeleted: (billId: string) => void;
}

export const DeleteBillModal: React.FC<DeleteBillModalProps> = ({
  isOpen,
  bill,
  onClose,
  onBillDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !bill) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await api.deleteBill(bill.id || bill.invoiceNumber);
      if (res && res.success) {
        onBillDeleted(bill.id || bill.invoiceNumber);
        onClose();
      } else {
        setError(res?.message || 'Failed to delete invoice');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while deleting invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Delete Invoice</h3>
              <p className="text-rose-700 text-[11px] font-semibold">Irreversible Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-start gap-3 bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-xs">
                Are you sure you want to delete invoice{' '}
                <span className="font-mono text-blue-700">{bill.invoiceNumber}</span>?
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                This bill will be permanently removed from MongoDB. If this invoice was active, the item stock will be restored to your inventory automatically.
              </p>
            </div>
          </div>

          {/* Bill Summary Card */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="text-slate-500 text-[11px]">Customer:</span>
              <span className="font-bold text-slate-900">
                {bill.customer?.name || 'Walk-in Customer'}
                {bill.customer?.phone ? ` (${bill.customer.phone})` : ''}
              </span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="text-slate-500 text-[11px]">Invoice Date:</span>
              <span className="font-mono text-slate-700">
                {bill.date ? new Date(bill.date).toLocaleDateString('en-IN') : 'Today'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
              <span className="text-slate-500 text-[11px]">Total Items:</span>
              <span className="text-slate-800">
                {bill.items?.length || 1} Products
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-bold">
              <span className="text-slate-900">Grand Total:</span>
              <span className="text-sm font-black font-mono text-slate-950">
                ₹{(bill.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

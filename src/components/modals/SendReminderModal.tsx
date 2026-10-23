import React, { useState } from 'react';
import { X, Send, MessageSquare, Check, Phone } from 'lucide-react';
import type { Bill } from '../../types';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueBills: Bill[];
  targetBill?: Bill | null;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  dueBills,
  targetBill,
}) => {
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const activeBills = targetBill ? [targetBill] : dueBills;
  const totalDue = activeBills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);

  const handleSendAll = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentCount(activeBills.length);
      setTimeout(() => {
        setSentCount(null);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Send Payment Reminders</h3>
              <p className="text-slate-500 text-xs">WhatsApp &amp; SMS automated payment link dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {sentCount !== null ? (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2.5 font-bold">
              <Check className="w-5 h-5 text-emerald-600" />
              <span>Reminders dispatched to {sentCount} customer(s) successfully!</span>
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="p-4 bg-rose-50/70 border border-rose-200/70 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                    Outstanding Balance Due
                  </span>
                  <span className="text-2xl font-extrabold text-slate-900 font-mono">
                    ₹{totalDue.toLocaleString('en-IN')}.00
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Across {activeBills.length} pending bill(s)
                  </span>
                </div>
                <div className="px-3 py-1 bg-white rounded-lg border border-rose-200 text-rose-700 font-bold text-xs">
                  Action Required
                </div>
              </div>

              {/* Due Customer List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-xs block">Recipient Queue:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeBills.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{b.customer.name}</span>
                          <span className="text-[10px] font-mono font-normal text-slate-500">
                            ({b.invoiceNumber})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.customer.phone || 'Phone on file'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 text-xs block">
                          Due: ₹{(b.balanceDue || 0).toLocaleString('en-IN')}.00
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {b.dueDate || 'Immediate'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Template Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Template Preview (WhatsApp / SMS)
                </span>
                <p className="text-[11px] text-slate-600 italic leading-relaxed">
                  "Dear Customer, Greetings from <strong>SASTIKA MOBILES</strong>. A friendly reminder that a balance payment of ₹... is due for invoice #{activeBills[0]?.invoiceNumber || 'INV-2024'}. Click here to pay via UPI QR: https://sastikamobiles.in/pay"
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAll}
                  disabled={sending}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Broadcasting...' : `Send Reminders (${activeBills.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

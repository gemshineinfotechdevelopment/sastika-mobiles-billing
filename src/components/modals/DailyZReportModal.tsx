import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface DailyZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string;
}

export const DailyZReportModal: React.FC<DailyZReportModalProps> = ({
  isOpen,
  onClose,
  dateStr = '24 Oct 2024',
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daily Z-Report (End of Day)</h3>
              <p className="text-slate-500 text-xs">Terminal 01 • Cashier: Rajesh Kumar • {dateStr}</p>
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
          {/* Printable Report Sheet */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono space-y-3">
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <p className="font-extrabold text-sm text-slate-900 tracking-wider">SASTIKA MOBILES</p>
              <p className="text-[10px] text-slate-500">GSTIN: 33AAAAA0000A1Z5</p>
              <p className="text-[11px] font-bold text-slate-800 mt-1">DAILY FISCAL CLOSING REPORT (Z-REPORT)</p>
              <p className="text-[10px] text-slate-500">PERIOD: {dateStr} (00:00 - 23:59)</p>
            </div>

            {/* Sales Summary */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>GROSS SALES (28 INVOICES):</span>
                <span>₹84,650.00</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>TOTAL DISCOUNTS GIVEN:</span>
                <span>- ₹1,200.00</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 pt-1 text-xs">
                <span>NET COLLECTED REVENUE:</span>
                <span>₹83,450.00</span>
              </div>
            </div>

            {/* Tender Mode Breakdown */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
              <p className="font-bold text-slate-800 uppercase">Payment Modes Collection:</p>
              <div className="flex justify-between text-slate-600">
                <span>• CASH IN DRAWER:</span>
                <span className="font-bold text-slate-800">₹36,294.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>• UPI / GPAY / PHONEPE:</span>
                <span className="font-bold text-slate-800">₹38,898.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>• HDFC CARD POS:</span>
                <span className="font-bold text-slate-800">₹9,458.00</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>• KHATA / BALANCE DUE:</span>
                <span className="font-bold">₹18,450.00 (6 bills)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>• VOID / RETURN RESTORED:</span>
                <span>₹4,200.00 (1 item)</span>
              </div>
            </div>

            {/* Tax Analysis */}
            <div className="space-y-1 text-[11px]">
              <p className="font-bold text-slate-800 uppercase">GST Tax Liability Summary:</p>
              <div className="flex justify-between text-slate-600">
                <span>• TAXABLE AMOUNT:</span>
                <span>₹71,737.29</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>• OUTPUT CGST (9%):</span>
                <span>₹6,456.35</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>• OUTPUT SGST (9%):</span>
                <span>₹6,456.35</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                <span>TOTAL TAX ACCRUAL:</span>
                <span>₹12,912.71</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-1 border-t border-dashed border-slate-300">
              Generated by System • Terminal 01 Signature
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Day Register Reconciled
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Z-Report (F9)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

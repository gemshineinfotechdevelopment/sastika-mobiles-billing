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
  dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const shopName = import.meta.env.VITE_SHOP_NAME || 'Sastika Mobiles';
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || '+91 98765 43210';
  const shopAddress = import.meta.env.VITE_SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Screen Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 no-print">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Report Sheet */}
        <div id="printable-zreport" className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto bg-white">
          {/* Shop Header */}
          <div className="border border-slate-900 rounded-t-lg p-3 bg-slate-50/60 text-center">
            <h2 className="font-black text-sm text-slate-900 uppercase tracking-wider">{shopName}</h2>
            <p className="text-[11px] text-slate-600">{shopAddress} • Phone: {shopPhone}</p>
            <p className="text-[11px] font-mono font-bold text-slate-900">GSTIN: {shopGstin}</p>
            <div className="mt-1 pt-1 border-t border-slate-900">
              <span className="font-black text-xs uppercase tracking-wider text-slate-900">DAILY FISCAL CLOSING REPORT (Z-REPORT)</span>
              <p className="text-[10px] text-slate-600">REPORT PERIOD: {dateStr} (00:00 - 23:59) • TERMINAL 01</p>
            </div>
          </div>

          {/* Sales Summary Table */}
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                <th className="py-1.5 px-3 border-r border-slate-900">Sales Register Summary</th>
                <th className="py-1.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Gross Sales (28 Invoices):</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">₹84,650.00</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Discounts &amp; Round Off:</td>
                <td className="py-1.5 px-3 text-right font-mono text-slate-700">- ₹1,200.00</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-2 px-3 font-black text-slate-900 border-r border-slate-900 uppercase">Net Revenue Accrued:</td>
                <td className="py-2 px-3 font-black text-right font-mono text-slate-950">₹83,450.00</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Mode Table */}
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                <th className="py-1.5 px-3 border-r border-slate-900">Payment Collection Mode</th>
                <th className="py-1.5 px-3 text-right">Net Collected (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 text-slate-800 border-r border-slate-900">Cash in Drawer (Counter):</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">₹36,294.00</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 text-slate-800 border-r border-slate-900">UPI / GPay / PhonePe:</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">₹38,898.00</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 text-slate-800 border-r border-slate-900">Card / POS Terminal:</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">₹9,458.00</td>
              </tr>
              <tr className="border-b border-slate-900 bg-rose-50/40">
                <td className="py-1.5 px-3 font-bold text-rose-800 border-r border-slate-900">Customer Balance Due (Credit):</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-800">₹18,450.00</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 text-slate-600 border-r border-slate-900">Void / Returned Stock:</td>
                <td className="py-1.5 px-3 text-right font-mono text-slate-600">₹4,200.00 (1 Bill)</td>
              </tr>
            </tbody>
          </table>

          {/* GST Tax Breakdown Table */}
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900">
                <th className="py-1.5 px-3 border-r border-slate-900">GST Tax Liability (Tamil Nadu 33)</th>
                <th className="py-1.5 px-3 text-right">Tax Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 text-slate-700 border-r border-slate-900">Taxable Sales Turnover:</td>
                <td className="py-1.5 px-3 text-right font-mono font-semibold text-slate-900">₹71,737.29</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 text-slate-700 border-r border-slate-900">Central Tax (CGST 9%):</td>
                <td className="py-1.5 px-3 text-right font-mono text-slate-900">₹6,456.35</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 text-slate-700 border-r border-slate-900">State Tax (SGST 9%):</td>
                <td className="py-1.5 px-3 text-right font-mono text-slate-900">₹6,456.35</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-1.5 px-3 text-slate-900 border-r border-slate-900 uppercase">Total Output Tax Accrued:</td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-950">₹12,912.71</td>
              </tr>
            </tbody>
          </table>

          {/* Verification Signatures */}
          <div className="border border-slate-900 rounded-b-lg p-3 flex justify-between items-end text-xs bg-slate-50/30">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Cashier / Shift In-Charge</p>
              <div className="mt-7 border-t border-slate-900 pt-0.5 w-32 text-center">
                <p className="font-semibold text-slate-800 text-[10px]">Rajesh Kumar</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Store Manager Approval</p>
              <div className="mt-7 border-t border-slate-900 pt-0.5 w-36 text-center ml-auto">
                <p className="font-semibold text-slate-800 text-[10px]">Manager Sign &amp; Seal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Action Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between no-print bg-slate-50/60">
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Day Register Reconciled
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Z-Report (F9)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

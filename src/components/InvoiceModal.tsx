import React from 'react';
import { Printer, X, CheckCircle, Smartphone } from 'lucide-react';
import type { Bill } from '../types';

interface InvoiceModalProps {
  bill: Bill;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ bill, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shopName = import.meta.env.VITE_SHOP_NAME || 'Sastika Mobiles';
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || '+91 98765 43210';
  const shopAddress = import.meta.env.VITE_SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 cursor-default">
        {/* Action Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">Invoice #{bill.invoiceNumber} Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 text-slate-800 text-xs sm:text-sm">
          {/* Shop & Invoice Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{shopName}</h2>
              </div>
              <p className="text-slate-500 text-xs">{shopAddress}</p>
              <p className="text-slate-500 text-xs">Phone: {shopPhone}</p>
              <p className="text-slate-700 font-mono text-xs font-semibold mt-1">GSTIN: {shopGstin}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded font-bold text-xs uppercase tracking-wider mb-2">
                Tax Invoice
              </span>
              <p className="font-mono font-bold text-base text-slate-900">{bill.invoiceNumber}</p>
              <p className="text-slate-500 text-xs">Date: {new Date(bill.date).toLocaleString('en-IN')}</p>
              <p className="text-slate-500 text-xs">Mode: <span className="font-semibold text-slate-700">{bill.paymentMode}</span></p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Details (Billed To)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-slate-900">{bill.customer.name}</p>
                <p className="text-slate-600 text-xs">Phone: {bill.customer.phone || 'N/A'}</p>
                {bill.customer.address && <p className="text-slate-600 text-xs">Address: {bill.customer.address}</p>}
              </div>
              {bill.customer.gstin && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">Customer GSTIN:</p>
                  <p className="font-mono text-xs font-bold text-slate-800">{bill.customer.gstin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-semibold text-xs">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2">IMEI / S.No</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Rate</th>
                <th className="py-2.5 px-2 text-right">Taxable</th>
                <th className="py-2.5 px-2 text-right">GST</th>
                <th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bill.items.map((item, index) => (
                <tr key={index} className="text-slate-700">
                  <td className="py-2.5 px-2 text-slate-400">{index + 1}</td>
                  <td className="py-2.5 px-2 font-medium text-slate-900">
                    <div>{item.name}</div>
                    {item.model && <div className="text-slate-400 text-xs">{item.model}</div>}
                  </td>
                  <td className="py-2.5 px-2 font-mono text-xs text-slate-500">{item.imei || '-'}</td>
                  <td className="py-2.5 px-2 text-center font-medium">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-2 text-right font-mono">₹{item.taxableAmount.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-500">{item.gstRate}%</td>
                  <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900">
                    ₹{item.total.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="flex justify-end border-t border-slate-200 pt-4 mb-6">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-mono">₹{bill.subTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (Central Tax):</span>
                <span className="font-mono">₹{bill.cgstTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (State Tax):</span>
                <span className="font-mono">₹{bill.sgstTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax:</span>
                <span className="font-mono">₹{bill.totalTax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-700">₹{bill.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer & Terms */}
          <div className="border-t border-slate-200 pt-6 text-xs text-slate-500 flex justify-between items-end">
            <div>
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <ul className="list-disc list-inside space-y-0.5 mt-1 text-slate-500">
                <li>Goods once sold will not be taken back or exchanged.</li>
                <li>Manufacturer warranty applicable on handsets and accessories.</li>
                <li>Please preserve this invoice for warranty claims.</li>
              </ul>
              {bill.notes && <p className="mt-2 text-slate-600 italic">Note: {bill.notes}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-400 mb-8">For {shopName}</p>
              <p className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

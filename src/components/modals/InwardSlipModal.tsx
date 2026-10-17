import React from 'react';
import { X, Printer, CheckCircle2, Smartphone, Package } from 'lucide-react';
import type { PurchaseBill } from '../../types';

interface InwardSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
}

export const InwardSlipModal: React.FC<InwardSlipModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Stock Inward Consignment Slip</h3>
                <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                  {bill.id}
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Verified Goods Receipt Note (GRN) • Sastika Mobiles Central Hub
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

        {/* Slip Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status banner */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">Stock Inward Verified &amp; Synced</p>
                <p className="text-[11px] text-emerald-700">
                  {bill.unitsCount} total units added to shop live inventory
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded">
              GST GSTR-2B MATCHED
            </span>
          </div>

          {/* Supplier & Consignment Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Supplier Details</p>
              <h4 className="font-bold text-sm text-slate-900">{bill.supplier.name}</h4>
              <p className="text-slate-600 mt-0.5">{bill.supplier.address}</p>
              <p className="font-mono text-slate-500 mt-0.5">{bill.supplier.phone}</p>
              <p className="font-mono font-semibold text-slate-800 mt-1">
                GSTIN: {bill.supplier.gstin}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Inward Metadata</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Inward Slip #:</span>
                  <span className="font-mono font-bold text-slate-900">{bill.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier Inv Ref:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {bill.supplierInvoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inward Date:</span>
                  <span className="font-semibold text-slate-800">{bill.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignment Status:</span>
                  <span className="font-bold text-emerald-600">{bill.stockSyncStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Inward Items Specification
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-2 text-center">Qty Inward</th>
                    <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total Inward (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bill.items && bill.items.length > 0 ? (
                    bill.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{it.name}</p>
                          {it.imeiNumbers && it.imeiNumbers.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                                <Smartphone className="w-3 h-3" /> Logged IMEIs:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {it.imeiNumbers.map((imei, i) => (
                                  <span
                                    key={i}
                                    className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded border border-slate-200"
                                  >
                                    {imei}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ₹{it.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{it.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {bill.itemsSummary}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                        {bill.unitsCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        ₹{(bill.totalAmount / 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Status & Totals */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Khata Payment Status</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    bill.paymentStatus === 'PAID FULL'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bill.paymentStatus === 'PARTIAL DUE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {bill.paymentStatus}
                </span>
                <span className="text-slate-500 font-medium">{bill.dueNotice}</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="flex justify-between sm:justify-end gap-6 text-slate-600">
                <span>Total Invoice:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ₹{bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-6 text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                <span>Payable Due:</span>
                <span className="font-mono text-rose-700">
                  ₹{bill.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Inward Slip</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
          >
            Close Slip
          </button>
        </div>
      </div>
    </div>
  );
};

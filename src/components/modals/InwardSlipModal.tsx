import React from 'react';
import { X, Printer, Package } from 'lucide-react';
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

  const shopName = import.meta.env.VITE_SHOP_NAME || 'Sastika Mobiles';
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || '+91 98765 43210';
  const shopAddress = import.meta.env.VITE_SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header - Screen only */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0 no-print">
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

        {/* Printable Slip Container */}
        <div id="printable-slip" className="p-6 overflow-y-auto space-y-4 flex-1 text-xs bg-white">
          {/* Shop Header & Title */}
          <div className="border border-slate-900 rounded-t-lg p-3.5 bg-slate-50/60 flex justify-between items-start">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{shopName}</h2>
              <p className="text-slate-600 text-xs">{shopAddress}</p>
              <p className="text-slate-600 text-xs">Phone: <strong className="text-slate-900">{shopPhone}</strong></p>
              <p className="text-slate-900 font-mono text-xs font-bold mt-0.5">GSTIN: {shopGstin}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider mb-1">
                GOODS RECEIPT NOTE (GRN)
              </span>
              <p className="font-mono font-bold text-sm text-slate-900">SLIP #{bill.id}</p>
              <p className="text-slate-600 text-xs">Date: <strong className="text-slate-900">{bill.date}</strong></p>
              <p className="text-slate-600 text-xs">Supplier Inv: <strong className="text-blue-700 font-mono">{bill.supplierInvoiceNumber}</strong></p>
            </div>
          </div>

          {/* Consignment & Supplier Details Table */}
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
                <th colSpan={2} className="py-2 px-3 border-r border-slate-900">Supplier Vendor Details</th>
                <th colSpan={2} className="py-2 px-3">Consignment Inward Metadata</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900 w-28">Vendor Name:</td>
                <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">{bill.supplier.name}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900 w-32">Supplier Invoice #:</td>
                <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{bill.supplierInvoiceNumber}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Contact / Phone:</td>
                <td className="py-1.5 px-3 font-mono text-slate-900 border-r border-slate-900">{bill.supplier.phone || '—'}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Inward Slip Ref:</td>
                <td className="py-1.5 px-3 font-mono text-slate-900">{bill.id}</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Vendor GSTIN:</td>
                <td className="py-1.5 px-3 font-mono text-slate-900 border-r border-slate-900">{bill.supplier.gstin || 'Unregistered'}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Stock Sync Status:</td>
                <td className="py-1.5 px-3 font-bold text-emerald-700">{bill.stockSyncStatus || 'Verified'}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Vendor Address:</td>
                <td className="py-1.5 px-3 text-slate-900 border-r border-slate-900">{bill.supplier.address || '—'}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Payment Status:</td>
                <td className="py-1.5 px-3 font-bold uppercase text-slate-900">{bill.paymentStatus}</td>
              </tr>
            </tbody>
          </table>

          {/* Inward Items Table */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Inward Items Received &amp; Stocked:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-900 border-collapse print-table">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 text-[10px] font-bold uppercase">
                    <th className="py-2 px-2.5 text-center border-r border-slate-900 w-10">#</th>
                    <th className="py-2 px-2.5 border-r border-slate-900">Description / Product Name</th>
                    <th className="py-2 px-2.5 border-r border-slate-900 w-24 text-center">Category</th>
                    <th className="py-2 px-2.5 border-r border-slate-900 w-16 text-center">Qty Inward</th>
                    <th className="py-2 px-2.5 border-r border-slate-900 w-24 text-right">Taxable (₹)</th>
                    <th className="py-2 px-2.5 text-right w-28">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items && bill.items.length > 0 ? (
                    bill.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-900 hover:bg-slate-50/50">
                        <td className="py-2 px-2.5 text-center border-r border-slate-900 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2.5 border-r border-slate-900 font-bold text-slate-900">
                          {it.name}
                          {it.imeiNumbers && it.imeiNumbers.length > 0 && (
                            <div className="mt-1 font-normal">
                              <span className="text-[10px] text-slate-500 block">
                                Inwarded IMEIs: {it.imeiNumbers.join(', ')}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-900 text-center text-slate-600">{it.category || 'Accessories'}</td>
                        <td className="py-2 px-2.5 border-r border-slate-900 text-center font-bold text-slate-900">{it.quantity}</td>
                        <td className="py-2 px-2.5 border-r border-slate-900 text-right font-mono text-slate-800">
                          ₹{it.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{it.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-slate-900">
                      <td className="py-2 px-2.5 text-center border-r border-slate-900">1</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 font-bold text-slate-900">{bill.itemsSummary}</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 text-center">Hardware</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 text-center font-bold">{bill.unitsCount}</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 text-right font-mono">
                        ₹{(bill.totalAmount / 1.18).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Dues Table */}
          <div className="flex justify-end mt-2">
            <table className="w-80 text-xs border border-slate-900 border-collapse print-table">
              <tbody>
                <tr className="border-b border-slate-900">
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Total Units Received:</td>
                  <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">{bill.unitsCount} Units</td>
                </tr>
                <tr className="border-b border-slate-900 bg-slate-50">
                  <td className="py-1.5 px-3 font-black text-slate-900 border-r border-slate-900 uppercase">Total Invoice Value:</td>
                  <td className="py-1.5 px-3 font-black text-right font-mono text-slate-900">
                    ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="border-b border-slate-900">
                  <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Paid to Supplier:</td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">
                    ₹{bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-rose-50/40">
                  <td className="py-1.5 px-3 font-bold text-rose-800 border-r border-slate-900">Vendor Payable Due:</td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-rose-800">
                    ₹{bill.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatory Footer */}
          <div className="border border-slate-900 rounded-b-lg p-4 mt-2 flex justify-between items-end text-xs bg-slate-50/30">
            <div>
              <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-1">Physical Verification &amp; QC:</p>
              <p className="text-slate-500 text-[11px]">All items, barcodes, and serial IMEI numbers verified matching consignment invoice.</p>
              <div className="mt-8 border-t border-slate-900 pt-1 w-36 text-center">
                <p className="font-semibold text-slate-700 text-[11px]">Inward Verifier</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-slate-600 text-xs">For <strong className="text-slate-900">{shopName}</strong></p>
              <div className="mt-8 border-t border-slate-900 pt-1 w-40 text-center ml-auto">
                <p className="font-bold text-slate-900 text-xs">Store Manager Seal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Screen only */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
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

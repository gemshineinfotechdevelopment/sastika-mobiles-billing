import React from 'react';
import {
  X,
  IndianRupee,
  Printer,
} from 'lucide-react';
import type { Customer, CustomerLedgerItem } from '../../types';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCollectPayment?: (customer: Customer) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCollectPayment,
}) => {
  if (!isOpen || !customer) return null;

  const due = customer.khataBalance || 0;
  const isSettled = due === 0;

  const shopName = import.meta.env.VITE_SHOP_NAME || 'Sastika Mobiles';
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || '+91 98765 43210';
  const shopAddress = import.meta.env.VITE_SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  // Live ledger entries or fallback
  const entries =
    customer.ledger && customer.ledger.length > 0
      ? customer.ledger.map((item: CustomerLedgerItem) => ({
          date: item.date,
          type: item.type,
          ref: item.billNumber || 'REF',
          details: item.notes || (item.type === 'INVOICE' ? 'Sales Bill' : 'Payment Received'),
          debit: item.type === 'INVOICE' ? item.amount : 0,
          credit: item.type === 'PAYMENT' ? item.amount : 0,
          balance: item.balanceAfter ?? 0,
        }))
      : [
          {
            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            type: due > 0 ? 'INVOICE' : 'PAYMENT',
            ref: 'INITIAL-BAL',
            details: due > 0 ? 'Balance Due on Account' : 'Account Settled / Zero Balance',
            debit: due > 0 ? due : 0,
            credit: due === 0 ? 0 : 0,
            balance: due,
          },
        ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header - Screen only */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                customer.avatarBg || 'bg-blue-600 text-white'
              }`}
            >
              {customer.initials || customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{customer.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    customer.tier === 'VIP MEMBER'
                      ? 'bg-blue-100 text-blue-700'
                      : customer.tier === 'KHATA RISK'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {customer.tier === 'KHATA RISK' ? 'HIGH RISK' : (customer.tier || 'REGULAR')}
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                {customer.id} • {customer.address || 'Tamil Nadu'}
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

        {/* Printable Statement Container */}
        <div id="printable-ledger" className="p-6 overflow-y-auto space-y-4 flex-1 text-xs bg-white">
          {/* Printable Official Shop Header (Visible on print & screen) */}
          <div className="border border-slate-900 rounded-t-lg p-3.5 bg-slate-50/60 flex justify-between items-start">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{shopName}</h2>
              <p className="text-slate-600 text-xs">{shopAddress}</p>
              <p className="text-slate-600 text-xs">Phone: <strong className="text-slate-900">{shopPhone}</strong></p>
              <p className="text-slate-900 font-mono text-xs font-bold mt-0.5">GSTIN: {shopGstin}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider mb-1">
                ACCOUNT STATEMENT
              </span>
              <p className="text-slate-600 text-xs">Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
              <p className="text-slate-600 text-xs">Time: <strong className="text-slate-900">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></p>
            </div>
          </div>

          {/* Customer Profile & Financial Summary Table */}
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
                <th colSpan={2} className="py-2 px-3 border-r border-slate-900">Customer Information</th>
                <th colSpan={2} className="py-2 px-3">Account Standing Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900 w-28">Customer Name:</td>
                <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">{customer.name}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900 w-32">Total Purchases:</td>
                <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">
                  ₹{(customer.lifetimeSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Mobile Phone:</td>
                <td className="py-1.5 px-3 font-mono text-slate-900 border-r border-slate-900">{customer.phone}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Total Bills Count:</td>
                <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">{customer.billsCount || 1} Bills</td>
              </tr>
              <tr className="border-b border-slate-900">
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Address / City:</td>
                <td className="py-1.5 px-3 text-slate-900 border-r border-slate-900">{customer.address || 'Tamil Nadu'}</td>
                <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900 bg-slate-50">Current Balance Due:</td>
                <td className={`py-1.5 px-3 font-black text-right font-mono ${due > 0 ? 'text-rose-700' : 'text-emerald-700'} bg-slate-50`}>
                  ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Customer GSTIN:</td>
                <td className="py-1.5 px-3 font-mono text-slate-900 border-r border-slate-900">{customer.gstin || 'Consumer (B2C)'}</td>
                <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-900">Account Status:</td>
                <td className="py-1.5 px-3 font-bold text-right text-slate-900 uppercase">
                  {isSettled ? '✓ Zero Due / Settled' : customer.dueText || 'Payment Pending'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Statement / Ledger Transactions Table */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Detailed Ledger Statement Transactions:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-900 border-collapse print-table">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2 px-2.5 text-center border-r border-slate-900 w-10">#</th>
                    <th className="py-2 px-2.5 border-r border-slate-900 w-24">Date</th>
                    <th className="py-2 px-2.5 border-r border-slate-900 w-28">Ref / Bill No</th>
                    <th className="py-2 px-2.5 border-r border-slate-900">Description / Notes</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-900 w-24">Debit (Bill ₹)</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-900 w-24">Credit (Paid ₹)</th>
                    <th className="py-2 px-2.5 text-right w-28">Balance Due (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr key={idx} className="border-b border-slate-900 hover:bg-slate-50/50">
                      <td className="py-2 px-2.5 text-center border-r border-slate-900 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 font-semibold text-slate-900">{entry.date}</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 font-mono font-bold text-slate-900">{entry.ref}</td>
                      <td className="py-2 px-2.5 border-r border-slate-900 text-slate-700">{entry.details}</td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-900 font-mono text-slate-900">
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-900 font-mono font-bold text-emerald-700">
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950">
                        ₹{entry.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Signatory Footer */}
          <div className="border border-slate-900 rounded-b-lg p-4 mt-2 flex justify-between items-end text-xs bg-slate-50/30">
            <div>
              <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-1">Customer Verification:</p>
              <p className="text-slate-500 text-[11px]">This statement is an accurate reflection of store ledger entries.</p>
              <div className="mt-8 border-t border-slate-900 pt-1 w-36 text-center">
                <p className="font-semibold text-slate-700 text-[11px]">Customer Signature</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-slate-600 text-xs">For <strong className="text-slate-900">{shopName}</strong></p>
              <div className="mt-8 border-t border-slate-900 pt-1 w-40 text-center ml-auto">
                <p className="font-bold text-slate-900 text-xs">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Screen only */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Account Statement</span>
          </button>
          
          <div className="flex items-center gap-2">
            {due > 0 && onCollectPayment && (
              <button
                onClick={() => {
                  onClose();
                  onCollectPayment(customer);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Collect Payment</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

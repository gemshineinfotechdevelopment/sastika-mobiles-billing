import {
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  IndianRupee,
  MessageSquare,
  Printer,
} from 'lucide-react';
import type { Customer } from '../../types';

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

  // Mock ledger entries for this customer
  const ledgerEntries = [
    {
      date: '24 Oct 2026',
      type: 'INVOICE',
      ref: '#INV-2026-0892',
      details: 'Vivo V29 5G (8/128GB) + Tempered Glass',
      debit: 32198,
      credit: 32198,
      balance: 0,
    },
    {
      date: '18 Oct 2026',
      type: 'PAYMENT',
      ref: 'UPI-REC-49102',
      details: 'GPay Settlement received by Store Admin',
      debit: 0,
      credit: 12500,
      balance: 0,
    },
    {
      date: '12 Oct 2026',
      type: 'INVOICE',
      ref: '#INV-2026-0741',
      details: 'boAt Rockerz 255 Pro + 20W Charger',
      debit: 3199,
      credit: 3199,
      balance: 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
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
                  {customer.tier || 'REGULAR'}
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                {customer.id} • {customer.address || 'Chennai'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Lifetime Sales
              </span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                ₹{(customer.lifetimeSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {customer.billsCount || 1} Total Invoices
              </span>
            </div>

            <div
              className={`rounded-xl p-3 border ${
                isSettled
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-red-50/70 border-red-200 text-red-900'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block mb-1">
                Khata Balance Due
              </span>
              <span className="text-base font-extrabold font-mono block">
                ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-semibold block mt-0.5">
                {isSettled ? '✓ Zero Due / Settled' : customer.dueText || 'Outstanding'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Loyalty Reward Points
              </span>
              <span className="text-base font-extrabold text-blue-600 block">
                {customer.loyaltyPoints || 0} pts
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">₹{(customer.loyaltyPoints || 0) * 0.5} redeemable</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Last Activity
              </span>
              <span className="text-xs font-bold text-slate-800 block">
                {customer.lastBillDate || 'Recent'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Active Patron</span>
            </div>
          </div>

          {/* Contact Details & Quick Communications */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Contact & GST Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono font-medium">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.email || 'No email registered'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{customer.address || 'Chennai, Tamil Nadu'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono uppercase">
                  {customer.gstin ? `GST: ${customer.gstin}` : 'Consumer (B2C)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Patron</span>
              </a>
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold"
              >
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>Call Phone</span>
              </a>
              {due > 0 && onCollectPayment && (
                <button
                  onClick={() => {
                    onClose();
                    onCollectPayment(customer);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold ml-auto cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Collect Payment (₹{due.toLocaleString('en-IN')})</span>
                </button>
              )}
            </div>
          </div>

          {/* Statement / Ledger History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Khata Ledger Transactions
              </h4>
              <span className="text-[11px] text-slate-400">Showing last 3 transactions</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date & Ref</th>
                    <th className="py-2.5 px-3">Transaction Details</th>
                    <th className="py-2.5 px-3 text-right">Debit (Bill)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-800">{entry.date}</p>
                        <p className="font-mono text-[10px] text-slate-400">{entry.ref}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">{entry.details}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        ₹{entry.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Account Statement</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

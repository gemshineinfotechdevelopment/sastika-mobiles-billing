import React, { useState } from 'react';
import { Search, Printer, Eye, Calendar, User, CreditCard } from 'lucide-react';
import type { Bill } from '../types';

interface RecentBillsProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
}

export const RecentBills: React.FC<RecentBillsProps> = ({ bills, onSelectBill }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = bills.filter(
    (b) =>
      (b.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customer?.phone && b.customer.phone.includes(searchTerm))
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Invoices & Billing History</h2>
          <p className="text-xs text-slate-500">Track and reprint past GST invoices</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">Invoice #</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Items</th>
              <th className="py-3 px-3">Payment</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                    {bill.invoiceNumber}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {bill.customer?.name || 'Customer'}
                    </div>
                    {bill.customer?.phone && (
                      <span className="text-slate-400 text-[11px]">{bill.customer.phone}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(bill.date).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      {bill.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{bill.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectBill(bill)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="View & Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSelectBill(bill)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

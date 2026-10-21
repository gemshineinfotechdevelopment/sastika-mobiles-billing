import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  CreditCard,
  FileText,
  Building2,
  X,
  Phone,
} from 'lucide-react';
import type { PurchaseBill, Supplier } from '../types';
import { api } from '../services/api';
import { NewPurchaseBillModal } from '../components/modals/NewPurchaseBillModal';
import { InwardSlipModal } from '../components/modals/InwardSlipModal';
import { SuppliersModal } from '../components/modals/SuppliersModal';
import { SettleSupplierPaymentModal } from '../components/modals/SettleSupplierPaymentModal';

export const PurchasesPage: React.FC = () => {
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'due' | 'paid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [selectedBillForSlip, setSelectedBillForSlip] = useState<PurchaseBill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<PurchaseBill | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch live purchases and suppliers
  const fetchPurchasesData = async () => {
    try {
      const [purchasesRes, suppliersRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
      ]);
      setBills(purchasesRes.purchases || []);
      setSuppliers(suppliersRes.suppliers || []);
    } catch (err) {
      console.warn('Failed to load purchases:', err);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, []);

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.supplierInvoiceNumber.toLowerCase().includes(q) ||
        b.supplier.name.toLowerCase().includes(q) ||
        b.itemsSummary.toLowerCase().includes(q);

      const isDue = (b.balanceDue || 0) > 0;
      let matchTab = true;
      if (statusTab === 'due') {
        matchTab = isDue;
      } else if (statusTab === 'paid') {
        matchTab = !isDue;
      }

      return matchSearch && matchTab;
    });
  }, [bills, searchTerm, statusTab]);

  // Pagination
  const totalItems = filteredBills.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Quick stats
  const totalPurchases = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  }, [bills]);

  const totalDue = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.balanceDue || 0), 0);
  }, [bills]);

  // Settlement callback
  const handlePaymentSettled = async (billId: string, amount: number) => {
    try {
      await api.settlePurchasePayment(billId, amount);
      await fetchPurchasesData();
    } catch (err) {
      console.warn('API settle purchase notice:', err);
    }
    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId || b.supplierInvoiceNumber === billId) {
          const newDue = Math.max(0, (b.balanceDue || 0) - amount);
          return {
            ...b,
            paidAmount: (b.paidAmount || 0) + amount,
            balanceDue: newDue,
            paymentStatus: newDue === 0 ? 'PAID FULL' : 'PARTIAL DUE',
          };
        }
        return b;
      })
    );
  };

  // Add purchase callback
  const handlePurchaseAdded = async (newBill: PurchaseBill) => {
    try {
      await api.createPurchase(newBill);
      await fetchPurchasesData();
    } catch (err) {
      console.warn('API purchase add notice:', err);
      setBills((prev) => [newBill, ...prev]);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Purchases & Inward Stock
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total Inward: <strong className="text-slate-900 font-bold font-sans">₹{totalPurchases.toLocaleString('en-IN')}</strong> • Supplier Dues: <strong className="text-rose-600 font-bold font-sans">₹{totalDue.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSuppliersModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Suppliers ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setShowNewBillModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Tab Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by supplier name, invoice #, or products..."
            className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(['all', 'due', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                statusTab === tab
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'due' ? 'Payment Due' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Clean Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No purchase bills found.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((bill) => {
                  const isDue = (bill.balanceDue || 0) > 0;
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {bill.supplier.name}
                        </span>
                        {bill.supplier.phone && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-300" />
                            {bill.supplier.phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {bill.supplierInvoiceNumber}
                      </td>
                      <td className="py-3 px-4 max-w-[240px] truncate text-slate-600">
                        {bill.itemsSummary}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-sans whitespace-nowrap">
                        ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-sans whitespace-nowrap">
                        {isDue ? (
                          <span className="font-black text-rose-600">
                            ₹{(bill.balanceDue || 0).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600 text-[11px]">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isDue && (
                            <button
                              type="button"
                              onClick={() => setSelectedBillForPayment(bill)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer shadow-2xs"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedBillForSlip(bill)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>Slip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)} of {totalItems} purchase bills
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewPurchaseBillModal
        isOpen={showNewBillModal}
        onClose={() => setShowNewBillModal(false)}
        onPurchaseAdded={handlePurchaseAdded}
        suppliers={suppliers}
      />

      <InwardSlipModal
        isOpen={Boolean(selectedBillForSlip)}
        bill={selectedBillForSlip}
        onClose={() => setSelectedBillForSlip(null)}
      />

      <SuppliersModal
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
        suppliers={suppliers}
      />

      <SettleSupplierPaymentModal
        isOpen={Boolean(selectedBillForPayment)}
        bill={selectedBillForPayment}
        onClose={() => setSelectedBillForPayment(null)}
        onPaymentSettled={handlePaymentSettled}
      />
    </div>
  );
};

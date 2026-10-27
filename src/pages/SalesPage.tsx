import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Plus,
  Eye,
  Printer,
  Edit2,
  Trash2,
  Ban,
  Calendar,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { Bill } from '../types';
import { api } from '../services/api';
import { DailyZReportModal } from '../components/modals/DailyZReportModal';
import { VoidBillModal } from '../components/modals/VoidBillModal';
import { EditBillModal } from '../components/modals/EditBillModal';
import { DeleteBillModal } from '../components/modals/DeleteBillModal';

interface SalesPageProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onNewBill?: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  bills: propBills = [],
  onSelectBill,
  onNewBill,
}) => {
  const [billsList, setBillsList] = useState<Bill[]>(propBills);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (propBills && propBills.length > 0) {
      setBillsList((prev) => {
        const map = new Map<string, Bill>();
        propBills.forEach((b) => map.set(b.id || b.invoiceNumber, b));
        prev.forEach((b) => {
          const key = b.id || b.invoiceNumber;
          if (!map.has(key)) map.set(key, b);
        });
        return Array.from(map.values());
      });
    }
  }, [propBills]);

  // Fetch directly from live MongoDB database
  const fetchLiveBills = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.getBills();
      if (res && res.bills) {
        setBillsList(res.bills);
      }
    } catch (err) {
      console.warn('Could not load live bills from database:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveBills();
  }, [fetchLiveBills]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Paid' | 'Due' | 'Cancelled'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter bills - Always sorted with newest invoices first
  const filteredBills = useMemo(() => {
    const sorted = [...billsList].sort((a, b) => {
      const timeA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : a.date
        ? new Date(a.date).getTime()
        : 0;
      const timeB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : b.date
        ? new Date(b.date).getTime()
        : 0;
      const safeA = isNaN(timeA) ? 0 : timeA;
      const safeB = isNaN(timeB) ? 0 : timeB;
      if (safeA !== safeB) return safeB - safeA;
      return (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '', undefined, { numeric: true });
    });

    return sorted.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
        (b.customer?.name && b.customer.name.toLowerCase().includes(q)) ||
        (b.customer?.phone && b.customer.phone.includes(q)) ||
        (b.items && b.items.some((item) => item?.name && item.name.toLowerCase().includes(q)));

      let matchesStatus = true;
      if (selectedStatus === 'Paid') {
        matchesStatus = b.status === 'PAID';
      } else if (selectedStatus === 'Due') {
        matchesStatus = b.status === 'PARTIAL' || (b.balanceDue || 0) > 0;
      } else if (selectedStatus === 'Cancelled') {
        matchesStatus = b.status === 'CANCELLED' || Boolean(b.isCancelled);
      }

      return matchesSearch && matchesStatus;
    });
  }, [billsList, searchQuery, selectedStatus]);

  // Pagination
  const totalItems = filteredBills.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Quick stats
  const totalSales = useMemo(() => {
    return billsList
      .filter((b) => !b.isCancelled && b.status !== 'CANCELLED')
      .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  }, [billsList]);

  const totalDues = useMemo(() => {
    return billsList
      .filter((b) => !b.isCancelled && b.status !== 'CANCELLED')
      .reduce((acc, b) => acc + (b.balanceDue || 0), 0);
  }, [billsList]);

  // Void Handler
  const handleBillVoided = async (billId: string, reason: string) => {
    try {
      await api.voidBill(billId, reason);
    } catch (err) {
      console.warn('API void notice:', err);
    }
    setBillsList((prev) =>
      prev.map((b) => {
        if (b.id === billId || b.invoiceNumber === billId) {
          return {
            ...b,
            status: 'CANCELLED',
            isCancelled: true,
            notes: `${b.notes || ''} [VOID: ${reason}]`,
          };
        }
        return b;
      })
    );
  };

  // Edit Bill Handler
  const handleBillUpdated = (updatedBill: Bill) => {
    setBillsList((prev) =>
      prev.map((b) => (b.id === updatedBill.id || b.invoiceNumber === updatedBill.invoiceNumber ? updatedBill : b))
    );
    setNotification({
      message: `Invoice ${updatedBill.invoiceNumber} updated successfully!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Delete Bill Handler
  const handleBillDeleted = (billId: string) => {
    setBillsList((prev) => prev.filter((b) => b.id !== billId && b.invoiceNumber !== billId));
    setNotification({
      message: 'Invoice deleted permanently from database and stock restored.',
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Invoice #', 'Date', 'Customer Name', 'Phone', 'Items', 'Total', 'Payment Mode', 'Status'];
    const rows = filteredBills.map((b) => [
      `"${b.invoiceNumber || ''}"`,
      `"${b.date ? new Date(b.date).toLocaleDateString('en-IN') : ''}"`,
      `"${b.customer?.name || 'Customer'}"`,
      `"${b.customer?.phone || ''}"`,
      `"${(b.items || []).map((i) => i.name).join('; ')}"`,
      b.grandTotal ?? 0,
      `"${b.paymentMode || b.tenderMode || 'Cash'}"`,
      `"${b.status || 'PAID'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `sastika_bills_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sales & Bills
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Total Sales: <strong className="text-slate-900 font-bold font-sans">₹{totalSales.toLocaleString('en-IN')}</strong> • Pending Dues: <strong className="text-rose-600 font-bold font-sans">₹{totalDues.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchLiveBills()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Refresh bills directly from database"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setShowZReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Daily Z-Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {onNewBill && (
            <button
              onClick={onNewBill}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Bill (F2)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by invoice number, customer name, or phone..."
            className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {(['All', 'Paid', 'Due', 'Cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedStatus === status
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Clean Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                paginatedBills.map((bill) => {
                  const isVoided = bill.isCancelled || bill.status === 'CANCELLED';
                  const isDue = (bill.balanceDue || 0) > 0;
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {bill.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {bill.date ? new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {bill.customer?.name || 'Customer'}
                        </span>
                        {bill.customer?.phone && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {bill.customer.phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-600">
                        {bill.itemSummary || (bill.items || []).map((i) => i.name).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-sans whitespace-nowrap">
                        ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                        {isDue && (
                          <span className="block text-[10px] text-rose-600 font-normal">
                            Due: ₹{(bill.balanceDue || 0).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {bill.paymentMode || bill.tenderMode || 'Cash'}
                        </span>
                        {bill.emiDetails?.isEmi && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            EMI {bill.emiDetails.tenureMonths}M
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isVoided ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Cancelled
                          </span>
                        ) : isDue ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Due
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectBill(bill)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectBill(bill)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBill(bill)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isVoided && (
                            <button
                              type="button"
                              onClick={() => setVoidingBill(bill)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                              title="Cancel / Void Invoice"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingBill(bill)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Mobile Sales Cards View (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {paginatedBills.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs px-4">
              No matching invoices found.
            </div>
          ) : (
            paginatedBills.map((bill) => {
              const isVoided = bill.isCancelled || bill.status === 'CANCELLED';
              const isDue = (bill.balanceDue || 0) > 0;
              return (
                <div key={bill.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono font-bold text-xs text-blue-600">
                          {bill.invoiceNumber}
                        </span>
                        {isVoided ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Cancelled
                          </span>
                        ) : isDue ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Due
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                          {bill.paymentMode || bill.tenderMode || 'Cash'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs leading-snug">
                        {bill.customer?.name || 'Customer'}
                      </h4>
                      {bill.customer?.phone && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {bill.customer.phone}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-sm text-slate-900 font-sans block">
                        ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                      </span>
                      {isDue && (
                        <span className="text-[10px] text-rose-600 font-medium block">
                          Due: ₹{(bill.balanceDue || 0).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                    {bill.itemSummary || (bill.items || []).map((i) => i.name).join(', ')}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[10px] text-slate-400">
                    <span>
                      {bill.date ? new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => onSelectBill(bill)}
                        className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md text-[11px] cursor-pointer hover:bg-blue-100"
                        title="Print Invoice"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingBill(bill)}
                        className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md text-[11px] cursor-pointer hover:bg-amber-100"
                        title="Edit Invoice"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      {!isVoided && (
                        <button
                          type="button"
                          onClick={() => setVoidingBill(bill)}
                          className="text-slate-500 hover:text-rose-600 text-[11px] px-1.5 py-1 rounded hover:bg-rose-50 cursor-pointer"
                          title="Void / Cancel"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeletingBill(bill)}
                        className="text-slate-400 hover:text-rose-600 text-[11px] px-1.5 py-1 rounded hover:bg-rose-50 cursor-pointer"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Simple Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}-{Math.min(totalItems, currentPage * pageSize)} of {totalItems} bills
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
      <DailyZReportModal
        isOpen={showZReportModal}
        onClose={() => setShowZReportModal(false)}
        bills={billsList}
      />

      <VoidBillModal
        isOpen={Boolean(voidingBill)}
        bill={voidingBill}
        onClose={() => setVoidingBill(null)}
        onBillVoided={handleBillVoided}
      />

      <EditBillModal
        isOpen={Boolean(editingBill)}
        bill={editingBill}
        onClose={() => setEditingBill(null)}
        onBillUpdated={handleBillUpdated}
      />

      <DeleteBillModal
        isOpen={Boolean(deletingBill)}
        bill={deletingBill}
        onClose={() => setDeletingBill(null)}
        onBillDeleted={handleBillDeleted}
      />
    </div>
  );
};

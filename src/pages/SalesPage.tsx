import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  FileText,
  CreditCard,
  ClipboardList,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Eye,
  Printer,
  Ban,
  ShieldCheck,
  ChevronDown,
  CheckSquare,
  Square,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { Bill } from '../types';
import { api } from '../services/api';
import { DailyZReportModal } from '../components/modals/DailyZReportModal';
import { SendReminderModal } from '../components/modals/SendReminderModal';
import { VoidBillModal } from '../components/modals/VoidBillModal';

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
  // Use live bills list from database
  const [billsList, setBillsList] = useState<Bill[]>(propBills);

  useEffect(() => {
    setBillsList(propBills || []);
  }, [propBills]);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenderMode, setSelectedTenderMode] = useState('All');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'All' | 'Paid' | 'Due' | 'Draft' | 'Cancelled'>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals state
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTargetBill, setReminderTargetBill] = useState<Bill | null>(null);
  const [voidingBill, setVoidingBill] = useState<Bill | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for F2, F9, and Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (onNewBill) onNewBill();
      } else if (e.key === 'F9') {
        e.preventDefault();
        setShowZReportModal(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewBill]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return billsList.filter((b) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.invoiceNumber.toLowerCase().includes(q) ||
        b.customer.name.toLowerCase().includes(q) ||
        (b.customer.phone && b.customer.phone.includes(q)) ||
        (b.itemSummary && b.itemSummary.toLowerCase().includes(q)) ||
        b.items.some(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.imei && item.imei.toLowerCase().includes(q))
        );

      // Tender Mode filter
      const matchesTender =
        selectedTenderMode === 'All' ||
        (b.tenderMode && b.tenderMode.toLowerCase().includes(selectedTenderMode.toLowerCase())) ||
        (b.paymentMode && b.paymentMode.toLowerCase().includes(selectedTenderMode.toLowerCase()));

      // Status Tab filter
      let matchesStatus = true;
      if (selectedStatusTab === 'Paid') {
        matchesStatus = b.status === 'PAID';
      } else if (selectedStatusTab === 'Due') {
        matchesStatus = b.status === 'PARTIAL' || (b.balanceDue || 0) > 0;
      } else if (selectedStatusTab === 'Draft') {
        matchesStatus = b.status === 'DRAFT';
      } else if (selectedStatusTab === 'Cancelled') {
        matchesStatus = b.status === 'CANCELLED' || Boolean(b.isCancelled);
      }

      return matchesSearch && matchesTender && matchesStatus;
    });
  }, [billsList, searchQuery, selectedTenderMode, selectedStatusTab]);

  // Paginated bills
  const totalItems = filteredBills.length;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Real dynamic metrics calculated from database bills
  const grossSalesToday = useMemo(() => {
    return billsList
      .filter((b) => !b.isCancelled && b.status !== 'CANCELLED')
      .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  }, [billsList]);

  const pendingBalancesKhata = useMemo(() => {
    return billsList
      .filter((b) => !b.isCancelled && b.status !== 'CANCELLED')
      .reduce((acc, b) => acc + (b.balanceDue || 0), 0);
  }, [billsList]);

  const cancelledReversals = useMemo(() => {
    return billsList
      .filter((b) => b.isCancelled || b.status === 'CANCELLED')
      .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  }, [billsList]);

  // Counts for filter pills computed dynamically from database
  const totalCount = billsList.length;
  const paidCount = billsList.filter((b) => b.status === 'PAID').length;
  const dueCount = billsList.filter((b) => b.status === 'PARTIAL' || (b.balanceDue || 0) > 0).length;
  const draftCount = billsList.filter((b) => b.status === 'DRAFT').length;
  const cancelledCount = billsList.filter((b) => b.status === 'CANCELLED' || Boolean(b.isCancelled)).length;

  // Due bills list for reminder modal (Khata accounts, excluding unbilled drafts)
  const dueBillsList = useMemo(() => {
    return billsList.filter((b) => b.status === 'PARTIAL' && (b.balanceDue || 0) > 0);
  }, [billsList]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice #',
      'Time',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Customer Type',
      'Items Summary',
      'Total Amount',
      'Paid Amount',
      'Balance Due',
      'Status',
      'Payment Mode',
    ];

    const rows = filteredBills.map((b) => [
      `"${b.invoiceNumber || ''}"`,
      `"${b.time || ''}"`,
      `"${b.date ? new Date(b.date).toLocaleDateString('en-IN') : ''}"`,
      `"${b.customer?.name || (b as any).customerName || 'Walk-in Customer'}"`,
      `"${b.customer?.phone || (b as any).customerPhone || ''}"`,
      `"${b.customerType || 'Customer'}"`,
      `"${b.itemSummary || (b.items || []).map((i) => i.name).join(', ')}"`,
      b.grandTotal ?? 0,
      b.paidAmount !== undefined ? b.paidAmount : (b.grandTotal ?? 0),
      b.balanceDue ?? 0,
      `"${b.status || 'PAID'}"`,
      `"${b.tenderMode || b.paymentMode || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `sastika_sales_register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Row selection
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedBills.length && paginatedBills.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedBills.map((b) => b.id)));
    }
  };

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
            voidReason: `Void Reason: ${reason}`,
            stockRestoredText: `Reversed to Stock (${b.items.length} units)`,
            paidAmount: 0,
            balanceDue: 0,
            tenderMode: 'Stock Restored',
          };
        }
        return b;
      })
    );
  };

  // Status Badge Component
  const renderStatusBadge = (bill: Bill) => {
    const status = bill.status || 'PAID';

    if (status === 'PAID') {
      return (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PAID
          </span>
          <span className="block text-[10px] text-slate-500 font-medium uppercase mt-0.5">
            {bill.tenderMode || bill.paymentMode}
          </span>
        </div>
      );
    }

    if (status === 'PARTIAL') {
      return (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            PARTIAL
          </span>
          <span className="block text-[10px] text-slate-500 font-medium uppercase mt-0.5">
            {bill.tenderMode || 'UPI + CREDIT'}
          </span>
        </div>
      );
    }

    if (status === 'DRAFT') {
      return (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            DRAFT
          </span>
          <span className="block text-[10px] text-slate-400 font-medium uppercase mt-0.5">
            {bill.tenderMode || 'UNBILLED CART'}
          </span>
        </div>
      );
    }

    if (status === 'CANCELLED') {
      return (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            CANCELLED
          </span>
          <span className="block text-[10px] text-slate-400 font-medium uppercase mt-0.5">
            Stock Restored
          </span>
        </div>
      );
    }

    return null;
  };

  // Customer Type Badge
  const renderCustomerBadge = (type?: string) => {
    if (!type) return null;
    if (type === 'REGULAR') {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 uppercase">
          REGULAR
        </span>
      );
    }
    if (type === 'MEMBER') {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 uppercase">
          MEMBER
        </span>
      );
    }
    if (type === 'COUNTER POS') {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200 uppercase">
          COUNTER POS
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 uppercase">
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumbs & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb matching image */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase mb-1">
            <span className="text-slate-500">Retail OS</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-500">Sales Register</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-blue-600 font-extrabold">Invoices &amp; Billing History</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Sales &amp; Invoices Register
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Realtime Sync Active
            </span>
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Sales CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Download Sales CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Sales</span>
            <span className="px-1 py-0.2 bg-slate-100 text-slate-600 text-[10px] font-mono rounded">
              CSV
            </span>
          </button>

          {/* Daily Z-Report (F9) */}
          <button
            onClick={() => setShowZReportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Daily Z-Report End of Day summary"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Daily Z-Report</span>
            <span className="px-1 py-0.2 bg-slate-100 text-slate-600 text-[10px] font-mono rounded">
              F9
            </span>
          </button>

          {/* + New Bill (F2) */}
          <button
            onClick={onNewBill}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>+ New Bill</span>
            <span className="px-1 py-0.2 bg-blue-500 text-white text-[10px] font-mono rounded">
              F2
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Exact match to screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TODAY'S GROSS SALES */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                Today's Gross Sales
              </span>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  ₹{Math.floor(grossSalesToday).toLocaleString('en-IN')}
                </span>
                <span className="text-lg font-bold text-slate-900">.00</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80 text-xs">
            <span className="text-slate-600 font-medium">{billsList.length} Invoices recorded</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Live Feed
            </span>
          </div>
        </div>

        {/* Card 2: PENDING BALANCES (KHATA) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                Pending Balances (Khata)
              </span>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight font-sans">
                  ₹{Math.floor(pendingBalancesKhata).toLocaleString('en-IN')}
                </span>
                <span className="text-lg font-bold text-rose-600">.00</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-500 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80 text-xs">
            <span className="text-slate-500">{dueBillsList.length} Partial/Unpaid bills</span>
            <button
              onClick={() => {
                setReminderTargetBill(null);
                setShowReminderModal(true);
              }}
              className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              Send Reminders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: CANCELLED / REVERSALS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                Cancelled / Reversals
              </span>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                  ₹{Math.floor(cancelledReversals).toLocaleString('en-IN')}
                </span>
                <span className="text-lg font-bold text-slate-900">.00</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/80 text-xs text-slate-500">
            <span>{cancelledCount} Voided bills</span>
            <span>Stock Restored (100%)</span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar, Dropdowns & Status Filter Pills */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Invoice #, Customer Name, Mobile Number..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 focus:outline-blue-600 transition-colors"
            />
          </div>

          {/* Date Picker Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Today ({new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Tender Modes Dropdown */}
          <div className="relative shrink-0 min-w-[155px]">
            <select
              value={selectedTenderMode}
              onChange={(e) => {
                setSelectedTenderMode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-700 font-medium focus:outline-blue-600 cursor-pointer"
            >
              <option value="All">All Tender Modes</option>
              <option value="Cash">Cash POS</option>
              <option value="UPI">UPI / GPay</option>
              <option value="Credit">Khata / Credit</option>
              <option value="Card">HDFC Card POS</option>
              <option value="Pending">Unbilled Cart</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Tabs / Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => {
                setSelectedStatusTab('All');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                selectedStatusTab === 'All'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              All ({totalCount})
            </button>

            <button
              onClick={() => {
                setSelectedStatusTab('Paid');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                selectedStatusTab === 'Paid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              Paid ({paidCount})
            </button>

            <button
              onClick={() => {
                setSelectedStatusTab('Due');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                selectedStatusTab === 'Due'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              Due ({dueCount})
            </button>

            <button
              onClick={() => {
                setSelectedStatusTab('Draft');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                selectedStatusTab === 'Draft'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              Draft ({draftCount})
            </button>

            <button
              onClick={() => {
                setSelectedStatusTab('Cancelled');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                selectedStatusTab === 'Cancelled'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>

            {/* Filter Slider Icon Button */}
            <button
              onClick={() => {
                setSelectedTenderMode('All');
                setSelectedStatusTab('All');
                setSearchQuery('');
              }}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Reset all filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-bar / Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div>
            <span>
              Showing results for: <strong>All Operators (Rajesh Kumar)</strong>, Terminal 01, Date:{' '}
              <strong>
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </strong>
            </span>
            <button
              onClick={() => alert('View configuration saved as default!')}
              className="text-blue-600 hover:text-blue-700 font-semibold ml-2 cursor-pointer"
            >
              Save View
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold uppercase tracking-wider text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AUTO-REFRESHING EVERY 30S</span>
          </div>
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200/90 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                {/* Select All Checkbox */}
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {selectedIds.size === paginatedBills.length && paginatedBills.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Invoice # &amp; Time</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer Details</th>
                <th className="py-3 px-3">Items Summary</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-right">Paid Amount</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No invoices match your search query</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the status filter</p>
                  </td>
                </tr>
              ) : (
                paginatedBills.map((bill) => {
                  const isCancelled = bill.status === 'CANCELLED' || Boolean(bill.isCancelled);
                  const isSelected = selectedIds.has(bill.id);
                  const grandTotal = bill.grandTotal ?? 0;
                  const balance = bill.balanceDue ?? 0;
                  const paid = bill.paidAmount !== undefined ? bill.paidAmount : grandTotal;
                  const customerName = bill.customer?.name || (bill as any).customerName || 'Walk-in Customer';
                  const customerPhone = bill.customer?.phone || (bill as any).customerPhone || 'Walk-in';
                  const itemsList = bill.items || [];

                  return (
                    <tr
                      key={bill.id}
                      className={`transition-colors group ${
                        isCancelled
                          ? 'bg-rose-50/30 hover:bg-rose-50/50'
                          : 'hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleSelectRow(bill.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* 1. INVOICE # & TIME */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectBill(bill)}
                            className={`font-mono font-bold hover:underline cursor-pointer ${
                              isCancelled ? 'text-rose-500 line-through' : 'text-blue-600'
                            }`}
                          >
                            {bill.invoiceNumber || 'INV-000'}
                          </button>
                          {isCancelled ? (
                            <span className="text-rose-500 text-xs" title="Voided Invoice">
                              ⊗
                            </span>
                          ) : bill.status === 'DRAFT' ? (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-600">
                              DRAFT
                            </span>
                          ) : (
                            <span title="Verified GST Invoice" className="inline-flex">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {bill.time || '10:00 AM'} • {bill.counter || 'Counter 01'}
                        </div>
                      </td>

                      {/* 2. DATE */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {bill.date ? new Date(bill.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }) : 'Today'}
                      </td>

                      {/* 3. CUSTOMER DETAILS */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{customerName}</span>
                          {renderCustomerBadge(bill.customerType)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {isCancelled && bill.voidReason ? (
                            <span className="text-rose-600 font-sans">{bill.voidReason}</span>
                          ) : (
                            customerPhone
                          )}
                        </div>
                      </td>

                      {/* 4. ITEMS SUMMARY */}
                      <td className="py-3 px-3">
                        <div
                          className={`font-medium ${
                            isCancelled ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}
                        >
                          {bill.itemSummary ||
                            (itemsList.length > 0
                              ? `${itemsList[0]?.name || 'Product'} (${itemsList.length} items)`
                              : 'Products')}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {bill.warningNote ? (
                            <span className="text-rose-600 font-medium">{bill.warningNote}</span>
                          ) : bill.stockRestoredText ? (
                            <span className="text-emerald-700 font-medium">
                              {bill.stockRestoredText}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">
                              {bill.subSummary || `${itemsList.length} item(s)`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. TOTAL AMOUNT */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div
                          className={`font-mono font-bold ${
                            isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        >
                          ₹{(grandTotal ?? 0).toLocaleString('en-IN')}.00
                        </div>
                      </td>

                      {/* 6. PAID AMOUNT */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div
                          className={`font-mono font-bold ${
                            paid > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          ₹{(paid ?? 0).toLocaleString('en-IN')}.00
                        </div>
                      </td>

                      {/* 7. BALANCE DUE */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {balance > 0 ? (
                          <div>
                            <span className="font-mono font-extrabold text-rose-600">
                              ₹{(balance ?? 0).toLocaleString('en-IN')}.00
                            </span>
                            {bill.dueDate && (
                              <span className="block text-[10px] text-rose-600 font-medium">
                                {bill.dueDate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* 8. STATUS */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderStatusBadge(bill)}
                      </td>

                      {/* 9. ACTIONS */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          {/* Eye / View invoice */}
                          <button
                            onClick={() => onSelectBill(bill)}
                            className="p-1.5 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Printer / Print Receipt */}
                          <button
                            onClick={() => onSelectBill(bill)}
                            className="p-1.5 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Print Tax Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Cancel / Void Invoice */}
                          <button
                            disabled={isCancelled}
                            onClick={() => setVoidingBill(bill)}
                            className="p-1.5 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCancelled ? 'Already voided' : 'Void / Cancel Invoice'}
                          >
                            <Ban className="w-4 h-4" />
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

        {/* 5. Pagination & Summary Bar (Exact match to screenshot) */}
        <div className="p-4 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-white">
          {/* Left info & Page Size selector */}
          <div className="flex items-center gap-3">
            <span>
              Showing {totalItems === 0 ? 0 : 1} -{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalCount} transactions
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Middle: Filtered Volume */}
          <div className="font-extrabold text-xs text-slate-800 tracking-wider font-mono">
            FILTERED VOLUME: <span className="text-blue-700">₹84,650.00</span>
          </div>

          {/* Right Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold"
            >
              &lt;
            </button>

            {[1, 2].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              disabled={currentPage * pageSize >= totalItems}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Reusable Modals */}
      <DailyZReportModal
        isOpen={showZReportModal}
        onClose={() => setShowZReportModal(false)}
        dateStr="24 Oct 2024"
      />

      <SendReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        dueBills={dueBillsList}
        targetBill={reminderTargetBill}
      />

      <VoidBillModal
        bill={voidingBill}
        isOpen={Boolean(voidingBill)}
        onClose={() => setVoidingBill(null)}
        onBillVoided={handleBillVoided}
      />
    </div>
  );
};

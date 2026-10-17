import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  Barcode,
  FileText,
  MoreVertical,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { PurchaseBill, Supplier } from '../types';
import { INITIAL_PURCHASE_BILLS, INITIAL_SUPPLIERS } from '../data/initialPurchases';
import { NewPurchaseBillModal } from '../components/modals/NewPurchaseBillModal';
import { InwardSlipModal } from '../components/modals/InwardSlipModal';
import { SuppliersModal } from '../components/modals/SuppliersModal';
import { SettleSupplierPaymentModal } from '../components/modals/SettleSupplierPaymentModal';

type TabStatus = 'all' | 'paid' | 'due' | 'draft';

export const PurchasesPage: React.FC = () => {
  const [bills, setBills] = useState<PurchaseBill[]>(INITIAL_PURCHASE_BILLS);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<TabStatus>('all');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [selectedBillForSlip, setSelectedBillForSlip] = useState<PurchaseBill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<PurchaseBill | null>(null);
  const [actionMenuBillId, setActionMenuBillId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: F3 triggers "+ New Purchase Bill", Ctrl+K focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setShowNewBillModal(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter logic
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.supplierInvoiceNumber.toLowerCase().includes(q) ||
        b.supplier.name.toLowerCase().includes(q) ||
        b.itemsSummary.toLowerCase().includes(q) ||
        b.supplier.gstin.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (selectedSupplierFilter !== 'all' && b.supplier.name !== selectedSupplierFilter) {
        return false;
      }

      if (statusTab === 'paid') {
        return b.paymentStatus === 'PAID FULL';
      }
      if (statusTab === 'due') {
        return b.paymentStatus === 'PARTIAL DUE' || b.paymentStatus === 'UNPAID';
      }
      if (statusTab === 'draft') {
        return b.stockSyncStatus === 'Pending';
      }
      return true;
    });
  }, [bills, searchTerm, statusTab, selectedSupplierFilter]);

  // Payment settlement callback
  const handlePaymentSettled = (billId: string, amount: number) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          const newDue = Math.max(0, b.balanceDue - amount);
          const newPaid = b.paidAmount + amount;
          return {
            ...b,
            paidAmount: newPaid,
            balanceDue: newDue,
            paymentStatus: newDue === 0 ? 'PAID FULL' : 'PARTIAL DUE',
            dueNotice: newDue === 0 ? 'Settled' : b.dueNotice,
          };
        }
        return b;
      })
    );
    setToastMessage(`Payment of ₹${amount.toLocaleString('en-IN')} successfully settled!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new bill callback
  const handlePurchaseAdded = (newBill: PurchaseBill) => {
    setBills((prev) => [newBill, ...prev]);
    setShowTopBanner(true);
    setToastMessage(`Inward consignment ${newBill.id} recorded and synced to stock!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export CSV callback
  const handleExportCSV = () => {
    const headers = [
      'Inward Ref',
      'Supplier Inv #',
      'Date',
      'Supplier',
      'Supplier GSTIN',
      'Items Summary',
      'Total Units',
      'Total Value (INR)',
      'Paid (INR)',
      'Due Balance (INR)',
      'Payment Status',
      'Stock Sync',
    ];
    const rows = bills.map((b) => [
      b.id,
      b.supplierInvoiceNumber,
      `"${b.date}"`,
      `"${b.supplier.name}"`,
      b.supplier.gstin,
      `"${b.itemsSummary}"`,
      b.unitsCount,
      b.totalAmount,
      b.paidAmount,
      b.balanceDue,
      b.paymentStatus,
      b.stockSyncStatus,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sastika_purchase_inward_register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Purchase Inward Register exported to CSV successfully!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP SUCCESS NOTIFICATION BANNER (Stock Inward Confirmed) */}
      {showTopBanner && (
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 text-xs shadow-2xs transition-all">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900">Stock Inward Confirmed</span>
                <span className="font-mono text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                  PUR-2024-089
                </span>
                <span className="text-slate-600 font-semibold">• Supreme Tele Distribution</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                10x Vivo V29 5G (IMEIs logged) and 25x Type-C Cables added to live inventory. Available stock automatically updated across POS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setSelectedBillForSlip(bills[0])}
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-xs cursor-pointer"
            >
              <span>View Inward Slip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowTopBanner(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-emerald-100/60 cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION WITH BREADCRUMBS & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs matching image */}
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 flex flex-wrap items-center gap-1.5 mb-1 whitespace-nowrap">
            <span>RETAIL OS</span>
            <span className="text-slate-300">›</span>
            <span>PROCUREMENT &amp; SUPPLIERS</span>
            <span className="text-slate-300">›</span>
            <span className="text-blue-600 font-extrabold">PURCHASES &amp; INVENTORY INWARD</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Purchase Management &amp; Stock-In
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              OCTOBER CYCLE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Record supplier bills, batch/IMEI stock additions, payment ledger settlements, and vendor khata accounts for Sastika Mobiles, T. Nagar.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* 1. Suppliers (8) */}
          <button
            onClick={() => setShowSuppliersModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-98"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Suppliers ({suppliers.length})</span>
          </button>

          {/* 2. Export Inward */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Inward</span>
          </button>

          {/* 3. + New Purchase Bill [F3] */}
          <button
            onClick={() => setShowNewBillModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Bill</span>
            <span className="bg-blue-700/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-tight">
              F3
            </span>
          </button>
        </div>
      </div>

      {/* 3 KPI / SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL PURCHASES (OCT) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              TOTAL PURCHASES (OCT)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                ₹5,42,800
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4%</span>
            </span>
            <span className="font-medium text-slate-600">{bills.length} Inward Bills</span>
          </div>
        </div>

        {/* Card 2: SUPPLIER PAYABLES (DUE) (Alert / Warm Card) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-200/90 shadow-xs flex flex-col justify-between space-y-3 hover:border-rose-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              SUPPLIER PAYABLES (DUE)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-700 font-mono tracking-tight">
                ₹1,14,500
              </span>
            </div>
            <button
              onClick={() => {
                const dueBill = bills.find((b) => b.balanceDue > 0) || bills[0];
                setSelectedBillForPayment(dueBill);
              }}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Pay Due
            </button>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-100">
            <span className="text-slate-500">4 Active Suppliers</span>
            <span className="text-rose-600 font-medium">Next: ₹60.5k due in 6d</span>
          </div>
        </div>

        {/* Card 3: STOCK UNITS INWARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400">
              STOCK UNITS INWARD
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                184
              </span>
              <span className="text-xs font-semibold text-slate-500">Units Received</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span className="font-semibold text-blue-600">48 Phones (IMEI)</span>
            <span>136 Accessories</span>
          </div>
        </div>
      </div>

      {/* FILTER, SEARCH & CONTROLS BAR */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by Supplier, Bill # (PUR/SUP), Pro..."
            className="w-full pl-8.5 pr-14 py-1.5 bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1 py-0.5 rounded shadow-2xs">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Date Filter & Supplier Dropdown Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Date Picker Button */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>This Month: Oct 2024</span>
          </div>

          {/* Supplier Selector */}
          <div className="relative">
            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="appearance-none inline-flex items-center pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="all">All Suppliers (8 active)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 self-end xl:self-auto">
          {/* All (16) */}
          <button
            onClick={() => setStatusTab('all')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All (16)
          </button>

          {/* Paid (10) */}
          <button
            onClick={() => setStatusTab('paid')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === 'paid'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Paid (10)
          </button>

          {/* Due (4) */}
          <button
            onClick={() => setStatusTab('due')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === 'due'
                ? 'bg-red-50 text-red-700 border border-red-200 ring-1 ring-red-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Due (4)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          </button>

          {/* Draft (2) */}
          <button
            onClick={() => setStatusTab('draft')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusTab === 'draft'
                ? 'bg-slate-200 text-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Draft (2)
          </button>
        </div>
      </div>

      {/* SUBHEADER ABOVE TABLE */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          <span className="font-bold text-slate-900">Stock Inward Register &amp; Bills</span>
          <span className="mx-2">•</span>
          <span>Showing {Math.min(5, filteredBills.length)} of {bills.length} Records</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span>Tax Audit: GST GSTR-2B Match</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      {/* MAIN DATA TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-2.5 px-3 min-w-[110px]">BILL REF &amp; DATE</th>
                <th className="py-2.5 px-3 min-w-[190px]">SUPPLIER &amp; GSTIN</th>
                <th className="py-2.5 px-3 min-w-[210px]">ITEMS INWARD &amp; QTY</th>
                <th className="py-2.5 px-3 min-w-[110px]">TOTAL AMOUNT</th>
                <th className="py-2.5 px-3 min-w-[125px]">PAID / BALANCE DUE</th>
                <th className="py-2.5 px-3 min-w-[90px] text-center">PAYMENT</th>
                <th className="py-2.5 px-3 min-w-[90px] text-center">STOCK SYNC</th>
                <th className="py-2.5 px-3 min-w-[120px] text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm text-slate-600">No inward bills found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or search terms</p>
                  </td>
                </tr>
              ) : (
                filteredBills.slice(0, 5).map((bill) => {
                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* 1. BILL REF & DATE */}
                      <td className="py-3 px-3 align-top">
                        <div>
                          <p className="font-bold font-mono text-blue-600 text-xs">
                            {bill.id}
                          </p>
                          <p className="font-mono text-slate-500 text-[11px] mt-0.5">
                            {bill.supplierInvoiceNumber}
                          </p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{bill.date}</p>
                        </div>
                      </td>

                      {/* 2. SUPPLIER & GSTIN */}
                      <td className="py-3 px-3 align-top">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {bill.supplier.name}
                          </h4>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            {bill.supplier.address} • {bill.supplier.phone}
                          </p>
                          <p className="font-mono text-slate-400 text-[10px] mt-0.5">
                            {bill.supplier.gstin}
                          </p>
                        </div>
                      </td>

                      {/* 3. ITEMS INWARD & QTY */}
                      <td className="py-3 px-3 align-top">
                        <div>
                          <p className="font-medium text-slate-800 text-xs leading-snug">
                            {bill.itemsSummary}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                              {bill.unitsCount} units
                            </span>
                            {bill.imeiLoggedCount ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                {bill.imeiLoggedCount} IMEIs Logged
                              </span>
                            ) : bill.isBarcoded ? (
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                Barcoded
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 4. TOTAL AMOUNT */}
                      <td className="py-3 px-3 align-top">
                        <p className="font-bold font-mono text-slate-900 text-sm">
                          ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </td>

                      {/* 5. PAID / BALANCE DUE */}
                      <td className="py-3 px-3 align-top">
                        <div>
                          <p className="text-slate-400 text-[11px]">
                            Paid: <span className="font-mono font-medium text-slate-600">₹{bill.paidAmount.toLocaleString('en-IN')}</span>
                          </p>
                          <p className="mt-0.5">
                            <span className="text-slate-500 text-[11px]">Due: </span>
                            <span
                              className={`font-mono font-bold text-xs ${
                                bill.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              ₹{bill.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </p>
                          <p
                            className={`text-[10px] font-medium mt-0.5 ${
                              bill.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {bill.dueNotice}
                          </p>
                        </div>
                      </td>

                      {/* 6. PAYMENT PILL */}
                      <td className="py-3 px-3 align-top text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-tight ${
                            bill.paymentStatus === 'PAID FULL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bill.paymentStatus === 'PARTIAL DUE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {bill.paymentStatus}
                        </span>
                      </td>

                      {/* 7. STOCK SYNC BADGE */}
                      <td className="py-3 px-3 align-top text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                          <span>✓</span>
                          <span>Verified</span>
                        </span>
                      </td>

                      {/* 8. ACTIONS */}
                      <td className="py-3 px-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          {bill.balanceDue > 0 && (
                            <button
                              onClick={() => setSelectedBillForPayment(bill)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline mr-1 cursor-pointer"
                            >
                              Pay Due
                            </button>
                          )}

                          {/* Barcode icon */}
                          <button
                            onClick={() => {
                              setToastMessage(`Barcode labels queued for printing for ${bill.id}`);
                              setTimeout(() => setToastMessage(null), 3000);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Print Barcode Labels"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Inward Slip Document icon */}
                          <button
                            onClick={() => setSelectedBillForSlip(bill)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View Inward Slip"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* 3-dots Menu */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActionMenuBillId(
                                  actionMenuBillId === bill.id ? null : bill.id
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {actionMenuBillId === bill.id && (
                              <div
                                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                                onMouseLeave={() => setActionMenuBillId(null)}
                              >
                                <button
                                  onClick={() => {
                                    setSelectedBillForSlip(bill);
                                    setActionMenuBillId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                                >
                                  Inward Slip Details
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedBillForPayment(bill);
                                    setActionMenuBillId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                                >
                                  Record Payment
                                </button>
                                <button
                                  onClick={() => {
                                    window.print();
                                    setActionMenuBillId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                                >
                                  Print Consignment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER / PAGINATION BAR */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Displaying rows <span className="font-bold text-slate-800">1 - {Math.min(5, filteredBills.length)}</span> of{' '}
            <span className="font-bold text-slate-800">16</span> purchase consignments
          </div>

          <div className="flex items-center gap-1 select-none">
            <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              1
            </button>

            <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center text-xs font-semibold">
              2
            </button>

            <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center text-xs font-semibold">
              3
            </button>

            <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Purchase Bill Modal (F3) */}
      <NewPurchaseBillModal
        isOpen={showNewBillModal}
        onClose={() => setShowNewBillModal(false)}
        onPurchaseAdded={handlePurchaseAdded}
      />

      {/* Inward Slip Document Modal */}
      <InwardSlipModal
        isOpen={!!selectedBillForSlip}
        onClose={() => setSelectedBillForSlip(null)}
        bill={selectedBillForSlip}
      />

      {/* Suppliers Directory Modal */}
      <SuppliersModal
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
        suppliers={suppliers}
      />

      {/* Settle Supplier Payment Modal */}
      <SettleSupplierPaymentModal
        isOpen={!!selectedBillForPayment}
        onClose={() => setSelectedBillForPayment(null)}
        bill={selectedBillForPayment}
        onPaymentSettled={handlePaymentSettled}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  UserPlus,
  ShoppingCart,
  CreditCard,
  Flag,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { Bill, Product } from '../types';

interface DashboardPageProps {
  bills: Bill[];
  products: Product[];
  onNavigateTab: (tab: 'billing' | 'products' | 'sales' | 'customers') => void;
  onOpenAddProduct: () => void;
  onOpenAddCustomer: () => void;
  onViewBill: (bill: Bill) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  bills,
  products,
  onNavigateTab,
  onOpenAddProduct,
  onOpenAddCustomer,
  onViewBill,
}) => {
  const [salesTab, setSalesTab] = useState<'gross' | 'breakdown'>('gross');
  const [reorderedItems, setReorderedItems] = useState<string[]>([]);

  // Default mock bills matching the screenshot if no backend bills or merged
  const fallbackBills: Bill[] = [
    {
      id: 'mock-1042',
      invoiceNumber: 'INV-2024-1042',
      date: '2024-10-24T11:42:00.000Z',
      customer: {
        name: 'Vignesh R',
        phone: '+91 98401 23456',
        address: 'Madurai',
      },
      items: [
        {
          name: 'OnePlus Nord CE3',
          model: '+ 67W Adapter',
          quantity: 1,
          unitPrice: 22499,
          gstRate: 18,
          taxableAmount: 19066.95,
          cgst: 1716.02,
          sgst: 1716.02,
          total: 22499,
        },
      ],
      subTotal: 19066.95,
      cgstTotal: 1716.02,
      sgstTotal: 1716.02,
      totalTax: 3432.04,
      grandTotal: 22499,
      paymentMode: 'UPI',
      notes: 'Counter POS sale',
    },
    {
      id: 'mock-1041',
      invoiceNumber: 'INV-2024-1041',
      date: '2024-10-24T11:15:00.000Z',
      customer: {
        name: 'Deepak Kumar',
        phone: '+91 97890 88211',
      },
      items: [
        {
          name: 'Boat Rockerz 255 Pro+',
          model: 'Navy Blue • 1 yr War.',
          quantity: 1,
          unitPrice: 1299,
          gstRate: 18,
          taxableAmount: 1100.85,
          cgst: 99.07,
          sgst: 99.07,
          total: 1299,
        },
      ],
      subTotal: 1100.85,
      cgstTotal: 99.07,
      sgstTotal: 99.07,
      totalTax: 198.14,
      grandTotal: 1299,
      paymentMode: 'CASH',
      notes: 'Counter POS sale',
    },
    {
      id: 'mock-1040',
      invoiceNumber: 'INV-2024-1040',
      date: '2024-10-24T10:48:00.000Z',
      customer: {
        name: 'Kavitha Mehra',
        phone: '+91 94441 55092',
      },
      items: [
        {
          name: 'Samsung Galaxy A15 5G',
          model: 'Blue 128GB + Case',
          quantity: 1,
          unitPrice: 16799,
          gstRate: 18,
          taxableAmount: 14236.44,
          cgst: 1281.28,
          sgst: 1281.28,
          total: 16799,
        },
      ],
      subTotal: 14236.44,
      cgstTotal: 1281.28,
      sgstTotal: 1281.28,
      totalTax: 2562.56,
      grandTotal: 16799,
      paymentMode: 'CARD',
      notes: 'Counter POS sale',
    },
    {
      id: 'mock-1039',
      invoiceNumber: 'INV-2024-1039',
      date: '2024-10-24T10:22:00.000Z',
      customer: {
        name: 'S. Karthikeyan',
        phone: '+91 98410 77341',
      },
      items: [
        {
          name: 'Tempered Glass (2)',
          model: '+ Matte Back Cover',
          quantity: 2,
          unitPrice: 325,
          gstRate: 18,
          taxableAmount: 550.85,
          cgst: 49.57,
          sgst: 49.57,
          total: 650,
        },
      ],
      subTotal: 550.85,
      cgstTotal: 49.57,
      sgstTotal: 49.57,
      totalTax: 99.14,
      grandTotal: 650,
      paymentMode: 'UPI',
      notes: 'Counter POS sale',
    },
    {
      id: 'mock-1038',
      invoiceNumber: 'INV-2024-1038',
      date: '2024-10-24T09:55:00.000Z',
      customer: {
        name: 'M. Balaji',
        phone: '+91 99620 44510',
      },
      items: [
        {
          name: 'Realme Narzo 60x 5G',
          model: 'Nebula Purple 128GB',
          quantity: 1,
          unitPrice: 13499,
          gstRate: 18,
          taxableAmount: 11439.83,
          cgst: 1029.58,
          sgst: 1029.58,
          total: 13499,
        },
      ],
      subTotal: 11439.83,
      cgstTotal: 1029.58,
      sgstTotal: 1029.58,
      totalTax: 2059.16,
      grandTotal: 13499,
      paymentMode: 'CASH',
      notes: 'Counter POS sale',
    },
  ];

  // Merge live bills with fallback bills so the table always displays rich data
  const displayedBills = bills.length > 0 ? [...bills, ...fallbackBills].slice(0, 5) : fallbackBills;

  // Low stock items matching screenshot
  const lowStockItems = [
    {
      id: 'ls-1',
      name: 'iPhone 15 Tempered',
      subtitle: 'Spigen 9H Curved Edge',
      stockLeft: 3,
    },
    {
      id: 'ls-2',
      name: 'Samsung 25W Type',
      subtitle: 'Original Adapter (White)',
      stockLeft: 2,
    },
    {
      id: 'ls-3',
      name: 'Boat Airdopes 141',
      subtitle: 'Bold Black TWS',
      stockLeft: 1,
    },
  ];

  const handleReorder = (itemId: string, name: string) => {
    setReorderedItems((prev) => [...prev, itemId]);
    alert(`Purchase PO initiated for: ${name}. Vendor notified.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Header and Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, Rajesh!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's your shop overview for today, Thursday, Oct 24, 2024
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* New Bill Button with F2 Badge */}
          <button
            onClick={() => onNavigateTab('billing')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Receipt className="w-4 h-4" />
            <span>New Bill</span>
            <span className="bg-blue-700/80 text-blue-100 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ml-0.5">
              F2
            </span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all cursor-pointer hover:border-slate-300 active:scale-98"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Product</span>
          </button>

          {/* Add Customer Button */}
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-all cursor-pointer hover:border-slate-300 active:scale-98"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: TODAY'S SALES */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                TODAY'S SALES
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                ₹48,650
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                ↑ 14.2%
              </span>
              <span className="text-xs text-slate-500">vs. yesterday (₹42,600)</span>
            </div>
          </div>

          {/* Mini Sparkline Curve */}
          <div className="mt-4 pt-2">
            <svg
              className="w-full h-9 stroke-blue-500 fill-none overflow-visible"
              viewBox="0 0 240 40"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="blueSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,35 Q 35,33 60,25 T 120,28 T 170,16 T 210,18 T 240,8"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: BILLS ISSUED TODAY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                BILLS ISSUED TODAY
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">19</span>
              <span className="text-sm font-semibold text-slate-600">invoices</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 mt-2 font-medium">
              <span>14 Walk-in</span>
              <span>5 Existing Members</span>
            </div>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full rounded-l-full transition-all duration-500"
                style={{ width: '74%' }}
              ></div>
              <div
                className="bg-sky-300 h-full rounded-r-full transition-all duration-500"
                style={{ width: '26%' }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Walk-in 74%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-300"></span>
                Registered 26%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: MONTHLY SALES (OCT) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                MONTHLY SALES (OCT)
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Flag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                ₹8,42,300
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="font-bold text-emerald-700">84.2% Achieved</span>
              <span className="text-slate-500">Goal: ₹10,00,000</span>
            </div>
          </div>

          {/* Progress Bar & Days Remaining */}
          <div className="mt-4 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-emerald-800 h-full rounded-full transition-all duration-500"
                style={{ width: '84.2%' }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>7 days remaining</span>
              <span className="font-bold text-slate-800">₹1,57,700 left</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Weekly Sales Trend (Span 2) + Low Stock Alert (Span 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Sales Trend Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Weekly Sales Trend</h2>
                <p className="text-xs text-slate-500">
                  Daily store turnover tracking (Current week: Oct 18 - Oct 24)
                </p>
              </div>

              {/* Tabs toggle */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg self-start sm:self-auto text-xs font-semibold">
                <button
                  onClick={() => setSalesTab('gross')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    salesTab === 'gross'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gross Sales
                </button>
                <button
                  onClick={() => setSalesTab('breakdown')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    salesTab === 'breakdown'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Accessories vs Mobiles
                </button>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="pt-6 pb-2">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
                {/* Mon */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-500">₹38k</span>
                  <div
                    className="w-full max-w-[42px] bg-blue-100 rounded-t-md transition-all duration-300 group-hover:bg-blue-200"
                    style={{ height: '48%' }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">Mon</span>
                </div>

                {/* Tue */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-500">₹42k</span>
                  <div
                    className="w-full max-w-[42px] bg-blue-100 rounded-t-md transition-all duration-300 group-hover:bg-blue-200"
                    style={{ height: '56%' }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">Tue</span>
                </div>

                {/* Wed */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-500">₹35k</span>
                  <div
                    className="w-full max-w-[42px] bg-blue-100 rounded-t-md transition-all duration-300 group-hover:bg-blue-200"
                    style={{ height: '44%' }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">Wed</span>
                </div>

                {/* Thu (Today) - Highlighted Blue */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded shadow-xs">
                    ₹48.6k
                  </span>
                  <div
                    className="w-full max-w-[42px] bg-blue-600 rounded-t-md transition-all duration-300 ring-2 ring-blue-600/30"
                    style={{ height: '68%' }}
                  ></div>
                  <span className="text-xs font-bold text-blue-600 mt-1">Thu (Today)</span>
                </div>

                {/* Fri */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-500">₹51k</span>
                  <div
                    className="w-full max-w-[42px] bg-blue-100 rounded-t-md transition-all duration-300 group-hover:bg-blue-200"
                    style={{ height: '72%' }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">Fri</span>
                </div>

                {/* Sat - Record Green Bar */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-white bg-emerald-700 px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                    ₹62.4k ★
                  </span>
                  <div
                    className="w-full max-w-[42px] bg-emerald-700 rounded-t-md transition-all duration-300 ring-2 ring-emerald-600/30"
                    style={{ height: '90%' }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">Sat</span>
                </div>

                {/* Sun */}
                <div className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-500">₹58k</span>
                  <div
                    className="w-full max-w-[42px] bg-blue-100 rounded-t-md transition-all duration-300 group-hover:bg-blue-200"
                    style={{ height: '82%' }}
                  ></div>
                  <span className="text-xs font-medium text-slate-600 mt-1">Sun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Saturday recorded weekly record with 3 flagship device activations.
            </span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              Weekly Total: ₹3,35,050
            </span>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Low Stock Alert</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                4 Critical
              </span>
            </div>

            {/* Critical List */}
            <div className="divide-y divide-slate-100">
              {lowStockItems.map((item) => {
                const isReordered = reorderedItems.includes(item.id);
                return (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-md text-[11px] font-bold">
                        {item.stockLeft} Left
                      </span>
                      <button
                        onClick={() => handleReorder(item.id, item.name)}
                        disabled={isReordered}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isReordered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {isReordered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ordered
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" /> Reorder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View All Inventory Button */}
          <button
            onClick={() => onNavigateTab('products')}
            className="w-full mt-4 py-2.5 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
          >
            View All Inventory ({products.length > 0 ? products.length : 142} SKUs)
          </button>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Counter Bills Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Counter Bills</h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Live Feed
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('sales')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <span>View All Sales</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-5">INVOICE #</th>
                <th className="py-3 px-4">TIME</th>
                <th className="py-3 px-4">CUSTOMER & PHONE</th>
                <th className="py-3 px-4">ITEMS SUMMARY</th>
                <th className="py-3 px-4 text-right">AMOUNT</th>
                <th className="py-3 px-4 text-center">PAYMENT</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedBills.map((bill) => {
                const dateObj = new Date(bill.date);
                const timeStr = dateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                const firstItem = bill.items[0];
                const itemsSummary = firstItem
                  ? `${firstItem.name} ${firstItem.model ? `+ ${firstItem.model}` : ''}`
                  : 'Items included';

                return (
                  <tr
                    key={bill.id || bill.invoiceNumber}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Invoice Number */}
                    <td
                      className="py-3.5 px-5 font-bold font-mono text-blue-600 cursor-pointer hover:underline"
                      onClick={() => onViewBill(bill)}
                    >
                      {bill.invoiceNumber}
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {timeStr || '11:42 AM'}
                    </td>

                    {/* Customer & Phone */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{bill.customer.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {bill.customer.phone || '+91 98401 23456'}
                      </p>
                    </td>

                    {/* Items Summary */}
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {itemsSummary}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                      ₹{bill.grandTotal?.toLocaleString('en-IN')}
                    </td>

                    {/* Payment Mode Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200/60">
                        {bill.paymentMode || 'UPI'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        PAID
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onViewBill(bill)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Bar */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Showing latest 5 of 19 bills today</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Printer: Ready (3-inch Thermal)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

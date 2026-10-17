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

  // Filter active valid bills
  const validBills = bills.filter((b) => !b.isCancelled);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBills = validBills.filter((b) => (b.date || '').slice(0, 10) === todayStr);

  // Live KPI Calculations from MongoDB Bills
  const activeBillsForKpi = todayBills.length > 0 ? todayBills : validBills;
  const todaySales = activeBillsForKpi.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const todayCount = activeBillsForKpi.length;

  const walkInCount = activeBillsForKpi.filter(
    (b) => !b.customer?.id && (!b.customer?.phone || b.customer?.phone === 'Counter Sale' || b.customer?.name?.includes('Walk-in'))
  ).length;
  const memberCount = Math.max(0, todayCount - walkInCount);
  const walkInPct = todayCount > 0 ? Math.round((walkInCount / todayCount) * 100) : 70;
  const memberPct = 100 - walkInPct;

  const monthlySales = validBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const monthlyTarget = 1000000;
  const monthlyPercent = Number(((monthlySales / monthlyTarget) * 100).toFixed(1));

  // Display only real bills from MongoDB database
  const displayedBills = validBills.slice(0, 8);

  // Dynamic Low stock alerts calculated from MongoDB Products
  const criticalProducts = products.filter(
    (p) => (p.stock || 0) <= (p.minThreshold || 5)
  );
  const lowStockItems = criticalProducts.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    subtitle: `${p.model || p.category} • Left: ${p.stock}`,
    stockLeft: p.stock,
  }));

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
                ₹{todaySales.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Live Data
              </span>
              <span className="text-xs text-slate-500">From database billing records</span>
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
              <span className="text-3xl font-black text-slate-900 tracking-tight">{todayCount}</span>
              <span className="text-sm font-semibold text-slate-600">invoices</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 mt-2 font-medium">
              <span>{walkInCount} Walk-in</span>
              <span>{memberCount} Registered</span>
            </div>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${walkInPct}%` }}
              ></div>
              <div
                className="bg-sky-300 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${memberPct}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Walk-in {walkInPct}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-300"></span>
                Registered {memberPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: MONTHLY SALES (OCT) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                TOTAL SALES TURNOVER
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Flag className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                ₹{monthlySales.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="font-bold text-emerald-700">{monthlyPercent}% of Target</span>
              <span className="text-slate-500">Target: ₹10,00,000</span>
            </div>
          </div>

          {/* Progress Bar & Days Remaining */}
          <div className="mt-4 space-y-2">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, monthlyPercent)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Active Period</span>
              <span className="font-bold text-slate-800">
                ₹{Math.max(0, monthlyTarget - monthlySales).toLocaleString('en-IN')} to target
              </span>
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
                {lowStockItems.length} Critical
              </span>
            </div>

            {/* Critical List */}
            <div className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All inventory items are well above safety threshold!
                </div>
              ) : (
                lowStockItems.map((item) => {
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
                })
              )}
            </div>
          </div>

          {/* View All Inventory Button */}
          <button
            onClick={() => onNavigateTab('products')}
            className="w-full mt-4 py-2.5 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
          >
            View All Inventory ({products.length} SKUs in Database)
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
              {displayedBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No billing records yet in database. Issue your first bill with "New Bill"!
                  </td>
                </tr>
              ) : (
                displayedBills.map((bill) => {
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
                        {timeStr || 'Recent'}
                      </td>

                      {/* Customer & Phone */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{bill.customer.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {bill.customer.phone || 'Counter Sale'}
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Bar */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing latest {displayedBills.length} of {bills.length} bills in database
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Printer: Ready (3-inch Thermal)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

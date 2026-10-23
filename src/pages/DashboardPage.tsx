import React from 'react';
import {
  Receipt,
  Plus,
  UserPlus,
  CreditCard,
  Package,
  Users,
  Eye,
  ArrowRight,
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
  // Filter valid active bills
  const validBills = bills.filter((b) => !b.isCancelled && b.status !== 'CANCELLED');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBills = validBills.filter((b) => (b.date || '').slice(0, 10) === todayStr);

  const activeBills = todayBills.length > 0 ? todayBills : validBills;
  const todaySales = activeBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const totalBillsCount = activeBills.length;

  // Stock and low stock count
  const totalProducts = products.length;
  const lowStockCount = products.filter(
    (p) => (p.stock || 0) <= (p.minThreshold || 4)
  ).length;

  // Recent 6 bills
  const recentBills = validBills.slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateTab('billing')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
          >
            <Receipt className="w-4 h-4" />
            <span>New Bill</span>
            <span className="bg-blue-700/80 text-blue-100 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ml-0.5">
              F2
            </span>
          </button>

          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Product</span>
          </button>

          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-4 h-4 text-slate-500" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            ₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {totalBillsCount} bill{totalBillsCount === 1 ? '' : 's'} recorded
          </p>
        </div>

        {/* Total Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Inventory Items</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
            {totalProducts} Items
          </div>
          <p className="text-xs mt-1 font-medium flex items-center gap-1.5">
            {lowStockCount > 0 ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {lowStockCount} items low in stock
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">Stock healthy</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Quick Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('billing')}
          className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200/90 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Billing POS</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Start new customer sale</p>
        </button>

        <button
          onClick={() => onNavigateTab('sales')}
          className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200/90 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Bills & Sales</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">View all past invoices</p>
        </button>

        <button
          onClick={() => onNavigateTab('products')}
          className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200/90 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Inventory</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage phones & stock</p>
        </button>

        <button
          onClick={() => onNavigateTab('customers')}
          className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200/90 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Customers</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Customer dues & ledger</p>
        </button>
      </div>

      {/* 4. Recent Bills Simple Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900">Recent Bills</h2>
            <p className="text-xs text-slate-500">Latest invoices generated</p>
          </div>

          <button
            onClick={() => onNavigateTab('sales')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No bills generated yet. Click "+ New Bill" to create one.
                  </td>
                </tr>
              ) : (
                recentBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {bill.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {bill.customer?.name || 'Walk-in Customer'}
                      {bill.customer?.phone && bill.customer.phone !== 'Counter Sale' && (
                        <span className="block text-[11px] text-slate-400 font-mono font-normal">
                          {bill.customer.phone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {bill.date ? new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Today'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                        {bill.paymentMode || bill.tenderMode || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-sans">
                      ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewBill(bill)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="View & Print Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (sm:hidden) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {recentBills.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No bills generated yet. Tap "+ New Bill" to create one.
            </div>
          ) : (
            recentBills.map((bill) => (
              <div
                key={bill.id}
                onClick={() => onViewBill(bill)}
                className="p-3.5 flex items-center justify-between gap-3 active:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600">
                      {bill.invoiceNumber}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                      {bill.paymentMode || bill.tenderMode || 'Cash'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs mt-1 truncate">
                    {bill.customer?.name || 'Walk-in Customer'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {bill.date ? new Date(bill.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Today'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-sm text-slate-900 font-sans block">
                    ₹{(bill.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

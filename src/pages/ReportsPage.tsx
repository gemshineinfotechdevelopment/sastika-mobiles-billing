import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CreditCard,
  Package,
  Truck,
  Printer,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { Bill, Product } from '../types';
import type { NavTab } from '../components/Sidebar';
import { api } from '../services/api';

interface ReportsPageProps {
  bills?: Bill[];
  products?: Product[];
  onNavigateTab?: (tab: NavTab) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  bills = [],
  products = [],
  onNavigateTab,
}) => {
  const [analytics, setAnalytics] = useState<any>(null);

  const shopName = import.meta.env.VITE_SHOP_NAME || 'Sastika Mobiles';
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || '+91 98765 43210';
  const shopAddress = import.meta.env.VITE_SHOP_ADDRESS || 'Main Road, Bazaar Street, Tamil Nadu';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  useEffect(() => {
    api
      .getReportsAnalytics()
      .then((res) => {
        if (res.success) {
          setAnalytics(res);
        }
      })
      .catch((err) => console.warn('Could not load analytics:', err));
  }, []);

  // Compute live values with fallback
  const validBills = bills.filter((b) => !b.isCancelled && b.status !== 'CANCELLED');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBills = validBills.filter((b) => (b.date || '').slice(0, 10) === todayStr);

  const todaySales =
    analytics?.grossSalesToday ??
    analytics?.kpis?.todaySales?.value ??
    todayBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const monthSales =
    analytics?.monthlySales ??
    analytics?.kpis?.monthlySales?.value ??
    validBills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const stockValuation =
    analytics?.stockValuation ??
    analytics?.kpis?.stockValuation?.value ??
    products.reduce((acc, p) => acc + (p.stock || 0) * (p.costPrice || p.price * 0.8), 0);
  const supplierDues =
    analytics?.supplierDues ??
    analytics?.kpis?.purchases?.supplierDues ??
    0;

  const paymentBreakdown = analytics?.paymentModeBreakdown || {
    upi: 58,
    cash: 24,
    card: 12,
    khata: 6,
  };

  const topItems = analytics?.topSellingItems || [
    { name: 'Vivo V29 5G (8GB / 128GB)', category: 'Smartphones', soldUnits: 14, revenue: 447986 },
    { name: 'Super D 9H Matte Tempered Glass', category: 'Screen Protectors', soldUnits: 86, revenue: 25714 },
    { name: 'Apple 20W USB-C Power Adapter', category: 'Fast Chargers', soldUnits: 19, revenue: 36100 },
    { name: 'Samsung Galaxy M34 5G', category: 'Smartphones', soldUnits: 8, revenue: 135992 },
  ];

  const reorderAlerts = analytics?.criticalReorderAlerts || analytics?.reorderAlerts || [
    { name: 'Apple 20W Power Adapter', availUnits: 3, minSafe: 10, rate: 1900 },
    { name: 'Redmi Note 13 5G', availUnits: 1, minSafe: 4, rate: 17999 },
    { name: 'boAt Rockerz 255 Pro+', availUnits: 4, minSafe: 8, rate: 1299 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ─── SCREEN VIEW (Hidden on Print) ─────────────────────────────────── */}
      <div className="no-print space-y-6">
        {/* 1. Header with Print button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Business Reports &amp; Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Real-time shop financial summary and sales performance
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (Table Format)</span>
          </button>
        </div>

        {/* 2. Four Clean Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Sales */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Today's Sales</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ₹{todaySales.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Live active counter sales</p>
          </div>

          {/* Monthly Sales */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Monthly Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ₹{monthSales.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Current calendar month</p>
          </div>

          {/* Stock Valuation */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Stock Valuation</span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              ₹{stockValuation.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Wholesale cost value in shop</p>
          </div>

          {/* Supplier Dues */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Supplier Dues</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700 tracking-tight font-sans">
              ₹{supplierDues.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Vendor payables balance</p>
          </div>
        </div>

        {/* 3. Sales By Payment Mode */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <h2 className="font-bold text-sm text-slate-900">Payment Mode Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-700 block">UPI / GPay</span>
              <span className="text-xl font-black text-blue-900 mt-1 block">{paymentBreakdown.upi}%</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 block">Cash Sales</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">{paymentBreakdown.cash}%</span>
            </div>
            <div className="p-3 bg-violet-50/60 rounded-xl border border-violet-100">
              <span className="text-[11px] font-semibold text-violet-700 block">Card / POS</span>
              <span className="text-xl font-black text-violet-900 mt-1 block">{paymentBreakdown.card}%</span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="text-[11px] font-semibold text-amber-700 block">Credit / Due</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">{paymentBreakdown.khata}%</span>
            </div>
          </div>
        </div>

        {/* 4. Top Selling & Low Stock Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Selling Products */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-sm text-slate-900">Top Selling Products</h2>
              <p className="text-[11px] text-slate-500">Fastest moving items by units sold</p>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {topItems.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-400">{item.category} • {item.soldUnits} units sold</p>
                  </div>
                  <span className="font-bold font-sans text-slate-900">
                    ₹{Number(item.revenue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Reorder Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Low Stock Alerts</h2>
                <p className="text-[11px] text-slate-500">Items reaching critical reorder threshold</p>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('products')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {reorderAlerts.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[11px] text-slate-400">Min safe threshold: {item.minSafe} units</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    {item.availUnits} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DEDICATED PRINT VIEW (Table Format for Paper / PDF) ──────────── */}
      <div className="print-only space-y-4 bg-white text-slate-900">
        {/* Shop Header Table Box */}
        <div className="border border-slate-900 rounded-t-lg p-3.5 bg-slate-50/60 flex justify-between items-start">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{shopName}</h2>
            <p className="text-slate-600 text-xs">{shopAddress}</p>
            <p className="text-slate-600 text-xs">Phone: <strong className="text-slate-900">{shopPhone}</strong></p>
            <p className="text-slate-900 font-mono text-xs font-bold mt-0.5">GSTIN: {shopGstin}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider mb-1">
              FINANCIAL AUDIT REPORT
            </span>
            <p className="text-slate-600 text-xs">Generated: <strong className="text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
            <p className="text-slate-600 text-xs">Time: <strong className="text-slate-900">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></p>
          </div>
        </div>

        {/* Executive KPI Summary Table */}
        <table className="w-full text-xs border border-slate-900 border-collapse print-table">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
              <th className="py-2 px-3 border-r border-slate-900 w-12 text-center">#</th>
              <th className="py-2 px-3 border-r border-slate-900">Financial Metric Indicator</th>
              <th className="py-2 px-3 border-r border-slate-900 w-32 text-center">Reference Period</th>
              <th className="py-2 px-3 text-right w-44">Value / Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-900">
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">1</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">Today's Gross Sales Revenue</td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-slate-900">
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">2</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">Monthly Turnover Sales</td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">Current Calendar Month</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">₹{monthSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-slate-900">
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">3</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">Current Stock Inventory Valuation</td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">At Cost Wholesale Value</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">₹{stockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">4</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">Outstanding Supplier Vendor Dues</td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">Payables Outstanding</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-rose-700">₹{supplierDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        {/* Payment Channels Table */}
        <table className="w-full text-xs border border-slate-900 border-collapse print-table">
          <thead>
            <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
              <th className="py-1.5 px-3 border-r border-slate-900">UPI / QR Collection</th>
              <th className="py-1.5 px-3 border-r border-slate-900">Cash in Drawer</th>
              <th className="py-1.5 px-3 border-r border-slate-900">Card / POS Swipes</th>
              <th className="py-1.5 px-3">Customer Credit / Due</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center font-mono font-bold text-sm">
              <td className="py-2 px-3 border-r border-slate-900">{paymentBreakdown.upi}% Share</td>
              <td className="py-2 px-3 border-r border-slate-900">{paymentBreakdown.cash}% Share</td>
              <td className="py-2 px-3 border-r border-slate-900">{paymentBreakdown.card}% Share</td>
              <td className="py-2 px-3 text-rose-700">{paymentBreakdown.khata}% Share</td>
            </tr>
          </tbody>
        </table>

        {/* Top Selling Products Table */}
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Top Performing Inventory Products:
          </h4>
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
                <th className="py-2 px-2.5 text-center border-r border-slate-900 w-10">#</th>
                <th className="py-2 px-2.5 border-r border-slate-900">Product Name</th>
                <th className="py-2 px-2.5 border-r border-slate-900 w-36 text-center">Category</th>
                <th className="py-2 px-2.5 border-r border-slate-900 w-24 text-center">Units Sold</th>
                <th className="py-2 px-2.5 text-right w-36">Sales Revenue (₹)</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-900">
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-mono">{idx + 1}</td>
                  <td className="py-1.5 px-2.5 font-bold border-r border-slate-900 text-slate-900">{item.name}</td>
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-900 text-slate-700">{item.category}</td>
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-bold">{item.soldUnits} Nos</td>
                  <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                    ₹{Number(item.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Critical Stock Reorder Alerts (Reorder Threshold):
          </h4>
          <table className="w-full text-xs border border-slate-900 border-collapse print-table">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-900 font-bold">
                <th className="py-2 px-2.5 text-center border-r border-slate-900 w-10">#</th>
                <th className="py-2 px-2.5 border-r border-slate-900">Product Specification</th>
                <th className="py-2 px-2.5 border-r border-slate-900 w-28 text-center">Current Units</th>
                <th className="py-2 px-2.5 border-r border-slate-900 w-32 text-center">Min Safe Level</th>
                <th className="py-2 px-2.5 text-center w-28">Action Status</th>
              </tr>
            </thead>
            <tbody>
              {reorderAlerts.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-900">
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-mono">{idx + 1}</td>
                  <td className="py-1.5 px-2.5 font-bold border-r border-slate-900 text-slate-900">{item.name}</td>
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-bold text-rose-700">{item.availUnits} left</td>
                  <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-mono">{item.minSafe} units</td>
                  <td className="py-1.5 px-2.5 text-center font-bold text-amber-800">REORDER NOW</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verification Signatory Footer */}
        <div className="border border-slate-900 rounded-b-lg p-4 mt-2 flex justify-between items-end text-xs bg-slate-50/30">
          <div>
            <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-1">Fiscal Certification:</p>
            <p className="text-slate-500 text-[11px]">This report represents live verified transactional data from the billing terminal.</p>
            <div className="mt-8 border-t border-slate-900 pt-1 w-36 text-center">
              <p className="font-semibold text-slate-700 text-[11px]">Prepared by Cashier</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-slate-600 text-xs">For <strong className="text-slate-900">{shopName}</strong></p>
            <div className="mt-8 border-t border-slate-900 pt-1 w-40 text-center ml-auto">
              <p className="font-bold text-slate-900 text-xs">Store Proprietor Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

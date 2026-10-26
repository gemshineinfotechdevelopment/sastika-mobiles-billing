import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  CreditCard,
  Package,
  Truck,
  Printer,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getReportsAnalytics();
      if (res && res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.warn('Could not load analytics from database:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Shop details from database or fallback environment
  const shopName =
    analytics?.shopSettings?.shopName ||
    import.meta.env.VITE_SHOP_NAME ||
    'Sastika Mobiles';
  const shopPhone =
    analytics?.shopSettings?.phone ||
    import.meta.env.VITE_SHOP_PHONE ||
    '+91 98765 43210';
  const shopAddress =
    analytics?.shopSettings?.address ||
    import.meta.env.VITE_SHOP_ADDRESS ||
    'Main Road, Bazaar Street, Tamil Nadu';
  const shopGstin =
    analytics?.shopSettings?.gstin ||
    import.meta.env.VITE_SHOP_GSTIN ||
    '33AAAAA0000A1Z5';

  // Compute live values from database bills
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
    products.reduce((acc, p) => acc + (p.stock || 0) * (p.costPrice || (p.price ? p.price * 0.8 : 0)), 0);

  const supplierDues =
    analytics?.supplierDues ??
    analytics?.kpis?.purchases?.supplierDues ??
    0;

  // Real payment mode calculation from actual bills in database
  const computePaymentBreakdown = (): { upi: number; cash: number; card: number; khata: number } => {
    if (analytics?.paymentModeBreakdown) {
      return analytics.paymentModeBreakdown;
    }
    if (!validBills.length) {
      return { upi: 0, cash: 0, card: 0, khata: 0 };
    }
    let upi = 0, cash = 0, card = 0, khata = 0;
    validBills.forEach((b) => {
      const mode = (b.paymentMode || b.tenderMode || '').toLowerCase();
      if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('paytm')) {
        upi++;
      } else if (mode.includes('card') || mode.includes('pos')) {
        card++;
      } else if (mode.includes('khata') || mode.includes('credit') || (b.balanceDue || 0) > 0) {
        khata++;
      } else {
        cash++;
      }
    });
    const total = validBills.length;
    return {
      upi: Math.round((upi / total) * 100),
      cash: Math.round((cash / total) * 100),
      card: Math.round((card / total) * 100),
      khata: Math.round((khata / total) * 100),
    };
  };

  // Real top selling items from actual bills in database
  const computeTopItems = (): Array<{ name: string; category?: string; soldUnits: number; revenue: number }> => {
    if (analytics?.topSellingItems && Array.isArray(analytics.topSellingItems)) {
      return analytics.topSellingItems;
    }
    const map = new Map<string, { name: string; category?: string; soldUnits: number; revenue: number }>();
    validBills.forEach((b) => {
      (b.items || []).forEach((item) => {
        const key = item.name || 'Item';
        const curr = map.get(key) || { name: key, category: 'General', soldUnits: 0, revenue: 0 };
        curr.soldUnits += item.quantity || 1;
        curr.revenue += item.total || ((item.unitPrice || 0) * (item.quantity || 1));
        map.set(key, curr);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.soldUnits - a.soldUnits).slice(0, 10);
  };

  // Real reorder alerts strictly from products in database
  const computeReorderAlerts = (): Array<{
    id?: string;
    name: string;
    category?: string;
    availUnits: number;
    minSafe: number;
    rate?: number;
  }> => {
    if (analytics?.criticalReorderAlerts && Array.isArray(analytics.criticalReorderAlerts)) {
      return analytics.criticalReorderAlerts;
    }
    if (analytics?.reorderAlerts && Array.isArray(analytics.reorderAlerts)) {
      return analytics.reorderAlerts;
    }
    return products
      .filter((p) => (p.stock || 0) <= (p.minThreshold ?? 5))
      .sort((a, b) => (a.stock || 0) - (b.stock || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || 'General',
        availUnits: p.stock || 0,
        minSafe: p.minThreshold || 5,
        rate: p.price || 0,
      }));
  };

  const paymentBreakdown = computePaymentBreakdown();
  const topItems = computeTopItems();
  const reorderAlerts = computeReorderAlerts();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ─── SCREEN VIEW (Hidden on Print) ─────────────────────────────────── */}
      <div className="no-print space-y-6">
        {/* 1. Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Business Reports &amp; Analytics
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Database Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live transactional summary retrieved from MongoDB
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Refresh data from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report (Table Format)</span>
            </button>
          </div>
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
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">Payment Mode Breakdown</h2>
            <span className="text-[11px] text-slate-400">Calculated from registered bills</span>
          </div>
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
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Top Selling Products</h2>
                <p className="text-[11px] text-slate-500">Fastest moving items from database sales</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {topItems.length} {topItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {topItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                <p className="font-medium text-slate-600">No sales recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Products will appear here automatically as customer bills are created.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {topItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {item.category || 'General'} • {item.soldUnits} units sold
                      </p>
                    </div>
                    <span className="font-bold font-sans text-slate-900">
                      ₹{Number(item.revenue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
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

            {reorderAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-2 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="font-medium text-slate-700">Healthy Stock Levels</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No inventory items are currently below reorder thresholds.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {reorderAlerts.map((item, idx) => (
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
            )}
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
            <p className="text-slate-600 text-xs">
              Phone: <strong className="text-slate-900">{shopPhone}</strong>
            </p>
            <p className="text-slate-900 font-mono text-xs font-bold mt-0.5">GSTIN: {shopGstin}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-slate-900 text-white rounded font-bold text-xs uppercase tracking-wider mb-1">
              FINANCIAL AUDIT REPORT
            </span>
            <p className="text-slate-600 text-xs">
              Generated:{' '}
              <strong className="text-slate-900">
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </strong>
            </p>
            <p className="text-slate-600 text-xs">
              Time:{' '}
              <strong className="text-slate-900">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </p>
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
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">
                Today's Gross Sales Revenue
              </td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">
                ₹{todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="border-b border-slate-900">
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">2</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">
                Monthly Turnover Sales
              </td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">Current Calendar Month</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">
                ₹{monthSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="border-b border-slate-900">
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">3</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">
                Current Stock Inventory Valuation
              </td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">At Cost Wholesale Value</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-slate-900">
                ₹{stockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 text-center border-r border-slate-900 font-mono">4</td>
              <td className="py-1.5 px-3 font-bold text-slate-900 border-r border-slate-900">
                Outstanding Supplier Vendor Dues
              </td>
              <td className="py-1.5 px-3 text-center border-r border-slate-900">Payables Outstanding</td>
              <td className="py-1.5 px-3 font-bold text-right font-mono text-rose-700">
                ₹{supplierDues.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
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
              {topItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                    No sales recorded yet in database
                  </td>
                </tr>
              ) : (
                topItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-900">
                    <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-mono">{idx + 1}</td>
                    <td className="py-1.5 px-2.5 font-bold border-r border-slate-900 text-slate-900">{item.name}</td>
                    <td className="py-1.5 px-2.5 text-center border-r border-slate-900 text-slate-700">
                      {item.category || 'General'}
                    </td>
                    <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-bold">
                      {item.soldUnits} Nos
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                      ₹{Number(item.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
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
              {reorderAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                    All inventory items are above critical reorder thresholds
                  </td>
                </tr>
              ) : (
                reorderAlerts.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-900">
                    <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-mono">{idx + 1}</td>
                    <td className="py-1.5 px-2.5 font-bold border-r border-slate-900 text-slate-900">{item.name}</td>
                    <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-bold text-rose-700">
                      {item.availUnits} left
                    </td>
                    <td className="py-1.5 px-2.5 text-center border-r border-slate-900 font-mono">
                      {item.minSafe} units
                    </td>
                    <td className="py-1.5 px-2.5 text-center font-bold text-amber-800">REORDER NOW</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Verification Signatory Footer */}
        <div className="border border-slate-900 rounded-b-lg p-4 mt-2 flex justify-between items-end text-xs bg-slate-50/30">
          <div>
            <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-1">Fiscal Certification:</p>
            <p className="text-slate-500 text-[11px]">
              This report represents live verified transactional data from the billing terminal.
            </p>
            <div className="mt-8 border-t border-slate-900 pt-1 w-36 text-center">
              <p className="font-semibold text-slate-700 text-[11px]">Prepared by Cashier</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-slate-600 text-xs">
              For <strong className="text-slate-900">{shopName}</strong>
            </p>
            <div className="mt-8 border-t border-slate-900 pt-1 w-40 text-center ml-auto">
              <p className="font-bold text-slate-900 text-xs">Store Proprietor Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

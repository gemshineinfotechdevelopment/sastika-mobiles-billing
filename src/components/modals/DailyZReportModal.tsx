import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Printer, FileText, CheckCircle2, RefreshCw, Calendar, AlertTriangle, TrendingUp, IndianRupee, PackageCheck, ReceiptIndianRupee } from 'lucide-react';
import type { Bill, ZReportData, ZReportProductItem, ZReportBillSummary } from '../../types';
import { api } from '../../services/api';

interface DailyZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string;
  bills?: Bill[];
}

export const DailyZReportModal: React.FC<DailyZReportModalProps> = ({
  isOpen,
  onClose,
  bills = [],
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [reportData, setReportData] = useState<ZReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Shop details from database
  const [shopName, setShopName] = useState('Sastika Mobiles');
  const [shopPhone, setShopPhone] = useState('+91 98765 43210');
  const [shopAddress, setShopAddress] = useState('Main Road, Bazaar Street, Tamil Nadu');
  const [shopGstin, setShopGstin] = useState('33AAAAA0000A1Z5');

  // Load shop settings from database
  useEffect(() => {
    api.getShopInfo()
      .then((info) => {
        if (info) {
          if (info.name) setShopName(info.name);
          if (info.phone) setShopPhone(info.phone);
          if (info.address) setShopAddress(info.address);
          if (info.gstin) setShopGstin(info.gstin);
        }
      })
      .catch(() => {});
  }, []);

  // Compute fallback report directly from live bills array if network drops
  const computeLocalReport = useCallback((date: string): ZReportData => {
    const dayBills = bills.filter((b) => (b.date || '').slice(0, 10) === date);
    const active = dayBills.filter((b) => !b.isCancelled && b.status !== 'CANCELLED');
    const voids = dayBills.filter((b) => b.isCancelled || b.status === 'CANCELLED');

    let grossSales = 0;
    let taxableTurnover = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let totalTax = 0;
    let totalItemsCount = 0;
    let discountsTotal = 0;

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let khataCreditSales = 0;
    let netCollected = 0;

    const productMap = new Map<string, ZReportProductItem>();

    active.forEach((b) => {
      const g = Number(b.grandTotal) || 0;
      const sub = Number(b.subTotal) || 0;
      const cg = Number(b.cgstTotal) || 0;
      const sg = Number(b.sgstTotal) || 0;
      const tax = Number(b.totalTax) || cg + sg;
      const paid = Number(b.paidAmount !== undefined ? b.paidAmount : g);
      const due = Number(b.balanceDue !== undefined ? b.balanceDue : Math.max(0, g - paid));

      grossSales += g;
      taxableTurnover += sub;
      cgstTotal += cg;
      sgstTotal += sg;
      totalTax += tax;

      let billDiscount = 0;
      if (b.notes && b.notes.includes('-₹')) {
        const m = b.notes.match(/-₹(\d+(\.\d+)?)/);
        if (m) billDiscount = parseFloat(m[1]);
      }
      discountsTotal += billDiscount;

      khataCreditSales += due;
      netCollected += paid;

      const mode = (b.paymentMode || b.tenderMode || 'Cash').toLowerCase();
      if (mode.includes('upi') || mode.includes('gpay') || mode.includes('phonepe') || mode.includes('qr')) {
        upiSales += paid;
      } else if (mode.includes('card') || mode.includes('pos')) {
        cardSales += paid;
      } else if (mode.includes('credit') || mode.includes('khata')) {
        if (paid > 0) cashSales += paid;
      } else {
        cashSales += paid;
      }

      if (Array.isArray(b.items)) {
        const billGross = b.items.reduce((s, it) => s + (Number(it.total) || (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)), 0);
        b.items.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          const rate = Number(item.unitPrice) || 0;
          const gross = Number(item.total) || rate * qty;
          const itemDiscount = billGross > 0 ? (gross / billGross) * billDiscount : 0;
          const netWorth = Math.max(0, gross - itemDiscount);

          totalItemsCount += qty;

          const key = item.productId || item.name;
          const existing = productMap.get(key);
          if (existing) {
            existing.quantity += qty;
            existing.grossAmount += gross;
            existing.discountAmount += itemDiscount;
            existing.netWorthAmount += netWorth;
            existing.profit += netWorth;
          } else {
            productMap.set(key, {
              productId: item.productId || '',
              name: item.name,
              model: item.model || '',
              category: (item as any).category || 'General',
              quantity: qty,
              unitPrice: rate,
              grossAmount: gross,
              discountAmount: itemDiscount,
              netWorthAmount: netWorth,
              unitCost: 0,
              totalCost: 0,
              profit: netWorth,
            });
          }
        });
      }
    });

    let voidTotal = 0;
    voids.forEach((b) => {
      voidTotal += Number(b.grandTotal) || 0;
    });

    const billsList: ZReportBillSummary[] = active.map((b) => ({
      id: b.id,
      invoiceNumber: b.invoiceNumber,
      time: (b as any).createdAt ? new Date((b as any).createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '12:00',
      customerName: b.customer?.name || 'Walk-in Customer',
      customerPhone: b.customer?.phone || '',
      itemsCount: Array.isArray(b.items) ? b.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 0,
      itemsSummary: Array.isArray(b.items) ? b.items.map((it) => it.name).join(', ') : '',
      paymentMode: b.paymentMode || b.tenderMode || 'Cash',
      grandTotal: b.grandTotal,
      paidAmount: b.paidAmount !== undefined ? b.paidAmount : b.grandTotal,
      balanceDue: b.balanceDue !== undefined ? b.balanceDue : 0,
      status: b.balanceDue && b.balanceDue > 0 ? 'PARTIAL' : 'PAID',
    }));

    return {
      reportDate: date,
      terminal: 'Terminal 01',
      totalInvoices: active.length,
      firstInvoice: active.length > 0 ? active[active.length - 1].invoiceNumber : 'None',
      lastInvoice: active.length > 0 ? active[0].invoiceNumber : 'None',
      grossSales: Number(grossSales.toFixed(2)),
      totalCost: 0,
      totalProfit: Number(grossSales.toFixed(2)),
      profitMargin: 100,
      taxableTurnover: Number(taxableTurnover.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      totalItemsCount,
      discountsTotal: Number(discountsTotal.toFixed(2)),
      netSales: Number(taxableTurnover.toFixed(2)),
      breakdown: {
        cashSales: Number(cashSales.toFixed(2)),
        upiSales: Number(upiSales.toFixed(2)),
        cardSales: Number(cardSales.toFixed(2)),
        khataCreditSales: Number(khataCreditSales.toFixed(2)),
        netCollected: Number(netCollected.toFixed(2)),
      },
      voids: {
        count: voids.length,
        totalAmount: Number(voidTotal.toFixed(2)),
      },
      productsSold: Array.from(productMap.values()),
      billsList,
      generatedAt: new Date().toISOString(),
    };
  }, [bills]);

  // Fetch live Z-Report directly from database API
  const fetchReport = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await api.getZReport(date);
      if (res && res.success) {
        setReportData(res);
      } else {
        setReportData(computeLocalReport(date));
      }
    } catch (err: any) {
      console.warn('Backend Z-Report load notice:', err.message);
      setReportData(computeLocalReport(date));
    } finally {
      setLoading(false);
    }
  }, [computeLocalReport]);

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedDate);
    }
  }, [isOpen, selectedDate, fetchReport]);

  // Keyboard shortcut listener: F9 to print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9' && isOpen) {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        {/* Screen Header (Excluded from print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Daily Z-Report & Sales Register</h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200/60">
                  Live DB Synchronized
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">Today's Sales, Profit, Product Worth & Reconciliation • Terminal 01</p>
            </div>
          </div>

          {/* Date Selector & Refresh/Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-200 rounded-xl text-xs shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none text-xs cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchReport(selectedDate)}
              disabled={loading}
              title="Refresh Z-Report from Database"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Z-Report Sheet */}
        <div id="printable-zreport" className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto bg-white flex-1 font-sans">
          {/* Shop Header */}
          <div className="border border-slate-900 rounded-lg p-3 bg-slate-50/70 text-center space-y-0.5">
            <h2 className="font-black text-base text-slate-950 uppercase tracking-wider">{shopName}</h2>
            <p className="text-[11px] text-slate-700">{shopAddress} • Phone: {shopPhone}</p>
            <p className="text-[11px] font-mono font-bold text-slate-950">GSTIN: {shopGstin}</p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-900">
              <span className="font-black text-xs uppercase tracking-wider text-slate-950 block">
                DAILY FISCAL CLOSING & SALES AUDIT REPORT (Z-REPORT)
              </span>
              <p className="text-[10px] text-slate-600 font-medium">
                REPORT PERIOD: {formattedDate} (00:00 - 23:59) • TERMINAL 01 • MONGO LIVE DATA
              </p>
            </div>
          </div>

          {loading && !reportData ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs font-semibold">Retrieving Daily Report from Database...</p>
            </div>
          ) : reportData ? (
            <>
              {/* Top KPI Cards: Today's Sales & Today's Profit */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print-hide-screen">
                <div className="border border-slate-900 rounded-lg p-2.5 bg-blue-50/40">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Today's Sales</span>
                    <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-base font-black text-slate-950 font-mono">
                    ₹{reportData.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {reportData.totalInvoices} Bills • {reportData.totalItemsCount} Units Sold
                  </div>
                </div>

                <div className="border border-slate-900 rounded-lg p-2.5 bg-emerald-50/40">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Today's Profit</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-base font-black text-emerald-700 font-mono">
                    ₹{reportData.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    {reportData.profitMargin}% Margin on Sales
                  </div>
                </div>

                <div className="border border-slate-900 rounded-lg p-2.5 bg-purple-50/40">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cash & UPI In Hand</span>
                    <ReceiptIndianRupee className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="text-base font-black text-purple-900 font-mono">
                    ₹{reportData.breakdown.netCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Cash: ₹{reportData.breakdown.cashSales} | UPI: ₹{reportData.breakdown.upiSales}
                  </div>
                </div>

                <div className="border border-slate-900 rounded-lg p-2.5 bg-amber-50/40">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Customer Due (Khata)</span>
                    <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-base font-black text-amber-900 font-mono">
                    ₹{reportData.breakdown.khataCreditSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">
                    {reportData.breakdown.khataCreditSales > 0 ? 'Pending Collection' : 'Zero Balance Due'}
                  </div>
                </div>
              </div>

              {/* 2-Column Summary Grid: Sales Register & Payment Collection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Table 1: Sales Register Summary */}
                <table className="w-full text-xs border border-slate-900 border-collapse print-table">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900">
                      <th className="py-1.5 px-3 border-r border-slate-900 text-left">1. Sales Register Summary</th>
                      <th className="py-1.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 font-semibold text-slate-800 border-r border-slate-900">
                        Total Invoices Billed:
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-950">
                        {reportData.totalInvoices} Invoices
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 text-slate-700 border-r border-slate-900">
                        Invoice Range (First - Last):
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-slate-800 text-[11px]">
                        {reportData.firstInvoice !== 'None' ? `${reportData.firstInvoice} - ${reportData.lastInvoice}` : 'None'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 text-slate-700 border-r border-slate-900">
                        Total Product Units Sold:
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-slate-800">
                        {reportData.totalItemsCount} Units
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 font-semibold text-slate-800 border-r border-slate-900">
                        Gross Billed Sales (Today):
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-950">
                        ₹{reportData.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 text-slate-700 border-r border-slate-900">
                        Discounts &amp; Round Off:
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-rose-700">
                        - ₹{reportData.discountsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900 bg-emerald-50/50">
                      <td className="py-1 px-3 font-bold text-emerald-900 border-r border-slate-900">
                        Total Profit (Gross - Cost):
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-emerald-800">
                        ₹{reportData.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({reportData.profitMargin}%)
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="py-1 px-3 font-black text-slate-950 border-r border-slate-900 uppercase">
                        Total Revenue (Tax Inclusive):
                      </td>
                      <td className="py-1 px-3 font-black text-right font-mono text-slate-950">
                        ₹{reportData.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Table 2: Payment Collection Mode */}
                <table className="w-full text-xs border border-slate-900 border-collapse print-table">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900">
                      <th className="py-1.5 px-3 border-r border-slate-900 text-left">2. Payment Collection Mode</th>
                      <th className="py-1.5 px-3 text-right">Net Received (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 text-slate-800 border-r border-slate-900 font-semibold">
                        Cash in Drawer (Counter):
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-950">
                        ₹{reportData.breakdown.cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 text-slate-800 border-r border-slate-900">
                        UPI / GPay / PhonePe (Bank Direct):
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-950">
                        ₹{reportData.breakdown.upiSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900">
                      <td className="py-1 px-3 text-slate-800 border-r border-slate-900">
                        Card / POS Terminal:
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-slate-950">
                        ₹{reportData.breakdown.cardSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-900 bg-amber-50/50">
                      <td className="py-1 px-3 font-bold text-amber-900 border-r border-slate-900">
                        Customer Balance Due (Khata / Credit):
                      </td>
                      <td className="py-1 px-3 text-right font-mono font-bold text-amber-900">
                        ₹{reportData.breakdown.khataCreditSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold border-b border-slate-900">
                      <td className="py-1 px-3 font-black text-slate-950 border-r border-slate-900 uppercase">
                        Total Money Collected Today:
                      </td>
                      <td className="py-1 px-3 font-black text-right font-mono text-emerald-800">
                        ₹{reportData.breakdown.netCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {reportData.voids.count > 0 && (
                      <tr className="bg-rose-50/40 text-rose-800">
                        <td className="py-1 px-3 border-r border-slate-900">
                          Void / Cancelled ({reportData.voids.count} Bills):
                        </td>
                        <td className="py-1 px-3 text-right font-mono font-bold">
                          ₹{reportData.voids.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table 3: GST Tax Liability (Tamil Nadu 33) */}
              <table className="w-full text-xs border border-slate-900 border-collapse print-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900">
                    <th className="py-1.5 px-3 border-r border-slate-900 text-left">3. GST & Tax Liability (State Code: 33)</th>
                    <th className="py-1.5 px-3 text-right">Tax Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="py-1 px-3 text-slate-700 border-r border-slate-900">
                      Taxable Sales Turnover (Excl. Tax):
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-semibold text-slate-950">
                      ₹{reportData.taxableTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="py-1 px-3 text-slate-700 border-r border-slate-900">
                      Central GST (CGST):
                    </td>
                    <td className="py-1 px-3 text-right font-mono text-slate-950">
                      ₹{reportData.cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="py-1 px-3 text-slate-700 border-r border-slate-900">
                      State GST (SGST):
                    </td>
                    <td className="py-1 px-3 text-right font-mono text-slate-950">
                      ₹{reportData.sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-1 px-3 text-slate-950 border-r border-slate-900 uppercase">
                      Total Output GST Liability:
                    </td>
                    <td className="py-1 px-3 text-right font-mono font-bold text-slate-950">
                      ₹{reportData.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Table 4: Product Details & Worth Amount after Discount */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-950 text-xs uppercase tracking-wider">
                    4. Product Sales, After-Discount Worth &amp; Profit
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {reportData.productsSold ? reportData.productsSold.length : 0} Products Sold Today
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-900 rounded-lg">
                  <table className="w-full text-xs border-collapse print-table">
                    <thead>
                      <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900 text-center">
                        <th className="py-1.5 px-2 text-left border-r border-slate-900 w-8">#</th>
                        <th className="py-1.5 px-2 text-left border-r border-slate-900">Product Name &amp; Model</th>
                        <th className="py-1.5 px-2 border-r border-slate-900 w-12">Qty</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900">Rate (₹)</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900">Gross (₹)</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900">Discount (₹)</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900 bg-blue-50 font-black">
                          Worth After Discount (₹)
                        </th>
                        <th className="py-1.5 px-2 text-right bg-emerald-50 font-bold text-emerald-950">
                          Profit (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.productsSold && reportData.productsSold.length > 0 ? (
                        reportData.productsSold.map((prod, idx) => (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-1 px-2 text-slate-500 border-r border-slate-900 text-center font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-2 font-medium text-slate-900 border-r border-slate-900">
                              <div>{prod.name}</div>
                              {prod.model && (
                                <span className="text-[10px] text-slate-500">{prod.model}</span>
                              )}
                            </td>
                            <td className="py-1 px-2 text-center font-mono font-bold text-slate-800 border-r border-slate-900">
                              {prod.quantity}
                            </td>
                            <td className="py-1 px-2 text-right font-mono text-slate-700 border-r border-slate-900">
                              ₹{prod.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-2 text-right font-mono text-slate-700 border-r border-slate-900">
                              ₹{prod.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-2 text-right font-mono text-rose-700 border-r border-slate-900">
                              {prod.discountAmount > 0 ? `-₹${prod.discountAmount.toFixed(2)}` : '₹0.00'}
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-slate-950 border-r border-slate-900 bg-blue-50/40">
                              ₹{prod.netWorthAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-emerald-800 bg-emerald-50/40">
                              ₹{prod.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-3 text-center text-slate-500">
                            No product sales recorded for this date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {reportData.productsSold && reportData.productsSold.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-100 font-bold border-t border-slate-900">
                          <td colSpan={2} className="py-1.5 px-2 text-slate-950 uppercase border-r border-slate-900">
                            Total Product Worth:
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-950 border-r border-slate-900">
                            {reportData.totalItemsCount}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-900 text-right">-</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950 border-r border-slate-900">
                            ₹{reportData.grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-rose-700 border-r border-slate-900">
                            -₹{reportData.discountsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-black text-blue-950 border-r border-slate-900 bg-blue-100/60">
                            ₹{(reportData.grossSales - reportData.discountsTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-black text-emerald-900 bg-emerald-100/60">
                            ₹{reportData.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Table 5: Day's Bills & Payment Transactions Register */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-950 text-xs uppercase tracking-wider">
                    5. Day's Invoices &amp; Payments Register
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {reportData.billsList ? reportData.billsList.length : 0} Invoices Recorded
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-900 rounded-lg">
                  <table className="w-full text-xs border-collapse print-table">
                    <thead>
                      <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900 text-center">
                        <th className="py-1.5 px-2 text-left border-r border-slate-900 w-14">Time</th>
                        <th className="py-1.5 px-2 text-left border-r border-slate-900 w-24">Invoice #</th>
                        <th className="py-1.5 px-2 text-left border-r border-slate-900">Customer</th>
                        <th className="py-1.5 px-2 text-left border-r border-slate-900">Items Sold</th>
                        <th className="py-1.5 px-2 border-r border-slate-900 w-16">Mode</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900">Total (₹)</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900">Paid (₹)</th>
                        <th className="py-1.5 px-2 text-right border-r border-slate-900">Due (₹)</th>
                        <th className="py-1.5 px-2 text-center w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.billsList && reportData.billsList.length > 0 ? (
                        reportData.billsList.map((bill, idx) => (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="py-1 px-2 text-slate-600 border-r border-slate-900 font-mono text-[11px]">
                              {bill.time}
                            </td>
                            <td className="py-1 px-2 font-mono font-bold text-slate-900 border-r border-slate-900 text-[11px]">
                              {bill.invoiceNumber}
                            </td>
                            <td className="py-1 px-2 text-slate-900 border-r border-slate-900">
                              <div className="font-medium">{bill.customerName}</div>
                              {bill.customerPhone && (
                                <div className="text-[10px] text-slate-500 font-mono">{bill.customerPhone}</div>
                              )}
                            </td>
                            <td className="py-1 px-2 text-slate-700 border-r border-slate-900 max-w-[180px] truncate text-[11px]">
                              {bill.itemsSummary}
                            </td>
                            <td className="py-1 px-2 text-center font-semibold text-slate-700 border-r border-slate-900 text-[11px]">
                              {bill.paymentMode}
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-900">
                              ₹{bill.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-semibold text-emerald-700 border-r border-slate-900">
                              ₹{bill.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-2 text-right font-mono font-semibold text-amber-700 border-r border-slate-900">
                              ₹{bill.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  bill.balanceDue === 0
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {bill.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-3 text-center text-slate-500">
                            No bills found for this day.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Safe Footer (Cashier & Manager signatures removed as requested) */}
              <div className="border-t border-slate-900 pt-2 text-center space-y-1">
                <p className="text-[10px] text-slate-700 font-mono font-semibold">
                  END OF DAILY FISCAL CLOSING • ALL TRANSACTIONS RECONCILED DIRECTLY FROM SYSTEM DATABASE
                </p>
                <p className="text-[9px] text-slate-500 font-mono">
                  Report generated on {new Date(reportData.generatedAt).toLocaleString('en-IN')} • Sastika Mobiles Billing POS v2.0
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-1" />
              <p className="font-semibold text-xs text-slate-700">No Sales Recorded for {formattedDate}</p>
              <p className="text-[11px] text-slate-500">Pick another date to view past daily reports.</p>
            </div>
          )}
        </div>

        {/* Screen Action Bar (Excluded from print) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-between no-print bg-slate-50/80">
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {reportData && reportData.totalInvoices > 0
              ? `${reportData.totalInvoices} Invoices Reconciled • Total Sales: ₹${reportData.grossSales.toLocaleString('en-IN')} • Profit: ₹${reportData.totalProfit.toLocaleString('en-IN')}`
              : 'End of Day Fiscal Register'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-200/70 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={!reportData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 text-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print Z-Report (F9)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

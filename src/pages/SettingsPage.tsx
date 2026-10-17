import React, { useState } from 'react';
import {
  Printer,
  Save,
  Building2,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [shopName, setShopName] = useState('SASTIKA MOBILES');
  const [gstin, setGstin] = useState('33AAAAA0000A1Z5');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('124 Bazaar Main Road, Madurai, Tamil Nadu - 625001');
  const [printerType, setPrinterType] = useState('3-inch Thermal (80mm)');
  const [footerNote, setFooterNote] = useState('Thank you for shopping with Sastika Mobiles! Goods once sold can be exchanged within 7 days with original invoice.');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header with Breadcrumbs matching all other views */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 flex flex-wrap items-center gap-1.5 mb-1 whitespace-nowrap">
            <span>RETAIL OS</span>
            <span className="text-slate-300">›</span>
            <span>SYSTEM CONFIGURATION</span>
            <span className="text-slate-300">›</span>
            <span className="text-blue-600 font-extrabold">STORE &amp; HARDWARE SETTINGS</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Store &amp; Hardware Settings
            </h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              ACTIVE PROFILE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure shop header details, GSTIN tax credentials, thermal invoice print formats, and hardware connectivity.
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Store settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Layout: Form on Left, Thermal Receipt Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Store Profile & Hardware */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Store Profile &amp; GST Details</h2>
                <p className="text-[11px] text-slate-500">
                  These details will be rendered on customer invoices and GST returns
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shop / Business Legal Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold text-slate-900 uppercase text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thermal POS Printer Model</label>
                <select
                  value={printerType}
                  onChange={(e) => setPrinterType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-xs cursor-pointer"
                >
                  <option value="3-inch Thermal (80mm)">3-inch Thermal (80mm ESC/POS USB &amp; Bluetooth)</option>
                  <option value="2-inch Thermal (58mm)">2-inch Thermal (58mm Mobile Bluetooth)</option>
                  <option value="A4 Standard Laser">A4 Standard Laser Printer (Full Page)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Full Business Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Bill Footer Terms / Note</label>
                <textarea
                  rows={2}
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px]">Print engine ready: {printerType}</span>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Thermal Receipt Preview */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Thermal Bill Preview</h3>
                <p className="text-[11px] text-slate-500">80mm Paper width format</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              AUTO-SYNCED
            </span>
          </div>

          {/* Thermal Receipt Visual Paper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-800 shadow-inner max-w-sm mx-auto space-y-2">
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <p className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">{shopName}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{address}</p>
              <p className="text-[10px] text-slate-600">Ph: {phone}</p>
              <p className="text-[10px] font-bold text-slate-900 mt-1">GSTIN: {gstin}</p>
            </div>

            <div className="flex justify-between text-[10px] text-slate-600 border-b border-dashed border-slate-300 pb-1.5 pt-0.5">
              <span>INV: #INV-2024-001</span>
              <span>{new Date().toLocaleDateString('en-IN')}</span>
            </div>

            <div className="py-1 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Vivo V29 5G (8/128)</span>
                <span>₹32,999.00</span>
              </div>
              <div className="text-[9px] text-slate-500">IMEI: 869402058392019</div>
              <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                <span>Apple 20W Power Adapter</span>
                <span>₹1,899.00</span>
              </div>
            </div>

            <div className="pt-1 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>Taxable Value:</span>
                <span>₹29,574.58</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>CGST (9%) + SGST (9%):</span>
                <span>₹5,323.42</span>
              </div>
              <div className="flex justify-between font-extrabold text-xs text-slate-950 border-t border-slate-900 pt-1">
                <span>GRAND TOTAL:</span>
                <span>₹34,898.00</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-bold text-right">
                Paid: ₹34,898.00 (UPI)
              </div>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500 leading-tight">
              {footerNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

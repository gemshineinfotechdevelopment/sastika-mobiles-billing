import React, { useState, useEffect } from 'react';
import {
  Printer,
  Save,
  Receipt,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import sastikaLogo from '../assets/sastika-logo.jpeg';

export const normalizePrinterType = (val: string | null | undefined): '3-inch Thermal (80mm)' | '2-inch Thermal (58mm)' | 'A4 Standard Laser' => {
  if (!val) return '3-inch Thermal (80mm)';
  const s = val.toLowerCase();
  if (s.includes('58') || s.includes('2-inch') || s.includes('2 inch')) return '2-inch Thermal (58mm)';
  if (s.includes('a4') || s.includes('laser')) return 'A4 Standard Laser';
  return '3-inch Thermal (80mm)';
};

export const SettingsPage: React.FC = () => {
  const [shopName, setShopName] = useState('SASTIKA MOBILES');
  const [gstin, setGstin] = useState('33AAAAA0000A1Z5');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('124 Bazaar Main Road, Madurai, Tamil Nadu - 625001');
  const [printerType, setPrinterType] = useState<string>(() => {
    return normalizePrinterType(localStorage.getItem('sastika_printer_type'));
  });
  const [footerNote, setFooterNote] = useState('Thank you for shopping with Sastika Mobiles! Goods once sold can be exchanged within 7 days with original invoice.');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.settings) {
          const s = res.settings as Record<string, any>;
          if (s.shopName) setShopName(s.shopName);
          if (s.gstin) setGstin(s.gstin);
          if (s.phone) setPhone(s.phone);
          if (s.address) setAddress(s.address);
          if (s.thermalPrinter?.paperSize) {
            const normalized = normalizePrinterType(s.thermalPrinter.paperSize);
            setPrinterType(normalized);
            localStorage.setItem('sastika_printer_type', normalized);
          }
          if (s.thermalPrinter?.printFooterNote) setFooterNote(s.thermalPrinter.printFooterNote);
        }
      })
      .catch((err) => console.warn('Could not load backend settings:', err));
  }, []);

  const handlePrinterChange = (newType: string) => {
    const normalized = normalizePrinterType(newType);
    setPrinterType(normalized);
    localStorage.setItem('sastika_printer_type', normalized);
    window.dispatchEvent(new Event('printerSettingChanged'));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('sastika_printer_type', printerType);
      await api.updateSettings({
        shopName,
        gstin,
        phone,
        address,
        thermalPrinter: {
          paperSize: printerType,
          printFooterNote: footerNote,
        },
      });
      setSaved(true);
      window.dispatchEvent(new Event('printerSettingChanged'));
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings to server');
    } finally {
      setSaving(false);
    }
  };

  const is58mm = printerType.includes('58mm') || printerType.includes('2-inch');
  const isA4 = printerType.includes('A4');

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Store &amp; Bill Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure shop profile, GST details, thermal POS printer paper size, and receipt format
          </p>
        </div>

        {saved && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings saved &amp; printer format updated!</span>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Layout: Form on Left, Dynamic Receipt Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Store Profile & Hardware */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={sastikaLogo}
                alt="Sastika Mobiles"
                className="w-12 h-12 rounded-xl object-contain border border-slate-200/90 shadow-2xs shrink-0"
              />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Store Profile &amp; GST Details</h2>
                <p className="text-[11px] text-slate-500">
                  Rendered across all customer invoices, slips, and receipts
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
              Official Logo
            </span>
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
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-slate-900 text-xs"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800 text-xs">
                    Thermal POS Printing Model / Paper Size
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Selected: {printerType}
                  </span>
                </div>

                {/* 3 Clickable Model Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handlePrinterChange('3-inch Thermal (80mm)')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      printerType === '3-inch Thermal (80mm)'
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">3-inch Thermal</span>
                      <span className={`w-3 h-3 rounded-full border-2 ${printerType === '3-inch Thermal (80mm)' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 mt-1">80mm ESC/POS</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Counter USB &amp; Bluetooth printer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrinterChange('2-inch Thermal (58mm)')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      printerType === '2-inch Thermal (58mm)'
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">2-inch Thermal</span>
                      <span className={`w-3 h-3 rounded-full border-2 ${printerType === '2-inch Thermal (58mm)' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 mt-1">58mm Mobile</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Portable Bluetooth handheld slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrinterChange('A4 Standard Laser')}
                    className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      printerType === 'A4 Standard Laser'
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">A4 Laser</span>
                      <span className={`w-3 h-3 rounded-full border-2 ${printerType === 'A4 Standard Laser' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 mt-1">Full Page Sheet</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Standard Deskjet/Laser Tax Invoice</span>
                  </button>
                </div>

                <div className="pt-1">
                  <select
                    value={printerType}
                    onChange={(e) => handlePrinterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 font-semibold text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="3-inch Thermal (80mm)">3-inch Thermal (80mm ESC/POS USB &amp; Bluetooth)</option>
                    <option value="2-inch Thermal (58mm)">2-inch Thermal (58mm Mobile Bluetooth)</option>
                    <option value="A4 Standard Laser">A4 Standard Laser Printer (Full Page)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    Selecting any option immediately changes the live preview on the right and adjusts all print output.
                  </p>
                </div>
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
              <div className="flex items-center gap-2 text-slate-600">
                <Printer className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold">Active Print Format: <strong className="text-slate-900">{printerType}</strong></span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Dynamic Live Bill Preview matching selected printerType */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                {isA4 ? <FileText className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {is58mm
                    ? '2-inch Thermal Preview (58mm)'
                    : isA4
                    ? 'A4 Laser Invoice Preview (Full Page)'
                    : '3-inch Thermal Preview (80mm)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {is58mm
                    ? 'Compact 58mm roll width'
                    : isA4
                    ? 'Standard 210x297mm full sheet'
                    : 'Standard 80mm roll width'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              LIVE PREVIEW
            </span>
          </div>

          {/* ─── CASE 1: 58mm ULTRA-COMPACT THERMAL RECEIPT ─────────────────── */}
          {is58mm && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-3 font-mono text-[10px] text-slate-900 shadow-inner max-w-[240px] mx-auto space-y-2 animate-in zoom-in-95 duration-150">
              <div className="text-center pb-1.5 border-b border-dashed border-slate-400">
                <p className="font-black text-xs uppercase tracking-tight text-slate-950">{shopName}</p>
                <p className="text-[9px] text-slate-600 leading-tight mt-0.5">{address}</p>
                <p className="text-[9px] text-slate-600">Ph: {phone}</p>
                <p className="text-[9px] font-bold text-slate-900 mt-0.5">GSTIN: {gstin}</p>
                <p className="text-[9px] font-extrabold uppercase mt-1 bg-slate-200 py-0.5">** CASH MEMO **</p>
              </div>

              <div className="text-[9px] text-slate-600 border-b border-dashed border-slate-400 pb-1">
                <div className="flex justify-between">
                  <span>INV: INV-2026-0001</span>
                  <span>{new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUST: Walk-in Cash</span>
                  <span>12:30 PM</span>
                </div>
              </div>

              <div className="space-y-1.5 py-1 border-b border-dashed border-slate-400 text-[10px]">
                <div>
                  <div className="flex justify-between font-bold text-slate-950">
                    <span>1. Vivo V29 5G</span>
                    <span>₹32,999</span>
                  </div>
                  <div className="text-[8.5px] text-slate-500">IMEI: 869402058392019</div>
                </div>
                <div>
                  <div className="flex justify-between font-bold text-slate-950">
                    <span>2. Apple 20W USB-C</span>
                    <span>₹1,899</span>
                  </div>
                  <div className="text-[8.5px] text-slate-500">1x Qty @ 18% GST</div>
                </div>
              </div>

              <div className="space-y-1 text-[10px] pt-1 border-b border-dashed border-slate-400 pb-1.5">
                <div className="flex justify-between">
                  <span>Taxable:</span>
                  <span>₹29,574.58</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹5,323.42</span>
                </div>
                <div className="flex justify-between font-black text-xs text-slate-950 pt-0.5 border-t border-slate-900">
                  <span>TOTAL:</span>
                  <span>₹34,898.00</span>
                </div>
                <div className="text-right text-emerald-800 font-bold text-[9px]">
                  PAID: ₹34,898 (UPI)
                </div>
              </div>

              <div className="text-center pt-1 text-[8.5px] text-slate-500 leading-tight">
                {footerNote}
                <p className="mt-1 font-bold text-slate-700">*** THANK YOU ***</p>
              </div>
            </div>
          )}

          {/* ─── CASE 2: 80mm STANDARD POS COUNTER THERMAL RECEIPT ─────────── */}
          {!is58mm && !isA4 && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 font-mono text-[11px] text-slate-900 shadow-inner max-w-sm mx-auto space-y-2 animate-in zoom-in-95 duration-150">
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <p className="font-black text-sm uppercase text-slate-950 tracking-tight">{shopName}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{address}</p>
                <p className="text-[10px] text-slate-600">Mobile: {phone}</p>
                <p className="text-[10px] font-bold text-slate-900 mt-1">GSTIN: {gstin}</p>
                <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white rounded font-bold text-[10px] uppercase tracking-wider mt-1.5">
                  TAX INVOICE (80MM ESC/POS)
                </span>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600 border-b border-dashed border-slate-400 pb-1.5 pt-0.5">
                <span>INV: #INV-2026-0001</span>
                <span>{new Date().toLocaleDateString('en-IN')} 12:45 PM</span>
              </div>

              <div className="py-1 border-b border-dashed border-slate-400 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-950">
                  <span>Vivo V29 5G (8/128GB)</span>
                  <span>₹32,999.00</span>
                </div>
                <div className="text-[9.5px] text-slate-500">IMEI: 869402058392019 (1 Yr Warranty)</div>
                <div className="flex justify-between font-bold text-slate-950 pt-0.5">
                  <span>Apple 20W Power Adapter</span>
                  <span>₹1,899.00</span>
                </div>
                <div className="text-[9.5px] text-slate-500">HSN: 85044030 • 1 Qty</div>
              </div>

              <div className="pt-1 space-y-1 text-xs">
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>Taxable Value:</span>
                  <span>₹29,574.58</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span>₹5,323.42</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-950 border-t-2 border-slate-900 pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹34,898.00</span>
                </div>
                <div className="text-[11px] text-emerald-800 font-bold text-right">
                  Paid: ₹34,898.00 (GPay / UPI)
                </div>
              </div>

              <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[9.5px] text-slate-600 leading-tight">
                {footerNote}
                <p className="mt-1 font-bold text-slate-900 tracking-wider">*** VISIT AGAIN ***</p>
              </div>
            </div>
          )}

          {/* ─── CASE 3: A4 STANDARD LASER PRINTER (FULL PAGE TABLE) ───────── */}
          {isA4 && (
            <div className="bg-white border-2 border-slate-900 rounded-xl p-4 text-[11px] text-slate-900 shadow-xs space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                <div>
                  <h4 className="font-black text-base uppercase text-slate-950">{shopName}</h4>
                  <p className="text-[10px] text-slate-600">{address}</p>
                  <p className="text-[10px] text-slate-600">Ph: {phone} • GSTIN: <strong className="text-slate-900">{gstin}</strong></p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] uppercase rounded">
                    A4 GST TAX INVOICE
                  </span>
                  <p className="font-mono font-bold text-xs mt-1">#INV-2026-0001</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Billed To Box */}
              <div className="border border-slate-900 p-2 text-[10px] grid grid-cols-2 bg-slate-50/50">
                <div>
                  <p className="text-slate-500 uppercase font-bold text-[9px]">Customer Billed To:</p>
                  <p className="font-bold text-slate-900">Walk-in Cash Customer</p>
                  <p className="text-slate-600">Counter Terminal 01</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 uppercase font-bold text-[9px]">Place of Supply:</p>
                  <p className="font-bold text-slate-900">Tamil Nadu (33)</p>
                </div>
              </div>

              {/* A4 Items Table with Borders */}
              <table className="w-full text-left text-[10px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-900">
                    <th className="p-1.5 border-r border-slate-900 text-center w-6">#</th>
                    <th className="p-1.5 border-r border-slate-900">Item Description</th>
                    <th className="p-1.5 border-r border-slate-900 text-center w-10">Qty</th>
                    <th className="p-1.5 border-r border-slate-900 text-right w-16">Rate (₹)</th>
                    <th className="p-1.5 text-right w-20">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 text-center border-r border-slate-900">1</td>
                    <td className="p-1.5 border-r border-slate-900 font-bold">
                      Vivo V29 5G (8/128GB)
                      <span className="block text-[8.5px] font-normal text-slate-500 font-mono">IMEI: 869402058392019</span>
                    </td>
                    <td className="p-1.5 text-center border-r border-slate-900">1</td>
                    <td className="p-1.5 text-right font-mono border-r border-slate-900">32,999.00</td>
                    <td className="p-1.5 text-right font-mono font-bold">32,999.00</td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 text-center border-r border-slate-900">2</td>
                    <td className="p-1.5 border-r border-slate-900 font-bold">Apple 20W USB-C Adapter</td>
                    <td className="p-1.5 text-center border-r border-slate-900">1</td>
                    <td className="p-1.5 text-right font-mono border-r border-slate-900">1,899.00</td>
                    <td className="p-1.5 text-right font-mono font-bold">1,899.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals Box */}
              <div className="flex justify-end">
                <div className="w-56 text-[10px] space-y-1 border border-slate-900 p-2">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-mono">₹29,574.58</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST + SGST (18%):</span>
                    <span className="font-mono">₹5,323.42</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-900">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono">₹34,898.00</span>
                  </div>
                </div>
              </div>

              {/* Signatory */}
              <div className="border-t border-slate-900 pt-2 flex justify-between items-end text-[9px] text-slate-600">
                <p className="max-w-[200px] leading-tight">{footerNote}</p>
                <div className="text-right">
                  <p>For {shopName}</p>
                  <p className="border-t border-slate-900 mt-4 pt-0.5 font-bold text-slate-900">Authorised Signatory</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

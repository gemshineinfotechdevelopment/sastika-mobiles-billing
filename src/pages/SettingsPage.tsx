import React, { useState } from 'react';
import { Printer, Save, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [shopName, setShopName] = useState('SASTIKA MOBILES');
  const [gstin, setGstin] = useState('33AAAAA0000A1Z5');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('124 Bazaar Main Road, Madurai, Tamil Nadu - 625001');
  const [printerType, setPrinterType] = useState('3-inch Thermal (80mm)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Store & Hardware Settings</h1>
          <p className="text-xs text-slate-500">
            Configure shop header details, GSTIN, thermal invoice format and printer connectivity
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-3xl space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Store Profile</h2>
          <p className="text-xs text-slate-500">
            These details appear on your printed GST counter bills
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {saved && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4" /> Store settings updated successfully!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shop / Business Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-600 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-600 font-mono font-bold text-slate-900 uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Mobile Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-600 font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thermal POS Printer Model</label>
              <select
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-600 bg-white"
              >
                <option value="3-inch Thermal (80mm)">3-inch Thermal (80mm ESC/POS USB & Bluetooth)</option>
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-blue-600 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Connected to default system print driver</span>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

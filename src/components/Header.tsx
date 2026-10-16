import React from 'react';
import { Smartphone, RefreshCw, CheckCircle2, AlertCircle, Receipt, Package, FileText } from 'lucide-react';
import type { HealthResponse } from '../types';

interface HeaderProps {
  activeTab: 'billing' | 'invoices' | 'inventory';
  setActiveTab: (tab: 'billing' | 'invoices' | 'inventory') => void;
  serverHealth: HealthResponse | null;
  serverLoading: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  serverHealth,
  serverLoading,
  onRefreshHealth,
}) => {
  const shopName = import.meta.env.VITE_SHOP_NAME || 'Sastika Mobiles';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{shopName}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Billing POS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">GSTIN: {shopGstin}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'billing'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              New Invoice
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'invoices'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Invoices History
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inventory'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory
            </button>
          </nav>

          {/* Server Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                serverHealth
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
              title={serverHealth ? 'Server connected on port 5000' : 'Cannot reach backend server'}
            >
              <span className="relative flex h-2 w-2">
                {serverHealth && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    serverHealth ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                ></span>
              </span>
              <span>{serverHealth ? 'Server Connected' : 'Server Offline'}</span>
              {serverHealth ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>

            <button
              onClick={onRefreshHealth}
              disabled={serverLoading}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-4 h-4 ${serverLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

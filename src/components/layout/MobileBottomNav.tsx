import React from 'react';
import {
  LayoutGrid,
  Receipt,
  Smartphone,
  FileText,
  Menu,
} from 'lucide-react';
import type { NavTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
}) => {
  const isMoreActive = ['customers', 'purchases', 'reports', 'settings'].includes(activeTab);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 no-print"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-transform ${
              activeTab === 'dashboard' ? 'bg-blue-50 scale-105' : ''
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. Products / Inventory */}
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-transform ${
              activeTab === 'products' ? 'bg-blue-50 scale-105' : ''
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Stock</span>
        </button>

        {/* 3. Center Highlighted POS Bill */}
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className="flex flex-col items-center justify-center -mt-4 cursor-pointer group"
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 group-active:scale-95 ${
              activeTab === 'billing'
                ? 'bg-blue-600 text-white shadow-blue-500/30 ring-4 ring-blue-100'
                : 'bg-slate-900 text-white shadow-slate-900/20'
            }`}
          >
            <Receipt className="w-6 h-6" />
          </div>
          <span
            className={`text-[10px] mt-1 font-bold ${
              activeTab === 'billing' ? 'text-blue-600' : 'text-slate-700'
            }`}
          >
            New Bill
          </span>
        </button>

        {/* 4. Sales / Invoices */}
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-transform ${
              activeTab === 'sales' ? 'bg-blue-50 scale-105' : ''
            }`}
          >
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Sales</span>
        </button>

        {/* 5. More Menu Drawer */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            isMoreActive
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`p-1 rounded-lg transition-transform relative ${
              isMoreActive ? 'bg-blue-50 scale-105' : ''
            }`}
          >
            <Menu className="w-5 h-5" />
            {isMoreActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight capitalize">
            {isMoreActive ? activeTab : 'More'}
          </span>
        </button>
      </div>
    </nav>
  );
};

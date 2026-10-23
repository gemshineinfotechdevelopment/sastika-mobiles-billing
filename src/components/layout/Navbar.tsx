import React from 'react';
import { Menu } from 'lucide-react';
import type { HealthResponse } from '../../types';
import sastikaLogo from '../../assets/sastika-logo.jpeg';

interface NavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  serverHealth?: HealthResponse | null;
  serverLoading?: boolean;
  onRefreshHealth?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  activeTab?: string;
  onQuickNewBill?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  serverHealth,
  activeTab,
  onQuickNewBill,
}) => {
  const shopName = import.meta.env.VITE_SHOP_NAME || 'SASTIKA MOBILES';

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 h-14 sm:h-16 flex items-center px-3 sm:px-6 lg:px-8 transition-all">
      <div className="w-full flex items-center justify-between gap-3">
        {/* Left: Open/Close Sidebar Toggle Button & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isSidebarOpen
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
                : 'bg-blue-50 text-blue-600 border-blue-200/80 hover:bg-blue-100 shadow-2xs'
            }`}
            title={isSidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <img
              src={sastikaLogo}
              alt="Sastika Mobiles"
              className="w-8 h-8 rounded-lg object-contain border border-slate-200 shadow-2xs shrink-0"
            />
            <span className="font-black text-xs sm:text-sm tracking-wider text-slate-900 uppercase truncate max-w-[130px] sm:max-w-none">
              {shopName}
            </span>
            {serverHealth && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live DB
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Mobile Actions */}
        <div className="flex items-center gap-2">
          {activeTab !== 'billing' && onQuickNewBill && (
            <button
              type="button"
              onClick={onQuickNewBill}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>+ New Bill</span>
            </button>
          )}

          {/* Status pill on mobile */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
            <span
              className={`w-2 h-2 rounded-full ${
                serverHealth ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              title={serverHealth ? 'Connected to database' : 'Offline local mode'}
            ></span>
            <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
              {serverHealth ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


import React from 'react';
import { Menu } from 'lucide-react';
import type { HealthResponse } from '../../types';

interface NavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  serverHealth?: HealthResponse | null;
  serverLoading?: boolean;
  onRefreshHealth?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const shopName = import.meta.env.VITE_SHOP_NAME || 'SASTIKA MOBILES';

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Open/Close Sidebar Toggle Button */}
        <div className="flex items-center gap-3">
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
            <Menu className="w-5 h-5" />
          </button>

          {!isSidebarOpen && (
            <span className="font-extrabold text-sm tracking-wider text-slate-900 uppercase">
              {shopName}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};


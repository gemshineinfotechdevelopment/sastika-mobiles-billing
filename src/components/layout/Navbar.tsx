import React, { useState } from 'react';
import { Search, Menu, RefreshCw } from 'lucide-react';
import type { HealthResponse } from '../../types';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  serverHealth: HealthResponse | null;
  serverLoading: boolean;
  onRefreshHealth: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  serverHealth,
  serverLoading,
  onRefreshHealth,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Global Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search invoice, customer phone, product or IMEI..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Right: Server health indicator & User profile */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Server Connection Badge */}
          <div className="hidden sm:flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                serverHealth
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-rose-50 text-rose-700 border-rose-200/80'
              }`}
              title={
                serverHealth
                  ? 'Backend API Connected on port 5000'
                  : 'Backend API Offline. Run `npm run dev:all`'
              }
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
              <span className="hidden md:inline">
                {serverHealth ? 'Server Live' : 'Server Offline'}
              </span>
              <button
                onClick={onRefreshHealth}
                disabled={serverLoading}
                className="hover:opacity-75 transition-opacity ml-0.5 cursor-pointer"
                title="Refresh API health"
              >
                <RefreshCw
                  className={`w-3 h-3 text-slate-500 ${
                    serverLoading ? 'animate-spin' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* User Profile info */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full ring-2 ring-slate-200 overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
                {imageError ? (
                  <span>RK</span>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Rajesh Kumar"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">Rajesh Kumar</p>
                <p className="text-[11px] font-medium text-slate-400 leading-tight">Store Admin</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 text-xs text-slate-700"
                onClick={() => setProfileOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                  <p className="font-bold text-slate-800">Rajesh Kumar</p>
                  <p className="text-slate-400">Store Admin</p>
                </div>
                <div className="px-4 py-1.5 font-medium text-slate-500">
                  Shop: Sastika Mobiles
                </div>
                <div className="px-4 py-1.5 text-slate-500 font-mono text-[11px]">
                  Branch: Main Store
                </div>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => alert('Logged in as Store Admin')}
                  className="w-full text-left px-4 py-1.5 hover:bg-slate-50 font-medium text-slate-700"
                >
                  Account Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

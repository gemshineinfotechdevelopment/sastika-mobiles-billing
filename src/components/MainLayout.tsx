import React, { useState } from 'react';
import { Sidebar, type NavTab } from './layout/Sidebar';
import { Navbar } from './layout/Navbar';
import { Footer } from './layout/Footer';
import type { HealthResponse } from '../types';

interface MainLayoutProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  serverHealth: HealthResponse | null;
  serverLoading: boolean;
  onRefreshHealth: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  serverHealth,
  serverLoading,
  onRefreshHealth,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* 1. Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* 2. Main Content Wrapper Offset by Desktop Sidebar (lg:pl-64) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Navbar Component */}
        <Navbar
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          serverHealth={serverHealth}
          serverLoading={serverLoading}
          onRefreshHealth={onRefreshHealth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={onSearchSubmit}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-12">
          {children}
        </main>

        {/* Footer Component */}
        <Footer />
      </div>
    </div>
  );
};

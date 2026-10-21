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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sastika_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sastika_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* 1. Sidebar Component (Opens/closes across all pages) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* 2. Main Content Wrapper: pl-64 when open on desktop, pl-0 when closed */}
      <div
        className={`${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        } flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out`}
      >
        {/* Navbar Component */}
        <Navbar
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          serverHealth={serverHealth}
          serverLoading={serverLoading}
          onRefreshHealth={onRefreshHealth}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchSubmit={onSearchSubmit}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 pb-12">
          {children}
        </main>

        {/* Footer Component */}
        <Footer />
      </div>
    </div>
  );
};

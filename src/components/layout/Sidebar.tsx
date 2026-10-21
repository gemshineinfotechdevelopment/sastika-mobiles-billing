import React from 'react';
import {
  LayoutGrid,
  Receipt,
  Smartphone,
  FileText,
  Users,
  Truck,
  BarChart3,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'billing'
  | 'products'
  | 'sales'
  | 'customers'
  | 'purchases'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface MenuItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const shopName = import.meta.env.VITE_SHOP_NAME || 'SASTIKA MOBILES';
  const shopGstin = import.meta.env.VITE_SHOP_GSTIN || '33AAAAA0000A1Z5';

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'billing', label: 'Billing / POS', icon: Receipt },
    { id: 'products', label: 'Products', icon: Smartphone },
    { id: 'sales', label: 'Sales & Bills', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Icon */}
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <div className="grid grid-cols-2 gap-0.5">
                <span className="w-2 h-2 bg-white rounded-xs"></span>
                <span className="w-2 h-2 bg-white rounded-xs"></span>
                <span className="w-2 h-2 bg-white rounded-xs"></span>
                <span className="w-2 h-2 bg-white/70 rounded-xs"></span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-slate-900 uppercase">
                {shopName}
              </span>
            </div>
          </div>

          {/* Close button for all screen sizes */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close navigation menu"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom GSTIN Verification Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                GSTIN
              </p>
              <p className="text-xs font-bold font-mono text-slate-800 tracking-tight">
                {shopGstin}
              </p>
            </div>
            <div className="text-slate-400">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

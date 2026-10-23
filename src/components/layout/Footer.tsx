import React from 'react';
import { Printer, ShieldCheck, Zap } from 'lucide-react';
import sastikaLogo from '../../assets/sastika-logo.jpeg';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 no-print mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <img
            src={sastikaLogo}
            alt="Sastika Mobiles"
            className="w-5 h-5 rounded-md object-contain border border-slate-200"
          />
          <span className="font-bold text-slate-800 tracking-wide uppercase text-[11px]">
            SASTIKA MOBILES
          </span>
          <span className="text-slate-300">•</span>
          <span>High-Speed GST Billing & POS Software</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="hidden md:inline-flex items-center gap-1 text-slate-600 font-medium">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Shortcut: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-bold">F2</kbd> for New Bill
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <Printer className="w-3.5 h-3.5" />
            Printer Ready (3-inch Thermal)
          </span>
          <span className="flex items-center gap-1 text-slate-600 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            v2.4 Pro
          </span>
        </div>
      </div>
    </footer>
  );
};

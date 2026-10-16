import React from 'react';
import { RecentBills } from '../components/RecentBills';
import type { Bill } from '../types';

interface SalesPageProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  bills,
  onSelectBill,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales & Invoice History</h1>
          <p className="text-xs text-slate-500">
            View all counter sales, reprint past invoices, and track payment modes
          </p>
        </div>
      </div>

      <RecentBills
        bills={bills}
        onSelectBill={onSelectBill}
      />
    </div>
  );
};

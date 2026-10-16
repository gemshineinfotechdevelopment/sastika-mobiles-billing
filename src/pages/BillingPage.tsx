import React from 'react';
import { InvoiceGenerator } from '../components/InvoiceGenerator';
import type { Bill, Product } from '../types';

interface BillingPageProps {
  products: Product[];
  onInvoiceCreated: (bill: Bill) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  products,
  onInvoiceCreated,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing & POS Terminal</h1>
          <p className="text-xs text-slate-500">
            Generate GST-compliant tax invoices, scan IMEIs, and print thermal counter slips
          </p>
        </div>
      </div>

      <InvoiceGenerator
        products={products}
        onInvoiceCreated={onInvoiceCreated}
      />
    </div>
  );
};

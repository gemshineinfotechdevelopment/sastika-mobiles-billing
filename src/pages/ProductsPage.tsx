import React from 'react';
import { InventoryView } from '../components/InventoryView';
import type { Product } from '../types';

interface ProductsPageProps {
  products: Product[];
  onProductAdded: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onProductAdded,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Stock Catalog</h1>
          <p className="text-xs text-slate-500">
            Smartphones, accessories, audio headsets, IMEI tracking & wholesale prices
          </p>
        </div>
      </div>

      <InventoryView
        products={products}
        onProductAdded={onProductAdded}
      />
    </div>
  );
};

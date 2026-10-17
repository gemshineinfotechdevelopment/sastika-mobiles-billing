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
    <div className="w-full">
      <InventoryView
        products={products}
        onProductAdded={onProductAdded}
      />
    </div>
  );
};

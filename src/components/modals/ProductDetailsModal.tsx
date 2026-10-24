import React from 'react';
import { X, Smartphone, Edit2, Printer } from 'lucide-react';
import type { Product } from '../../types';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onPrintLabel: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onPrintLabel,
}) => {
  if (!isOpen || !product) return null;

  const isLowStock = product.stock <= (product.minThreshold || 4);
  const cost = product.costPrice || 0;
  const selling = product.price;
  const margin = product.margin || (cost > 0 ? (((selling - cost) / cost) * 100).toFixed(1) : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Product Details</h3>
              <p className="text-slate-500 text-xs font-medium">{product.category || 'Handsets & Accessories'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-base text-slate-900">{product.name}</h4>
                {product.variant && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                    {product.variant}
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Brand: <strong className="text-slate-700">{product.brand}</strong> • Model:{' '}
                <strong className="text-slate-700">{product.model || 'Standard'}</strong>
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isLowStock
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                {product.stock} Units {isLowStock ? '(Low Stock)' : 'Available'}
              </span>
            </div>
          </div>

          {/* Pricing & Margin Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Purchase Cost
              </span>
              <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                ₹{cost.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-500">Buy rate</span>
            </div>
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Selling Price
              </span>
              <p className="text-base font-extrabold text-blue-900 font-mono mt-0.5">
                ₹{selling.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-blue-600 font-medium">MRP</span>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Profit Margin
              </span>
              <p className="text-base font-extrabold text-emerald-700 font-mono mt-0.5">
                +{margin}%
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Net markup</span>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={() => onPrintLabel(product)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Barcode Label
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-4 h-4" /> Edit Product
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

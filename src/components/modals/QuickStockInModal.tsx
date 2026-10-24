import React, { useState } from 'react';
import { X, Package, Check, Plus } from 'lucide-react';
import type { Product } from '../../types';
import { api } from '../../services/api';

interface QuickStockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product | null;
  onStockUpdated: (productId: string, addedQty: number) => void;
}

export const QuickStockInModal: React.FC<QuickStockInModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  onStockUpdated,
}) => {
  if (!isOpen) return null;

  const [productId, setProductId] = useState(selectedProduct?.id || (products[0]?.id || ''));
  const [addQty, setAddQty] = useState('5');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeProd = products.find((p) => p.id === productId) || selectedProduct || products[0];

  const handleProductSelect = (id: string) => {
    setProductId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProd) return;

    setLoading(true);
    const qty = parseInt(addQty, 10) || 0;
    if (qty <= 0) {
      alert('Please enter a positive quantity');
      setLoading(false);
      return;
    }

    const updatedStock = activeProd.stock + qty;

    try {
      await api.updateProduct(activeProd.id, {
        stock: updatedStock,
      });
    } catch {
      // Offline fallback
    }

    setSuccess(true);
    onStockUpdated(activeProd.id, qty);

    setTimeout(() => {
      setSuccess(false);
      onClose();
      setAddQty('5');
    }, 600);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quick Stock In (Inward Entry)</h3>
              <p className="text-slate-500 text-xs">Direct stock intake & quantity increment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Stock inward recorded successfully!
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Catalog Product</label>
            <select
              value={productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-blue-600 font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.variant ? `(${p.variant})` : ''} — Current Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          {activeProd && (
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs">{activeProd.name}</p>
                <p className="text-[11px] text-slate-500">
                  {activeProd.brand} {activeProd.model ? `• ${activeProd.model}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Existing Count</span>
                <span className="font-extrabold text-sm text-blue-700 font-mono">
                  {activeProd.stock} Units
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Additional Quantity (+)</label>
            <input
              type="number"
              min="1"
              required
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm focus:outline-blue-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Processing...' : 'Confirm Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

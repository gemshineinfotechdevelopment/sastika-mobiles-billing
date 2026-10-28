import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Package, Check, Plus, Search, Sparkles } from 'lucide-react';
import type { Product } from '../../types';
import { api } from '../../services/api';

interface QuickStockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  selectedProduct?: Product | null;
  onStockUpdated: (productId: string, addedQty: number, updatedProduct?: Product) => void;
}

export const QuickStockInModal: React.FC<QuickStockInModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProduct,
  onStockUpdated,
}) => {
  const [productQuery, setProductQuery] = useState('');
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState('5');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or selectedProduct changes
  useEffect(() => {
    if (isOpen) {
      if (selectedProduct) {
        setSelectedProd(selectedProduct);
        setProductQuery(selectedProduct.name);
      } else {
        setSelectedProd(null);
        setProductQuery('');
      }
      setAddQty('5');
      setSuccess(false);
      setShowSuggestions(false);
    }
  }, [isOpen, selectedProduct]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered products for search autocomplete
  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return products.slice(0, 8);
    const q = productQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.ean?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, productQuery]);

  const qtyNumber = parseInt(addQty, 10) || 0;

  const handleSelectProduct = (prod: Product) => {
    setSelectedProd(prod);
    setProductQuery(prod.name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyNumber <= 0) {
      alert('Please enter a positive quantity');
      return;
    }

    const trimmedQuery = productQuery.trim();
    if (!trimmedQuery && !selectedProd) {
      alert('Please enter or select a product');
      return;
    }

    setLoading(true);

    try {
      // Determine target product (either selected or matching query)
      let targetProd = selectedProd;
      if (!targetProd) {
        targetProd =
          products.find(
            (p) => p.name.trim().toLowerCase() === trimmedQuery.toLowerCase()
          ) || null;
      }

      if (targetProd) {
        const updatedStock = (targetProd.stock || 0) + qtyNumber;
        await api.updateProduct(targetProd.id, {
          stock: updatedStock,
        });
        const updated = { ...targetProd, stock: updatedStock };
        setSuccess(true);
        onStockUpdated(targetProd.id, qtyNumber, updated);
      } else {
        // Create new product directly if typed manually and not in catalog
        const res = await api.addProduct({
          name: trimmedQuery,
          stock: qtyNumber,
          price: 0,
          costPrice: 0,
          category: 'General',
          brand: 'General',
          model: trimmedQuery,
          gstRate: 18,
          hsnCode: '8517',
        });
        const createdProd = res.product;
        setSuccess(true);
        if (createdProd) {
          onStockUpdated(createdProd.id, qtyNumber, createdProd);
        }
      }

      setTimeout(() => {
        setSuccess(false);
        onClose();
        setAddQty('5');
      }, 600);
    } catch (err) {
      console.error('Failed to update stock:', err);
      alert('Failed to update stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
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
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Stock inward recorded successfully!</span>
            </div>
          )}

          {/* Product Name Manual Input with Autocomplete Suggestions */}
          <div className="relative" ref={wrapperRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                Product Name
                <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                  (Type to search or enter name)
                </span>
              </label>
              {selectedProd && (
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  Catalog Matched
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                required
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setShowSuggestions(true);
                  const matched = products.find(
                    (p) => p.name.trim().toLowerCase() === e.target.value.trim().toLowerCase()
                  );
                  setSelectedProd(matched || null);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type product name, brand, or model..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl font-medium text-xs text-slate-800 focus:outline-none transition-all shadow-2xs"
              />
              {productQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setProductQuery('');
                    setSelectedProd(null);
                    setShowSuggestions(true);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions list when typing */}
            {showSuggestions && filteredProducts.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isSelected = selectedProd?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProduct(p)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-blue-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-800 truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.brand} {p.model ? `• ${p.model}` : ''} {p.variant ? `(${p.variant})` : ''}
                          {p.category ? ` • ${p.category}` : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          Stock: {p.stock ?? 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Product Details or New Product Badge */}
          {selectedProd ? (
            <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                  {selectedProd.category || 'General'}
                </span>
                <p className="font-bold text-slate-900 text-xs mt-1 truncate">{selectedProd.name}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {selectedProd.brand} {selectedProd.model ? `• ${selectedProd.model}` : ''}
                  {selectedProd.variant ? ` (${selectedProd.variant})` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-semibold text-slate-500 block">Current Stock</span>
                <span className="font-extrabold text-sm text-blue-700 font-mono block">
                  {selectedProd.stock ?? 0} Units
                </span>
                {qtyNumber > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                    ➔ New: {(selectedProd.stock ?? 0) + qtyNumber}
                  </span>
                )}
              </div>
            </div>
          ) : productQuery.trim() ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>New item "{productQuery.trim()}" will be added</span>
              </div>
              <span className="font-bold text-amber-900 font-mono">
                Initial: {qtyNumber || 0} Units
              </span>
            </div>
          ) : null}

          {/* Additional Quantity Input & Quick Increment Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-slate-700">Additional Quantity (+)</label>
              <div className="flex items-center gap-1">
                {[1, 5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAddQty(preset.toString())}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 rounded transition-colors cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              required
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder="Enter quantity to add"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !productQuery.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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

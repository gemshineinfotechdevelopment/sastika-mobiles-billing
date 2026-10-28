import React, { useState, useEffect } from 'react';
import { X, Check, Edit3, Trash2, Plus } from 'lucide-react';
import type { Product } from '../../types';
import { api } from '../../services/api';
import { AddCategoryModal } from './AddCategoryModal';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (updatedProduct: Product) => void;
  onProductDeleted?: (id: string) => void;
  categories?: string[];
  onCategoryAdded?: (categoryName: string) => void;
  onCategoryDeleted?: (categoryName: string) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onProductUpdated,
  onProductDeleted,
  categories = [],
  onCategoryAdded,
  onCategoryDeleted,
}) => {
  if (!isOpen || !product) return null;

  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    brand: product.brand,
    model: product.model,
    variant: product.variant || '',
    price: product.price.toString(),
    costPrice: (product.costPrice || 0).toString(),
    stock: product.stock.toString(),
    minThreshold: (product.minThreshold || 4).toString(),
  });

  const [categoryOptions, setCategoryOptions] = useState<string[]>(() => {
    return Array.from(new Set([product.category, ...categories])).filter(Boolean);
  });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  useEffect(() => {
    setCategoryOptions((prev) => Array.from(new Set([...prev, product.category, ...categories])).filter(Boolean));
  }, [categories, product.category]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cost = Number(formData.costPrice) || 0;
  const selling = Number(formData.price) || 0;
  const marginPercent = cost > 0 && selling > 0 ? (((selling - cost) / cost) * 100).toFixed(1) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updated: Product = {
      ...product,
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      variant: formData.variant || undefined,
      price: Number(formData.price),
      costPrice: Number(formData.costPrice) || 0,
      margin: marginPercent ? Number(marginPercent) : undefined,
      stock: Number(formData.stock) || 0,
      minThreshold: Number(formData.minThreshold) || 4,
    };

    try {
      await api.updateProduct(product.id, updated);
    } catch {
      // Backend offline fallback
    }

    setSuccess(true);
    onProductUpdated(updated);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 600);
    setLoading(false);
  };

  const handleCategoryChange = (cat: string) => {
    if (cat === '__NEW_CATEGORY__') {
      setShowAddCategoryModal(true);
      return;
    }
    setFormData((prev) => ({ ...prev, category: cat }));
  };

  const handleCategoryAdded = (newCat: string) => {
    setCategoryOptions((prev) => (prev.includes(newCat) ? prev : [...prev, newCat]));
    setFormData((prev) => ({ ...prev, category: newCat }));
    if (onCategoryAdded) onCategoryAdded(newCat);
  };

  const handleCategoryDeleted = (deletedCat: string) => {
    setCategoryOptions((prev) => prev.filter((c) => c.toLowerCase() !== deletedCat.toLowerCase()));
    setFormData((prev) => {
      if (prev.category.toLowerCase() === deletedCat.toLowerCase()) {
        const remaining = categoryOptions.filter((c) => c.toLowerCase() !== deletedCat.toLowerCase());
        return { ...prev, category: remaining[0] || 'Smartphones' };
      }
      return prev;
    });
    if (onCategoryDeleted) onCategoryDeleted(deletedCat);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${product.name} from inventory?`)) return;
    try {
      await api.deleteProduct(product.id);
    } catch {
      // Offline fallback
    }
    if (onProductDeleted) onProductDeleted(product.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Edit Product & Pricing</h3>
              <p className="text-slate-500 text-xs">Update product details, pricing, and stock counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> Changes saved successfully!
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Category</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Create or delete categories"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Manage / New Category</span>
                </button>
              </div>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600 font-medium"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__NEW_CATEGORY__" className="font-bold text-indigo-600 bg-indigo-50">
                  ⚙️ Manage / Add / Delete Categories...
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Model Code</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Variant / Color</label>
              <input
                type="text"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost Price (₹ Buy)</label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono focus:outline-blue-600"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Selling Price (₹) *</label>
                  {marginPercent && (
                    <span className="font-bold text-emerald-600">+{marginPercent}%</span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Available Units</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono font-bold focus:outline-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Min Threshold</label>
                <input
                  type="number"
                  value={formData.minThreshold}
                  onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg font-mono focus:outline-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete Product
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Update Details'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Sub-modal: Manage / Add / Delete Categories */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={handleCategoryAdded}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </div>
  );
};

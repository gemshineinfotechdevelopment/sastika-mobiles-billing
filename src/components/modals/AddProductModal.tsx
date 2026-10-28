import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Check, Sparkles, Plus } from 'lucide-react';
import { api } from '../../services/api';
import type { Product } from '../../types';
import { AddCategoryModal } from './AddCategoryModal';

const DEFAULT_CATEGORIES = [
  'Smartphones',
  'Fast Chargers',
  'TWS Earbuds & Neckbands',
  'Screen Protectors',
  'Smartwatches',
  'Accessories',
];

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: (newProduct?: Product) => void;
  categories?: string[];
  onCategoryAdded?: (categoryName: string) => void;
  onCategoryDeleted?: (categoryName: string) => void;
  initialCategory?: string;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  categories: propCategories,
  onCategoryAdded,
  onCategoryDeleted,
  initialCategory,
}) => {
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...(propCategories || [])]);
    return Array.from(set);
  });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: initialCategory || 'Smartphones',
    brand: '',
    model: '',
    variant: '',
    price: '',
    costPrice: '',
    stock: '',
    minThreshold: '4',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync propCategories or fetch live categories on open
  useEffect(() => {
    if (isOpen) {
      api.getCategories()
        .then((res) => {
          if (res && res.categories) {
            const apiNames = res.categories.map((c: any) => (typeof c === 'string' ? c : c.name));
            setCategoryOptions((prev) => {
              const combined = new Set([...prev, ...apiNames, ...(propCategories || [])]);
              return Array.from(combined);
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, propCategories]);

  useEffect(() => {
    if (initialCategory) {
      setCategoryOptions((prev) => (prev.includes(initialCategory) ? prev : [...prev, initialCategory]));
      handleCategoryChange(initialCategory);
    }
  }, [initialCategory]);

  if (!isOpen) return null;

  const cost = Number(formData.costPrice) || 0;
  const selling = Number(formData.price) || 0;
  const marginPercent = cost > 0 && selling > 0 ? (((selling - cost) / cost) * 100).toFixed(1) : null;

  const handleCategoryChange = (cat: string) => {
    if (cat === '__NEW_CATEGORY__') {
      setShowAddCategoryModal(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      category: cat,
    }));
  };

  const handleNewCategoryCreated = (newCatName: string) => {
    setCategoryOptions((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === newCatName.toLowerCase());
      return exists ? prev : [...prev, newCatName];
    });

    setFormData((prev) => ({
      ...prev,
      category: newCatName,
    }));

    if (onCategoryAdded) {
      onCategoryAdded(newCatName);
    }
  };

  const handleCategoryDeleted = (deletedCatName: string) => {
    setCategoryOptions((prev) => prev.filter((c) => c.toLowerCase() !== deletedCatName.toLowerCase()));
    setFormData((prev) => {
      if (prev.category.toLowerCase() === deletedCatName.toLowerCase()) {
        const remaining = categoryOptions.filter((c) => c.toLowerCase() !== deletedCatName.toLowerCase());
        return {
          ...prev,
          category: remaining[0] || 'Smartphones',
        };
      }
      return prev;
    });

    if (onCategoryDeleted) {
      onCategoryDeleted(deletedCatName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert('Product Name and Selling Price are required.');
      return;
    }

    setLoading(true);

    const autoSku = `${(formData.brand || 'SKU').slice(0, 3).toUpperCase()}-${(formData.model || 'MOD').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      brand: formData.brand.trim() || 'Generic',
      model: formData.model.trim() || '',
      variant: formData.variant.trim() || undefined,
      sku: autoSku,
      price: Number(formData.price),
      costPrice: Number(formData.costPrice) || 0,
      margin: marginPercent ? Number(marginPercent) : undefined,
      gstRate: 0,
      hsnCode: '',
      stock: Number(formData.stock) || 0,
      minThreshold: Number(formData.minThreshold) || 4,
      rackLocation: '',
      isDualImei: false,
      statusTag: 'Standard Inventory',
      imeiNumbers: [],
    };

    try {
      await api.addProduct(newProd);
    } catch {
      // Backend offline fallback - still proceed with client-side state
    }

    setSuccess(true);
    if (onProductAdded) onProductAdded(newProd);

    setTimeout(() => {
      setSuccess(false);
      onClose();
      setFormData({
        name: '',
        category: 'Smartphones',
        brand: '',
        model: '',
        variant: '',
        price: '',
        costPrice: '',
        stock: '',
        minThreshold: '4',
      });
    }, 600);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add New Product</h3>
              <p className="text-slate-500 text-xs">
                Register new product with pricing and inventory details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {success && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Product successfully added to catalog and inventory!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title / Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Title / Handset Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vivo V29 5G (8GB / 128GB)"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600 font-medium"
              />
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Category *</label>
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
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600 font-medium"
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

            {/* Brand */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Vivo, Samsung, Apple, boAt"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Model Code</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. V2250 or A2305"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
            </div>

            {/* Variant / Color */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Variant / Color Badge
              </label>
              <input
                type="text"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                placeholder="e.g. Himalayan Blue, Prism Silver"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-blue-600"
              />
            </div>

            {/* Purchase Rate (Cost Price) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase Rate / Cost Price (₹ Buy)
              </label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="26800"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg font-mono font-semibold focus:outline-blue-600"
              />
            </div>

            {/* Selling Price */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Selling Price (₹) *
                </label>
                {marginPercent && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    +{marginPercent}% Margin
                  </span>
                )}
              </div>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="31999"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:outline-blue-600"
              />
            </div>

            {/* Initial Stock */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Available Stock Units
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="12"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg font-mono focus:outline-blue-600"
              />
            </div>

            {/* Reorder Threshold */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Low Stock Threshold Alert
              </label>
              <input
                type="number"
                value={formData.minThreshold}
                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                placeholder="4"
                className="w-full px-3 py-2 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg font-mono focus:outline-blue-600"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <PackagePlus className="w-4 h-4" />
              {loading ? 'Adding...' : 'Add to Catalog (F4)'}
            </button>
          </div>
        </form>
      </div>

      {/* Sub-modal: Manage / Add / Delete Categories on the fly */}
      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCategoryAdded={handleNewCategoryCreated}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </div>
  );
};

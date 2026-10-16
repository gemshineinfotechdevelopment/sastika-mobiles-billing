import React, { useState } from 'react';
import { X, PackagePlus, Check } from 'lucide-react';
import { api } from '../../services/api';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Smartphones',
    brand: '',
    model: '',
    price: '',
    costPrice: '',
    gstRate: 18,
    hsnCode: '85171300',
    stock: '',
    imeiNumbers: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      alert('Product Name and Selling Price are required.');
      return;
    }

    setLoading(true);
    try {
      const imeiList = formData.imeiNumbers
        ? formData.imeiNumbers.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await api.addProduct({
        name: formData.name,
        category: formData.category,
        brand: formData.brand,
        model: formData.model,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice) || 0,
        gstRate: Number(formData.gstRate),
        hsnCode: formData.hsnCode,
        stock: Number(formData.stock) || 0,
        imeiNumbers: imeiList,
      });

      setSuccess(true);
      if (onProductAdded) onProductAdded();

      setTimeout(() => {
        setSuccess(false);
        onClose();
        setFormData({
          name: '',
          category: 'Smartphones',
          brand: '',
          model: '',
          price: '',
          costPrice: '',
          gstRate: 18,
          hsnCode: '85171300',
          stock: '',
          imeiNumbers: '',
        });
      }, 700);
    } catch (err) {
      console.error(err);
      alert('Failed to save product. Backend might be offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Add New Product / SKU</h3>
              <p className="text-slate-500 text-xs">Add smartphone or accessory to inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {success && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" /> Product added successfully to inventory!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. OnePlus Nord CE4 5G"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const defaultHsn =
                    cat === 'Smartphones'
                      ? '85171300'
                      : cat === 'Accessories'
                      ? '85044030'
                      : cat === 'Audio'
                      ? '85183000'
                      : '85177090';
                  setFormData({ ...formData, category: cat, hsnCode: defaultHsn });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white bg-white"
              >
                <option value="Smartphones">Smartphones</option>
                <option value="Accessories">Accessories</option>
                <option value="Audio">Audio / TWS</option>
                <option value="Wearables">Smartwatches / Bands</option>
                <option value="Spares">Spares & Screen Protectors</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. OnePlus, Apple, Samsung"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model / Variant Details
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. 8GB RAM, 256GB Storage, Celadon Marble"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹ incl. GST) *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="24999"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price (₹ Buy)
              </label>
              <input
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="22000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white bg-white"
              >
                <option value={18}>18% (Handsets & Electronics)</option>
                <option value={12}>12% (Telecom Parts)</option>
                <option value={28}>28% (Luxury Peripherals)</option>
                <option value={0}>0% (Exempt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Stock Qty
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="10"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                IMEI / Serial Numbers
              </label>
              <input
                type="text"
                value={formData.imeiNumbers}
                onChange={(e) => setFormData({ ...formData, imeiNumbers: e.target.value })}
                placeholder="Comma separated IMEIs"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-600 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

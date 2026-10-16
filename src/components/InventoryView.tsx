import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import type { Product } from '../types';
import { api } from '../services/api';

interface InventoryViewProps {
  products: Product[];
  onProductAdded: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, onProductAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
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
  const [saving, setSaving] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const imeiList = newProduct.imeiNumbers
        ? newProduct.imeiNumbers.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await api.addProduct({
        name: newProduct.name,
        category: newProduct.category,
        brand: newProduct.brand,
        model: newProduct.model,
        price: Number(newProduct.price),
        costPrice: Number(newProduct.costPrice) || 0,
        gstRate: Number(newProduct.gstRate),
        hsnCode: newProduct.hsnCode,
        stock: Number(newProduct.stock) || 0,
        imeiNumbers: imeiList,
      });

      setShowAddModal(false);
      setNewProduct({
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
      onProductAdded();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Mobile Stock & Inventory</h2>
          <p className="text-xs text-slate-500">Manage smartphones, accessories, and stock counts</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search handset, brand, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600 focus:bg-white"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">Item Details</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">HSN / GST</th>
              <th className="py-3 px-3 text-right">Selling Price</th>
              <th className="py-3 px-3 text-center">In Stock</th>
              <th className="py-3 px-3">IMEI Tracked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((prod) => (
              <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{prod.name}</div>
                  <div className="text-slate-400 text-[11px]">{prod.brand} • {prod.model}</div>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                    {prod.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-600">
                  <span className="font-mono">{prod.hsnCode}</span> ({prod.gstRate}%)
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{prod.price.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      prod.stock <= 5
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {prod.stock <= 5 && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    {prod.stock} units
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                  {prod.imeiNumbers && prod.imeiNumbers.length > 0 ? (
                    <span className="text-indigo-600 font-medium">
                      {prod.imeiNumbers.length} IMEI registered
                    </span>
                  ) : (
                    <span className="text-slate-400">Non-serialized</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Add Stock Product</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OnePlus Nord CE4 5G"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600"
                  >
                    <option value="Smartphones">Smartphones</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Audio">Audio</option>
                    <option value="Wearables">Wearables</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. OnePlus"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="24999"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">IMEI Numbers (Comma separated)</label>
                <input
                  type="text"
                  placeholder="863456789012345, 863456789012346"
                  value={newProduct.imeiNumbers}
                  onChange={(e) => setNewProduct({ ...newProduct, imeiNumbers: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

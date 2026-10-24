import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Check, Sparkles, Tag } from 'lucide-react';
import { api } from '../../services/api';
import type { CategoryItem } from '../../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (categoryName: string, category: CategoryItem) => void;
}

const PRESET_CATEGORIES = [
  'Back Covers & Cases',
  'Power Banks',
  'Bluetooth Speakers',
  'Feature / Keypad Phones',
  'Memory Cards & OTG',
  'Cables & Adapters',
  'Spare Parts & Screens',
  'Tablets & iPads',
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setName('');
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a category name');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const trimmedName = name.trim();
      const res = await api.addCategory({
        name: trimmedName,
      });

      setSuccessMessage(`Category "${trimmedName}" created successfully!`);

      if (onCategoryAdded) {
        onCategoryAdded(trimmedName, res.category);
      }

      setTimeout(() => {
        setSuccessMessage('');
        setName('');
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/70 via-blue-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Create New Category</h3>
              <p className="text-slate-500 text-[11px]">
                Enter a category name for products & inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Only Category Name */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl flex items-center gap-2 shadow-2xs">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category Name Input */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Category Name *</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Back Covers & Cases, Power Banks, Keypad Phones"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-hidden font-semibold text-slate-900 shadow-2xs transition-all"
            />
          </div>

          {/* Quick Suggestions Chips */}
          <div>
            <div className="flex items-center gap-1 text-slate-500 font-semibold mb-1.5 text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Quick Suggestions (Optional):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setName(preset)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Save Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

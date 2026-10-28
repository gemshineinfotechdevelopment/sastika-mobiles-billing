import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, FolderPlus, Check, Tag, Trash2, Loader2, Layers, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import type { CategoryItem } from '../../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (categoryName: string, category: CategoryItem) => void;
  onCategoryDeleted?: (categoryName: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
  onCategoryDeleted,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [lastAddedCategory, setLastAddedCategory] = useState<string>('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all categories whenever modal opens
  const fetchAllCategories = async () => {
    setFetchingCategories(true);
    try {
      const res = await api.getCategories();
      if (res && res.categories) {
        const formatted: CategoryItem[] = res.categories.map((c: any) =>
          typeof c === 'string' ? { name: c, itemCount: 0 } : c
        );
        setCategoriesList(formatted);
      }
    } catch (err: any) {
      console.warn('Could not load categories in modal:', err);
    } finally {
      setFetchingCategories(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName('');
      setLastAddedCategory('');
      setShowAllCategories(false);
      setSuccessMessage('');
      setErrorMessage('');
      setCategoryToDelete(null);
      fetchAllCategories();
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  const trimmedInput = name.trim();

  // Filter logic: Whatever is typed, ONLY that is shown.
  // Other categories are not shown unless the user explicitly toggles "Show all categories".
  const filteredCategories = useMemo(() => {
    if (trimmedInput) {
      return categoriesList.filter((c) =>
        c.name.toLowerCase().includes(trimmedInput.toLowerCase())
      );
    }
    if (lastAddedCategory) {
      return categoriesList.filter(
        (c) => c.name.toLowerCase() === lastAddedCategory.toLowerCase()
      );
    }
    if (showAllCategories) {
      return categoriesList;
    }
    return [];
  }, [categoriesList, trimmedInput, lastAddedCategory, showAllCategories]);

  if (!isOpen) return null;

  // Handle adding new category
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a category name');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const trimmedName = name.trim();
      const res = await api.addCategory({
        name: trimmedName,
      });

      const newCategoryObj: CategoryItem = res.category || {
        name: trimmedName,
        itemCount: 0,
      };

      setCategoriesList((prev) => {
        const exists = prev.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (exists) return prev;
        return [newCategoryObj, ...prev];
      });

      setSuccessMessage(`Category "${trimmedName}" created successfully!`);
      setLastAddedCategory(trimmedName);
      setName('');

      if (onCategoryAdded) {
        onCategoryAdded(trimmedName, newCategoryObj);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  // Confirm and delete category
  const confirmDeleteCategory = async (cat: CategoryItem) => {
    const catIdentifier = cat._id || cat.id || cat.name;
    setDeletingId(cat.name);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.deleteCategory(catIdentifier);
      setSuccessMessage(res.message || `Category "${cat.name}" deleted successfully!`);

      // Remove from modal list
      setCategoriesList((prev) => prev.filter((c) => c.name.toLowerCase() !== cat.name.toLowerCase()));

      if (lastAddedCategory.toLowerCase() === cat.name.toLowerCase()) {
        setLastAddedCategory('');
      }

      // Notify parent component
      if (onCategoryDeleted) {
        onCategoryDeleted(cat.name);
      }

      setCategoryToDelete(null);
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to delete category "${cat.name}"`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/80 via-blue-50/60 to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Manage Product Categories</h3>
              <p className="text-slate-500 text-[11px]">
                Create new categories or delete existing ones
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

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Notifications */}
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl flex items-center gap-2 shadow-2xs animate-in fade-in">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Delete Confirmation Modal / Banner */}
          {categoryToDelete && (
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl shadow-xs space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 text-xs">
                    Confirm Deletion: "{categoryToDelete.name}"?
                  </h4>
                  <p className="text-amber-800 text-[11px]">
                    {Number(categoryToDelete.itemCount || 0) > 0 ? (
                      <>
                        <span className="font-bold text-amber-950">
                          {categoryToDelete.itemCount} product(s)
                        </span>{' '}
                        are currently assigned to this category. Deleting it will safely reassign them to{' '}
                        <span className="font-bold">Accessories</span>.
                      </>
                    ) : (
                      'This category has no products. Are you sure you want to permanently remove it?'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingId === categoryToDelete.name}
                  onClick={() => confirmDeleteCategory(categoryToDelete)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {deletingId === categoryToDelete.name ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Category</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Add New Category Input */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Category Name</span>
            </h4>

            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) {
                      setLastAddedCategory('');
                    }
                  }}
                  placeholder="Type category name to search or add..."
                  className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-hidden font-semibold text-slate-900 shadow-2xs transition-all placeholder:font-normal placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FolderPlus className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? 'Adding...' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Matching Existing Categories List with DELETE option */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  {trimmedInput
                    ? `Existing Category matching "${trimmedInput}"`
                    : lastAddedCategory
                    ? `Newly Added Category`
                    : showAllCategories
                    ? `All Categories (${categoriesList.length})`
                    : `Existing Category`}
                </span>
              </h4>

              {/* Toggle to optionally see all categories when not actively searching */}
              {!trimmedInput && !lastAddedCategory && categoriesList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showAllCategories ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hide All</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>View All ({categoriesList.length})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {fetchingCategories ? (
              <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs">Loading categories...</span>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-6 px-4 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs space-y-1">
                {trimmedInput ? (
                  <>
                    <p className="font-semibold text-slate-700">
                      No existing category named "{trimmedInput}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Click the <span className="font-bold text-indigo-600">"Add"</span> button above to create it.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-600">
                      Type a category name above to search or manage.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Only the category you type will be shown here.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto shadow-2xs bg-white">
                {filteredCategories.map((cat) => {
                  const isDeleting = deletingId === cat.name;
                  const count = Number(cat.itemCount || 0);

                  return (
                    <div
                      key={cat._id || cat.name}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-800 text-xs truncate block">
                            {cat.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            count > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>

                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setCategoryToDelete(cat)}
                          title={`Delete category "${cat.name}"`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer group-hover:opacity-100 disabled:opacity-40"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">
            Deleting a category moves its products to Accessories
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
